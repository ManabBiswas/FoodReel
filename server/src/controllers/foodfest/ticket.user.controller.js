import FoodFestEvent from "../../models/FoodFestEvent.model.js";
import FoodFestTier from "../../models/FoodFestTier.model.js";
import FoodFestTicket from "../../models/FoodFestTicket.model.js";
import paymentService from "../../services/payment.service.js";
import { verifyTicketPaymentBinding } from "../../services/payment.verification.js";
import { finalizeTicketPayment } from "../../services/foodfest.ticket.service.js";
import mongoose from "mongoose";

export const browseEvents = async (req, res) => {
    try {
        const events = await FoodFestEvent.find({ status: 'published' })
            .select('name description venue startTime endTime bannerImage')
            .sort({ startTime: 1 });
        
        res.status(200).json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getEventDetails = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await FoodFestEvent.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        const tiers = await FoodFestTier.find({ eventId, active: true });
        
        res.status(200).json({ 
            success: true, 
            event, 
            tiers 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const purchaseTicket = async (req, res) => {
    try {
        const { eventId, tierId } = req.body;
        const userId = req.user._id;

        if (!eventId || !tierId) {
            return res.status(400).json({ success: false, message: "eventId and tierId are required" });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Atomic decrement of inventory (reserve)
            const tier = await FoodFestTier.findOneAndUpdate(
                { 
                    _id: tierId, 
                    eventId,
                    $expr: { $lt: [{ $add: ['$sold', '$reserved'] }, '$quantity'] } 
                },
                { $inc: { reserved: 1 } },
                { session, new: true }
            );

            if (!tier) {
                await session.abortTransaction();
                return res.status(409).json({ success: false, message: "Ticket tier is sold out or unavailable" });
            }

            const event = await FoodFestEvent.findById(eventId).session(session);
            if (!event) {
                await session.abortTransaction();
                return res.status(404).json({ success: false, message: "Event not found" });
            }

            // Validate sales window
            const now = new Date();
            if (now < event.salesStart || now > event.salesEnd) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: "Tickets are not currently on sale" });
            }

            // Create ticket in pending_payment status
            const ticket = await FoodFestTicket.create([
                {
                    eventId,
                    tierId,
                    user: userId,
                    status: 'pending_payment',
                    priceAtPurchase: tier.price,
                    currency: tier.currency
                }
            ], { session })[0];

            // Create Razorpay Order
            const razorpayOrder = await paymentService.createOrder(
                tier.price,
                tier.currency,
                `ticket_${ticket._id}`,
                {
                    ticketId: ticket._id.toString(),
                    userId: userId.toString(),
                    kind: 'foodfest_ticket'
                }
            );

            if (!razorpayOrder.success) {
                throw new Error("Failed to create payment order");
            }

            ticket.paymentDetails.razorpayOrderId = razorpayOrder.order_id;
            ticket.paymentDetails.razorpayAmount = razorpayOrder.amount;
            await ticket.save({ session });

            await session.commitTransaction();

            res.status(201).json({
                success: true,
                razorpayOrderId: razorpayOrder.order_id,
                amount: razorpayOrder.amount / 100,
                currency: razorpayOrder.currency,
                ticketId: ticket._id,
                keyId: paymentService.getKeyId()
            });
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error("Purchase ticket error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Verify a FoodFest ticket payment.
 */
export const verifyTicketPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            ticketId
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !ticketId) {
            return res.status(400).json({
                success: false,
                message: "Missing required payment parameters"
            });
        }

        const signatureValid = paymentService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!signatureValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        const ticket = await FoodFestTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        if (ticket.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "This ticket belongs to another user" });
        }

        // Ask the gateway what was actually paid; never trust client values.
        let gatewayPayment = null;
        try {
            const fetched = await paymentService.getPaymentDetails(razorpay_payment_id);
            gatewayPayment = fetched?.payment ?? null;
        } catch (err) {
            console.error(`Razorpay ticket payment fetch failed for ${razorpay_payment_id}:`, err.message);
            return res.status(502).json({
                success: false,
                message: "Could not confirm the payment with the payment gateway. Please retry."
            });
        }

        const binding = verifyTicketPaymentBinding({
            ticket,
            razorpayOrderId: razorpay_order_id,
            gatewayPayment
        });

        if (!binding.ok) {
            console.error(
                `Ticket payment binding rejected for ticket ${ticket._id}: ${binding.code}`
            );
            return res.status(binding.status).json({
                success: false,
                message: binding.message,
                code: binding.code
            });
        }

        const result = await finalizeTicketPayment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message || "Could not finalise this ticket",
                code: result.code
            });
        }

        return res.status(200).json({
            success: true,
            message: result.alreadyFinalised
                ? "Ticket was already verified"
                : "Ticket payment verified successfully",
            alreadyFinalised: !!result.alreadyFinalised,
            ticket: {
                id: result.ticket._id,
                status: result.ticket.status,
                qrToken: result.ticket.qrToken,
                qrImageUrl: result.ticket.qrImageUrl
            }
        });
    } catch (error) {
        console.error("Ticket payment verification error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Ticket payment verification failed"
        });
    }
};

export const getMyTickets = async (req, res) => {
    try {
        const userId = req.user._id;
        const tickets = await FoodFestTicket.find({ user: userId })
            .populate('eventId', 'name startTime endTime')
            .populate('tierId', 'name price');
        
        res.status(200).json({ success: true, tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
