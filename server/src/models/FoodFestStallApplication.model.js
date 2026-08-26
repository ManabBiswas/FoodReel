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
    }
}, {
    timestamps: true
});

// Ensure one application per partner per event
foodFestStallApplicationSchema.index({ eventId: 1, foodPartner: 1 }, { unique: true });
foodFestStallApplicationSchema.index({ eventId: 1, status: 1 });

export default mongoose.model('FoodFestStallApplication', foodFestStallApplicationSchema);
