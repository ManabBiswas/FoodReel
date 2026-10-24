import mongoose from "mongoose";
import FoodFestTicket from "../models/FoodFestTicket.model.js";
import FoodFestTier from "../models/FoodFestTier.model.js";
import FoodFestEvent from "../models/FoodFestEvent.model.js";
import qrService from "../services/foodfest.qr.service.js";
import emailService from "../services/email.service.js";
import paymentService from "./payment.service.js";
import { supportsTransactions } from "./transactionSupport.js";

/**
 * Turn a paid FoodFest ticket into a valid one.
 *
 * Two things this must get right:
 *
 *  1. ATOMICITY. Ticket status, tier inventory (reserved -> sold) and the QR
 *     token all have to move together. Previously each was a separate write, so
 *     a failure between them left a 'valid' ticket whose inventory was never
 *     decremented, or a decremented tier with no ticket.
 *
 *  2. CLAIMING. Finalisation decrements `reserved`, so running it twice
 *     double-decrements it and drives inventory negative. The claim is a
 *     conditional update that only matches while the ticket is still
 *     pending_payment, so exactly one caller can proceed.
 */
export const finalizeTicketPayment = async (razorpayOrderId, paymentId, signature, session = null) => {
    const ownsTransaction = !session;

    let tx = session;   // Will be null if !ownsTransaction 
    if (ownsTransaction && (await supportsTransactions())) {
        tx = await mongoose.startSession();
        tx.startTransaction();  //This prevents double‑finalisation
    }
    const ownsTxn = ownsTransaction && tx !== null;

    try {
        // 1. Claim the ticket: pending_payment -> valid, in one atomic step.
        //    A ticket that is already valid simply does not match.
        const ticket = await FoodFestTicket.findOneAndUpdate(
            { "paymentDetails.razorpayOrderId": razorpayOrderId, status: "pending_payment" },
            {
                $set: {
                    status: "valid",
                    "paymentDetails.razorpayPaymentId": paymentId,
                    "paymentDetails.razorpaySignature": signature,
                    "paymentDetails.paidAt": new Date(),
                },
            },
            { session: tx, new: true }
        );

        if (!ticket) {
            // Either it was never created against this gateway order, or it is
            // no longer waiting for payment. Distinguish every case: treating
            // "any existing ticket" as success reported a paid-but-expired
            // ticket as verified and left the captured money with no refund.
            const existing = await FoodFestTicket.findOne({
                "paymentDetails.razorpayOrderId": razorpayOrderId
            }).session(tx);

            if (!existing) {
                if (ownsTxn) await tx.abortTransaction();
                console.error(`No FoodFestTicket found for razorpayOrderId: ${razorpayOrderId}`);
                return { success: false, code: "TICKET_NOT_FOUND", message: "Ticket not found for this payment" };
            }
            if (ownsTxn) await tx.abortTransaction();

            // Already finalised by another delivery (verify endpoint / webhook)
            // or already admitted at the gate. Idempotent success.
            if (existing.status === "valid" || existing.status === "used") {
                return { success: true, alreadyFinalised: true, ticket: existing };
            }

            if (existing.status === "refunded") {
                return {
                    success: false,
                    code: "TICKET_REFUNDED",
                    refunded: true,
                    refundId: existing.refundId,
                    message: "This ticket was refunded because it expired before the payment was confirmed."
                };
            }

            // The ticket left pending_payment before this payment arrived: the
            // sweeper normally expired it (15-minute window) or it was cancelled
            if (existing.status === "expired" || existing.status === "cancelled") {
                const refund = await refundUnfinalisedTicket(existing, paymentId);
                return {
                    success: false,
                    code: "TICKET_EXPIRED",
                    refunded: !!refund.refunded,
                    refundId: refund.refundId,
                    message: refund.refunded
                        ? "The ticket expired before the payment was confirmed. A refund was initiated automatically."
                        : refund.inFlight
                            ? "The ticket expired before the payment was confirmed. A refund is already being processed."
                            : "The ticket expired before the payment was confirmed and the automatic refund could not be started. Please contact support."
                };
            }

            // A concurrent finaliser may still hold the claim. Tell the caller
            // to retry rather than claiming a state we cannot see yet.
            return {
                success: false,
                code: "TICKET_NOT_FINALISED",
                message: "The payment is still being confirmed. Please retry in a moment."
            };
        }

        // 2. Move inventory from reserved to sold, in the same transaction.
        const tier = await FoodFestTier.findByIdAndUpdate(
            ticket.tierId,
            { $inc: { reserved: -1, sold: 1 } },
            { session: tx, new: true }
        );

        if (!tier) {
            throw new Error("Ticket tier not found while finalising payment");
        }

        // 3. Generate the QR. Inside the transaction so a QR failure rolls the
        //    whole thing back rather than leaving a valid ticket with no QR.
        const event = await FoodFestEvent.findById(ticket.eventId).session(tx);
        if (!event) {
            throw new Error("Event not found while finalising ticket payment");
        }

        const qrToken = qrService.generateQRToken(ticket._id, event._id, event.endTime);
        const qrImageUrl = await qrService.createQRImage(qrToken);

        ticket.qrToken = qrToken;
        ticket.qrImageUrl = qrImageUrl;
        await ticket.save({ session: tx });

        if (ownsTxn) await tx.commitTransaction();

        // 4. Confirmation email is non-blocking and OUTSIDE the transaction
        sendTicketConfirmation(ticket, event, qrImageUrl);

        return { success: true, ticket };
    } catch (error) {
        if (ownsTxn && tx.inTransaction()) {
            await tx.abortTransaction().catch(() => {});
        }
        console.error("Finalize ticket payment error:", error);
        throw error;
    } finally {
        if (ownsTxn) await tx.endSession();
    }
};

