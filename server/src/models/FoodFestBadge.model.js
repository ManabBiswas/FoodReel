import mongoose from "mongoose";

const foodFestBadgeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestEvent',
        required: true
    },
    type: {
        type: String,
        enum: ['early_bird', 'checked_in', 'ordered_at_fest', 'vendor_chef'],
        required: true
    },
    awardedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure uniqueness of badges for a user per event per type
foodFestBadgeSchema.index({ userId: 1, eventId: 1, type: 1 }, { unique: true });

export default mongoose.model('FoodFestBadge', foodFestBadgeSchema);
