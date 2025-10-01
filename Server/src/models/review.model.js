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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxLength: 500
    },
    images: [{
        type: String // URLs for review images
    }],
    helpful: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    helpfulCount: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const reviewModel = mongoose.model("Review", reviewSchema);

export default reviewModel;