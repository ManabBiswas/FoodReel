import mongoose from "mongoose";

const foodFestStallApplicationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestEvent',
        required: true
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodPartner',
        required: true
    },
    proposedItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food'
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        required: true
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    rejectionReason: String,
    isOpen: {
        type: Boolean,
        default: false
    },
    // Public display details the partner fills in when applying. All optional:
    // the stall still renders from proposedItems (image, price chart) without them.
    position: {
        type: String,
        maxlength: 120
    },
    timings: {
        type: String,
        maxlength: 120
    },
    conditions: {
        type: String,
        maxlength: 300
    },
    // Front-view photo of the stall setup (ImageKit URL, set with the rest
    // of the display fields on apply).
    image: {
        type: String,
        maxlength: 500
    },
    // Aggregates maintained by the review/upvote endpoints, never by clients.
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ratingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Ensure one application per partner per event
foodFestStallApplicationSchema.index({ eventId: 1, foodPartner: 1 }, { unique: true });
foodFestStallApplicationSchema.index({ eventId: 1, status: 1 });

export default mongoose.model('FoodFestStallApplication', foodFestStallApplicationSchema);
