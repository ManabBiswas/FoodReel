import mongoose from "mongoose";

/**
 * Ledger of processed Razorpay webhook events.
 */
const paymentWebhookEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
    },
    event: {
        type: String,
        required: true,
    },
    // What we did with it, for auditing: applied | ignored | rejected
    outcome: {
        type: String,
        enum: ['applied', 'ignored', 'rejected', 'error'],
        required: true,
    },
    detail: String,
    receivedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

paymentWebhookEventSchema.index({ event: 1, receivedAt: -1 });

// Keep the ledger from growing without bound; 30 days is well past Razorpay's retry window.
paymentWebhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const paymentWebhookEventModel = mongoose.model("PaymentWebhookEvent", paymentWebhookEventSchema);

export default paymentWebhookEventModel;
