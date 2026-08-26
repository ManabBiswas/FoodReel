import mongoose from "mongoose";

const foodFestTicketSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestEvent',
        required: true
    },
    tierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestTier',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending_payment', 'valid', 'used', 'refunded', 'cancelled', 'expired'],
        default: 'pending_payment',
        required: true
    },
    qrToken: {
        type: String,
        unique: true,
        sparse: true
    },
    qrImageUrl: {
        type: String
    },
    paymentDetails: {
        razorpayOrderId: String,
        razorpayPaymentId: String,
        paidAt: Date
    },
    priceAtPurchase: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        enum: ['INR'],
        default: 'INR'
    },
    checkedInAt: Date,
    checkedInZoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestZone'
    },
    checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'checkedInByModel'
    },
    checkedInByModel: {
        type: String,
        enum: ['Admin', 'FoodPartner']
    },
    checkedOutAt: Date,
    checkedOutZoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestZone'
    }
}, {
    timestamps: true
});

foodFestTicketSchema.index({ eventId: 1, status: 1 });
foodFestTicketSchema.index({ user: 1, eventId: 1 });
foodFestTicketSchema.index({ qrToken: 1 });

export default mongoose.model('FoodFestTicket', foodFestTicketSchema);
