import mongoose from "mongoose";
import FoodFestTicket from "../models/FoodFestTicket.model.js";
import FoodFestTier from "../models/FoodFestTier.model.js";
import FoodFestEvent from "../models/FoodFestEvent.model.js";
import qrService from "../services/foodfest.qr.service.js";
import emailService from "../services/email.service.js";

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
    const tx = session || (await mongoose.startSession());
    if (ownsTransaction) tx.startTransaction();

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
            // Either it was never created against this gateway order, or another
            // delivery already finalised it. Distinguish the two.
            const existing = await FoodFestTicket.findOne({
                "paymentDetails.razorpayOrderId": razorpayOrderId
            }).session(tx);

            if (!existing) {
                if (ownsTransaction) await tx.abortTransaction();
                console.error(`No FoodFestTicket found for razorpayOrderId: ${razorpayOrderId}`);
                return { success: false, code: "TICKET_NOT_FOUND", message: "Ticket not found for this payment" };
            }
            if (ownsTransaction) await tx.abortTransaction();
            return { success: true, alreadyFinalised: true, ticket: existing };
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

        if (ownsTransaction) await tx.commitTransaction();

        // 4. Confirmation email is non-blocking and OUTSIDE the transaction
        sendTicketConfirmation(ticket, event, qrImageUrl);

        return { success: true, ticket };
    } catch (error) {
        if (ownsTransaction && tx.inTransaction()) {
            await tx.abortTransaction().catch(() => {});
        }
        console.error("Finalize ticket payment error:", error);
        throw error;
    } finally {
        if (ownsTransaction) await tx.endSession();
    }
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
