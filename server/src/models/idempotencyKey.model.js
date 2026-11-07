import mongoose from "mongoose";

/**
 * Idempotency keys for unsafe POSTs that create money-bearing documents.
 *
 * A retried `POST /api/orders` — a double tap, a flaky mobile connection, a client-side retry — creates a second order. Two orders means two payments and two deliveries for one intent.
 *
    The client sends `Idempotency-Key: <uuid>`. The unique index on (scope, key, user) is what makes "is this the first time?" atomic: a read-then-insert would let two concurrent requests both believe they were first, exactly like the refund race.
 */
const idempotencyKeySchema = new mongoose.Schema({
    scope: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    // Scoped per user so one user's key cannot replay another user's request
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // in_progress | completed
    status: {
        type: String,
        enum: ['in_progress', 'completed'],
        default: 'in_progress',
        required: true,
    },
    httpStatus: Number,
    response: mongoose.Schema.Types.Mixed,
}, {
    timestamps: true,
});

idempotencyKeySchema.index({ scope: 1, key: 1, user: 1 }, { unique: true });

// Keys are only useful while a retry is plausible.
idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const idempotencyKeyModel = mongoose.model("IdempotencyKey", idempotencyKeySchema);

export default idempotencyKeyModel;
