import mongoose from "mongoose";

/**
 * Stall reviews are deliberately separate from the food/partner Review model:
 */
const foodFestStallReviewSchema = new mongoose.Schema({
    stall: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestStallApplication',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }
}, {
    timestamps: true
});

// One review per user per stall.
foodFestStallReviewSchema.index({ stall: 1, user: 1 }, { unique: true });
foodFestStallReviewSchema.index({ stall: 1, createdAt: -1 });

export default mongoose.model('FoodFestStallReview', foodFestStallReviewSchema);
