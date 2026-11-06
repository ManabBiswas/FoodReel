import mongoose from "mongoose";

const foodFestVenueSchema = new mongoose.Schema({
    address: { type: String, required: true },
    city: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    maxCapacity: Number,    // per day
    gpsLoc: String
}, { _id: false });

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
        type: foodFestVenueSchema,
        required: true
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
        refPath: 'organizerType',
        required: true
    },
    organizerType: {
        type: String,
        enum: ['admin', 'user'],
        default: 'admin'
    },
    organizerNotes: {
        type: String,
        trim: true
    },
    // A user-hosted event only becomes manageable by its organizer after an
    // admin grants access. Approval grants it automatically; an admin can
    // revoke or restore it later from the Events tab.
    organizerAccess: {  // TODO: for multiple organizers, this should be an array
        type: Boolean,
        default: false
    },
    organizerAccessGrantedAt: {
        type: Date
    },
    organizerAccessGrantedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
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
