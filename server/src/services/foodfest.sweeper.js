import FoodFestTicket from "../models/FoodFestTicket.model.js";
import FoodFestTier from "../models/FoodFestTier.model.js";
import mongoose from "mongoose";
import { supportsTransactions } from "./transactionSupport.js";

let sweeperInterval = null;
let isRunning = false;

export const startTicketSweeper = () => {
    if (sweeperInterval) return;

    // Every 60 seconds. The callback is deliberately not async-wrapped by
    // setInterval: isRunning is checked first so a slow sweep never overlaps
    // itself, which is what let two runs claim the same ticket.
    sweeperInterval = setInterval(() => {
        if (isRunning) return;
        isRunning = true;
        expirePendingTickets()
            .catch((error) => console.error("Ticket sweeper error:", error))
            .finally(() => { isRunning = false; });
    }, 60 * 1000);

    console.log("Ticket sweeper scheduled every 60s");
};

export const stopTicketSweeper = () => {
    if (sweeperInterval) {
        clearInterval(sweeperInterval);
        sweeperInterval = null;
    }
};

/** Test seam: run one sweep directly without waiting on the interval. */
export const sweepOnce = () => expirePendingTickets();

const expirePendingTickets = async () => {
    const expiryThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

    // Find tickets stuck in pending_payment older than 15 mins
    const staleTickets = await FoodFestTicket.find({
        status: 'pending_payment',
        createdAt: { $lt: expiryThreshold }
    }).select('_id tierId');

    if (staleTickets.length === 0) return { expired: 0 };

    const useTransaction = await supportsTransactions();
    console.log(`🧹 Sweeper: expiring ${staleTickets.length} pending ticket(s)`);

    let expired = 0;

    for (const ticket of staleTickets) {
        const session = useTransaction ? await mongoose.startSession() : null;

        try {
            if (session) session.startTransaction();

            const claimed = await FoodFestTicket.findOneAndUpdate(
                { _id: ticket._id, status: 'pending_payment' },
                { $set: { status: 'expired' } },
                { session, new: true }
            );

            if (claimed) {
            // Floor at 1 so reserved can never go below zero. It is already 0 when the reservation was released elsewhere, in which case there is nothing to release and the $inc must not run.
                const released = await FoodFestTier.updateOne(
                    { _id: ticket.tierId, reserved: { $gte: 1 } },
                    { $inc: { reserved: -1 } },
                    { session }
                );
                if (released.modifiedCount) expired++;
                else {
                    console.warn(`Sweeper: tier ${ticket.tierId} already at reserved=0 for ticket ${ticket._id}`);
                }
            }

            if (session) {
                if (claimed) await session.commitTransaction();
                else await session.abortTransaction();
            }
        } catch (err) {
            if (session) await session.abortTransaction().catch(() => {});
            console.error(`Failed to expire ticket ${ticket._id}:`, err);
        } finally {
            if (session) session.endSession();
        }
    }

    return { expired };
};
