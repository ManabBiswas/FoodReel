import FoodFestEvent from "../models/FoodFestEvent.model.js";
import FoodFestTier from "../models/FoodFestTier.model.js";
import FoodFestTicket from "../models/FoodFestTicket.model.js";
import paymentService from "../../services/payment.service.js";
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
