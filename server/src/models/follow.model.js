import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'followerModel',
        required: true
    },
    followerModel: {
        type: String,
        required: true,
        enum: ['User', 'FoodPartner']
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'followingModel',
        required: true
    },
    followingModel: {
        type: String,
        required: true,
        enum: ['User', 'FoodPartner']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for efficient queries
followSchema.index({ follower: 1, followerModel: 1 });
followSchema.index({ following: 1, followingModel: 1 });

const followModel = mongoose.model("Follow", followSchema);

export default followModel;
