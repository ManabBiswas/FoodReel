import mongoose from "mongoose";
import FoodFestStallApplication from "../../models/FoodFestStallApplication.model.js";
import FoodFestStallReview from "../../models/FoodFestStallReview.model.js";
import FoodFestTicket from "../../models/FoodFestTicket.model.js";
import { serverFail } from "../../utils/apiError.js";

// A paid seat at the event — what a reviewer must hold. 'used' means the
// ticket was scanned at the gate; both count as attendance.
const TICKET_HOLDER_STATUSES = ['valid', 'used'];

const toStallSummary = (stall, userId) => ({
    _id: stall._id,
    owner: {
        name: stall.foodPartner?.companyName || 'FoodReel kitchen'
    },
    position: stall.position || null,
    timings: stall.timings || null,
    conditions: stall.conditions || null,
    image: stall.image || null,
    isOpen: stall.isOpen === true,
    rating: stall.rating || 0,
    ratingCount: stall.ratingCount || 0,
    upvoteCount: stall.upvotes?.length || 0,
    upvoted: userId ? stall.upvotes.some((id) => id.toString() === userId.toString()) : false,
    items: (stall.proposedItems || [])
        .filter((item) => item && item.postType !== 'advertisement' && item.isActive !== false)
        .map((item) => ({
            _id: item._id,
            name: item.name,
            price: item.price ?? null
        }))
});

// GET /api/foodfest/user/events/:eventId/stalls — public. Only approved
// stalls appear; optionalAuth attaches req.user so the caller's own upvote
// state can be flagged.
export const listEventStalls = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!mongoose.isValidObjectId(eventId)) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        const stalls = await FoodFestStallApplication.find({ eventId, status: 'approved' })
            .populate('foodPartner', 'companyName')
            .populate('proposedItems', 'name price postType isActive')
            .sort({ createdAt: 1 })
            .lean();

        res.status(200).json({
            success: true,
            stalls: stalls.map((stall) => toStallSummary(stall, req.user?._id))
        });
    } catch (error) {
        serverFail(res, error);
    }
};

// POST /api/foodfest/user/stalls/:stallId/upvote — any signed-in user may upvote
export const toggleUpvote = async (req, res) => {
    try {
        const { stallId } = req.params;
        const userId = req.user._id;

        // Atomic two-step toggle
        const removed = await FoodFestStallApplication.updateOne(
            { _id: stallId, status: 'approved', upvotes: userId },
            { $pull: { upvotes: userId } }
        );

        if (removed.matchedCount === 0) {
            await FoodFestStallApplication.updateOne(
                { _id: stallId, status: 'approved', upvotes: { $ne: userId } },
                { $addToSet: { upvotes: userId } }
            );
        }

        const stall = await FoodFestStallApplication.findOne({ _id: stallId, status: 'approved' })
            .select('upvotes');
        if (!stall) {
            return res.status(404).json({ success: false, message: "Stall not found" });
        }

        res.status(200).json({
            success: true,
            upvoted: stall.upvotes.some((id) => id.toString() === userId.toString()),
            upvoteCount: stall.upvotes.length
        });
    } catch (error) {
        serverFail(res, error);
    }
};

// GET /api/foodfest/user/stalls/:stallId/reviews — public.
export const listStallReviews = async (req, res) => {
    try {
        const { stallId } = req.params;
        if (!mongoose.isValidObjectId(stallId)) {
            return res.status(404).json({ success: false, message: "Stall not found" });
        }

        // shortcut: newest 50 only, no cursor — upgrade to paginated
        // reviews if a stall ever accumulates more than a screenful
        const reviews = await FoodFestStallReview.find({ stall: stallId })
            .populate('user', 'firstName lastName profileImage')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        serverFail(res, error);
    }
};

// POST /api/foodfest/user/stalls/:stallId/reviews — ticket holders only.
// The stored aggregate on the stall is recalculated from the review itself, so a review write can never leave the displayed rating out of step.
export const createStallReview = async (req, res) => {
    try {
        const { stallId } = req.params;
        const userId = req.user._id;
        const { rating, comment } = req.body;

        const stall = await FoodFestStallApplication.findOne({ _id: stallId, status: 'approved' });
        if (!stall) return res.status(404).json({ success: false, message: "Stall not found" });

        const ticket = await FoodFestTicket.exists({
            eventId: stall.eventId,
            user: userId,
            status: { $in: TICKET_HOLDER_STATUSES }
        });
        if (!ticket) {
            return res.status(403).json({
                success: false,
                message: "Only ticket holders for this event can review this stall."
            });
        }

        let review;
        try {
            review = await FoodFestStallReview.create({ stall: stallId, user: userId, rating, comment });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ success: false, message: "You have already reviewed this stall." });
            }
            throw error;
        }

        const aggregate = await FoodFestStallReview.aggregate([
            { $match: { stall: stall._id } },
            { $group: { _id: '$stall', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);
        const { avg = 0, count = 0 } = aggregate[0] || {};
        await FoodFestStallApplication.updateOne(
            { _id: stall._id },
            { $set: { rating: Math.round(avg * 10) / 10, ratingCount: count } }
        );

        const populated = await review.populate('user', 'firstName lastName profileImage');
        res.status(201).json({ success: true, review: populated });
    } catch (error) {
        serverFail(res, error);
    }
};
