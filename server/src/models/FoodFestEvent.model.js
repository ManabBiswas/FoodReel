import mongoose from "mongoose";

const foodFestEventSchema = new mongoose.Schema({
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
        latitude: Number,
        longitude: Number
    },
    bannerImage: {
        type: String, // ImageKit URL
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
    status: {
        type: String,
        enum: ['draft', 'published', 'live', 'completed', 'cancelled'],
        default: 'draft',
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    stats: {
        ticketsSold: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        checkIns: { type: Number, default: 0 },
        currentInside: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Index for public discovery
foodFestEventSchema.index({ status: 1, startTime: 1 });
foodFestEventSchema.index({ "venue.city": 1 });

export default mongoose.model('FoodFestEvent', foodFestEventSchema);
