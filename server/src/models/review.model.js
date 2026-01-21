import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner", 
        required: true
    },
    foodItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "food"
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
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
        maxLength: 1000
    },
    images: [{
        type: String // URLs for review images
    }],
    // Detailed ratings
    ratings: {
        food: {
            type: Number,
            min: 1,
            max: 5
        },
        service: {
            type: Number,
            min: 1,
            max: 5
        },
        ambiance: {
            type: Number,
            min: 1,
            max: 5
        },
        value: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    // Food partner response
    response: {
        text: {
            type: String,
            maxLength: 500
        },
        respondedAt: {
            type: Date
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodPartner"
        }
    },
    helpful: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    helpfulCount: {
        type: Number,
        default: 0
    },
    notHelpful: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    notHelpfulCount: {
        type: Number,
        default: 0
    },
    // Review replies from other users
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        text: {
            type: String,
            required: true,
            maxLength: 300
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    repliesCount: {
        type: Number,
        default: 0
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'approved'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ foodPartner: 1, isActive: 1 });
reviewSchema.index({ foodItem: 1, isActive: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });

const reviewModel = mongoose.model("Review", reviewSchema);

export default reviewModel;