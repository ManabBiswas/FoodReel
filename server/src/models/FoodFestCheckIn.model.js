import mongoose from "mongoose";

const foodFestCheckInSchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestTicket',
        required: true
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestZone',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestEvent',
        required: true
    },
    gateStaffId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    gateStaffModel: {
        type: String,
        enum: ['Admin', 'FoodPartner'],
        required: true
    },
    action: {
        type: String,
        enum: ['admit', 'release', 'reject'],
        required: true
    },
    rejectReason: {
        type: String,
        enum: ['invalid_token', 'already_used', 'zone_full', 'event_not_live', 'wrong_event_zone']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

foodFestCheckInSchema.index({ eventId: 1, timestamp: -1 });
foodFestCheckInSchema.index({ ticketId: 1 });
foodFestCheckInSchema.index({ zoneId: 1 });

export default mongoose.model('FoodFestCheckIn', foodFestCheckInSchema);
