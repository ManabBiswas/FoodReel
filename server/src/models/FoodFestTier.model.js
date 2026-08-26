import mongoose from "mongoose";

const foodFestTierSchema = new mongoose.Schema({
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
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        enum: ['INR'],
        default: 'INR'
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    sold: {
        type: Number,
        default: 0,
        min: 0
    },
    reserved: {
        type: Number,
        default: 0,
        min: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    salesStart: {
        type: Date
    },
    salesEnd: {
        type: Date
    }
}, {
    timestamps: true
});

foodFestTierSchema.index({ eventId: 1, active: 1 });

export default mongoose.model('FoodFestTier', foodFestTierSchema);
