import mongoose from "mongoose";

const foodFestZoneSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestEvent',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    warningThreshold: {
        type: Number,
        default: 80, // Percentage
        min: 0,
        max: 100
    },
    criticalThreshold: {
        type: Number,
        default: 95, // Percentage
        min: 0,
        max: 100
    },
    tracksExit: {
        type: Boolean,
        default: false
    },
    currentCount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAdmitted: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

foodFestZoneSchema.index({ eventId: 1, name: 1 });

export default mongoose.model('FoodFestZone', foodFestZoneSchema);
