import mongoose from "mongoose";

const eventProposalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    venue: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        gpsLoc: { type: String, required: true },
        maxCapacity: { type: Number, min: 50 }
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    salesStart: {
        type: Date,
        required: true
    },
    salesEnd: {
        type: Date,
        required: true
    },
    bannerImage: {
        type: String // ImageKit URL, optional at proposal stage
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    otherInfo: {
        type: String,
        trim: true  
    },
    // Fields to track when converted to real event
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestEvent'
    },
    // Admin review audit trail
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index to quickly find pending proposals
eventProposalSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('EventProposal', eventProposalSchema);