/**
 * Refund a ticket whose payment was captured after it left pending_payment.
 *
 * The claim is a short-lived lock, not a status change: the ticket stays
 * `expired` until the gateway confirms, so a crash mid-call cannot leave a
 * ticket marked refunded without a refund. Concurrent verify/webhook callers
 * are serialised by the lock, which expires after 10 minutes so a crashed
 * claim can be retried. The captured payment id is persisted with the claim,
 * so a failed refund remains identifiable without the original request.
 */
const REFUND_CLAIM_TTL_MS = 10 * 60 * 1000;

const refundUnfinalisedTicket = async (ticket, paymentId) => {
    const staleBefore = new Date(Date.now() - REFUND_CLAIM_TTL_MS);

    const claimed = await FoodFestTicket.findOneAndUpdate(
        {
            _id: ticket._id,
            status: ticket.status,
            $or: [
                { refundClaimedAt: { $exists: false } },
                { refundClaimedAt: { $lt: staleBefore } }
            ]
        },
        {
            $set: {
                refundClaimedAt: new Date(),
                "paymentDetails.razorpayPaymentId": paymentId
            }
        },
        { new: true }
    );

    if (!claimed) {
        // Another verify/webhook delivery is already refunding this ticket.
        return { refunded: false, inFlight: true };
    }

    // Razorpay refunds take the amount in rupees; razorpayAmount is stored in paise.
    const amount = ticket.paymentDetails?.razorpayAmount
        ? ticket.paymentDetails.razorpayAmount / 100
        : ticket.priceAtPurchase;

    let result;
    try {
        result = await paymentService.refundPayment(paymentId, amount, {
            kind: "foodfest_ticket",
            ticketId: String(ticket._id),
            reason: "Ticket expired before payment confirmation"
        });

        if (!result?.refund?.id) {
            throw new Error("gateway returned no refund id");
        }
    } catch (error) {
        console.error(`Ticket ${ticket._id}: automatic refund failed:`, error.message);
        await FoodFestTicket.updateOne(
            { _id: ticket._id, status: ticket.status },
            { $unset: { refundClaimedAt: "" } }
        );
        return { refunded: false, failed: true, error: error.message };
    }

    try {
        await FoodFestTicket.updateOne(
            { _id: ticket._id, status: ticket.status },
            {
                $set: {
                    status: "refunded",
                    refundId: result.refund.id,
                    refundedAt: new Date()
                },
                $unset: { refundClaimedAt: "" }
            }
        );
    } catch (persistError) {
        // The money did move. Do not invite an immediate retry just because
        // the ledger write failed; the claim lock expires and support can see
        // the refund in the gateway dashboard.
        console.error(
            `Ticket ${ticket._id}: refund ${result.refund.id} succeeded but could not be recorded:`,
            persistError.message
        );
    }

    return { refunded: true, refundId: result.refund.id };
};

const sendTicketConfirmation = (ticket, event, qrImageUrl) => {
    // Fire and forget — never let a mail problem surface to the buyer.
    Promise.resolve()
        .then(async () => {
            const user = await mongoose.model("User").findById(ticket.user).select("email firstName");
            if (!user?.email) {
                console.error(`Ticket ${ticket._id}: no user email for confirmation`);
                return;
            }
            await emailService.sendEmail(
                user.email,
                "Your FoodFest Ticket is Ready!",
                `Hi ${user.firstName || ''}, your ticket for ${event.name} has been verified. Your QR ticket: ${qrImageUrl}`
            );
        })
        .catch((e) => console.error("Ticket confirmation email failed:", e.message));
};
