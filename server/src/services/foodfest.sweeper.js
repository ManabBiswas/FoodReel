import FoodFestTicket from "../models/FoodFestTicket.model.js";
import FoodFestTier from "../models/FoodFestTier.model.js";
import mongoose from "mongoose";

let sweeperInterval = null;

export const startTicketSweeper = () => {
    // Run every 60 seconds
    sweeperInterval = setInterval(async () => {
        try {
            await expirePendingTickets();
        } catch (error) {
            console.error("Ticket sweeper error:", error);
        }
    }, 60 * 1000);
    
    console.log("Ticket sweeper scheduled every 60s");
};

export const stopTicketSweeper = () => {
    if (sweeperInterval) clearInterval(sweeperInterval);
};

const expirePendingTickets = async () => {
    const expiryThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

    // Find tickets stuck in pending_payment older than 15 mins
    const expiredTickets = await FoodFestTicket.find({
        status: 'pending_payment',
        createdAt: { $lt: expiryThreshold }
    });

    if (expiredTickets.length === 0) return;

    console.log(`🧹 Sweeper: Expiring ${expiredTickets.length} pending tickets`);

    for (const ticket of expiredTickets) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Update ticket status to expired
            await FoodFestTicket.findByIdAndUpdate(
                ticket._id,
                { status: 'expired' },
                { session }
            );

            // 2. Release tier reservation
            await FoodFestTier.findByIdAndUpdate(
                ticket.tierId,
                { $inc: { reserved: -1 } },
                { session }
            );

            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            console.error(`Failed to expire ticket ${ticket._id}:`, err);
        } finally {
            session.endSession();
        }
    }
};