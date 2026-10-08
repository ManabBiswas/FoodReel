import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { decideWebhookAction, ACTION, REASON } from '../src/services/webhook.handler.js';

/**
 * Webhooks are the gateway's word, retried until we return 2xx. Two failure
 * modes are being fixed here:
 *
 *  1. A late `payment.failed` could set an ALREADY PAID order to cancelled.
 *  2. `payment.captured` had no binding or amount check, so any captured
 *     payment named in the notes could mark an order paid.
 *
 * decideWebhookAction is pure: it decides, the controller applies.
 */

const paidOrder = (over = {}) => ({
    _id: 'o1',
    status: 'confirmed',
    currency: 'INR',
    pricing: { totalAmount: 2000 },
    paymentDetails: {
        method: 'razorpay',
        status: 'completed',
        razorpayOrderId: 'order_ABC',
        razorpayAmount: 200000,
        razorpayPaymentId: 'pay_ABC',
    },
    cancellation: { isCancelled: false },
    ...over,
});

const freshOrder = (over = {}) =>
    paidOrder({
        status: 'pending',
        paymentDetails: {
            method: 'razorpay',
            status: 'processing',
            razorpayOrderId: 'order_ABC',
            razorpayAmount: 200000,
        },
        ...over,
    });

const captured = (over = {}) => ({
    id: 'pay_ABC',
    order_id: 'order_ABC',
    amount: 200000,
    currency: 'INR',
    status: 'captured',
    method: 'upi',
    notes: { orderId: 'o1' },
    ...over,
});

describe('payment.captured', () => {
    test('applies a clean, fully-bound capture', () => {
        const result = decideWebhookAction({ event: 'payment.captured', entity: captured(), order: freshOrder() });
        assert.equal(result.action, ACTION.APPLY);
        assert.equal(result.changes.paymentStatus, 'completed');
        assert.equal(result.changes.orderStatus, 'confirmed');
    });

    test('is idempotent: the same capture twice applies only once', () => {
        const result = decideWebhookAction({
            event: 'payment.captured',
            entity: captured(),
            order: paidOrder(), // already completed by this same payment
        });
        assert.equal(result.action, ACTION.IGNORE);
        assert.equal(result.reason, REASON.ALREADY_SETTLED);
    });

    test('flags a SECOND, different payment against an already-paid order', () => {
        // Double payment: the user paid twice. Never silently ignore — the extra
        // money has to be refunded, so this must be surfaced, not dropped.
        const result = decideWebhookAction({
            event: 'payment.captured',
            entity: captured({ id: 'pay_SECOND' }),
            order: paidOrder(),
        });
        assert.equal(result.action, ACTION.REJECT);
        assert.equal(result.code, 'DUPLICATE_CAPTURE');
    });

    test('refuses a capture whose gateway order is not ours', () => {
        const result = decideWebhookAction({
            event: 'payment.captured',
            entity: captured({ order_id: 'order_SOMEONE_ELSE' }),
            order: freshOrder(),
        });
        assert.equal(result.action, ACTION.REJECT);
        assert.equal(result.code, 'PAYMENT_ORDER_MISMATCH');
    });

    test('refuses a capture for a different amount than we asked for', () => {
        const result = decideWebhookAction({
            event: 'payment.captured',
            entity: captured({ amount: 1000 }),
            order: freshOrder(),
        });
        assert.equal(result.action, ACTION.REJECT);
        assert.equal(result.code, 'AMOUNT_MISMATCH');
    });

    test('refuses a capture on a cancelled order and flags it for refund', () => {
        const order = freshOrder({
            status: 'cancelled',
            cancellation: { isCancelled: true, cancelledBy: 'user' },
        });
        const result = decideWebhookAction({ event: 'payment.captured', entity: captured(), order });
        assert.equal(result.action, ACTION.REJECT);
        assert.equal(result.code, 'ORDER_CANCELLED');
    });

    test('ignores when the order cannot be located', () => {
        const result = decideWebhookAction({ event: 'payment.captured', entity: captured(), order: null });
        assert.equal(result.action, ACTION.IGNORE);
        assert.equal(result.reason, REASON.ORDER_NOT_FOUND);
    });

    test('rejects a COD order touched by an online capture', () => {
        const order = freshOrder({
            paymentDetails: { method: 'cod', status: 'pending', razorpayOrderId: 'order_ABC', razorpayAmount: 200000 },
        });
        const result = decideWebhookAction({ event: 'payment.captured', entity: captured(), order });
        assert.equal(result.action, ACTION.REJECT);
        assert.equal(result.code, 'NOT_RAZORPAY');
    });
});

describe('payment.failed — must never cancel a paid order', () => {
    test('THE BUG: a stale failure cannot cancel an already-paid order', () => {
        const result = decideWebhookAction({
            event: 'payment.failed',
            entity: { id: 'pay_ABC', order_id: 'order_ABC', status: 'failed' },
            order: paidOrder(),
        });
        assert.equal(result.action, ACTION.IGNORE);
        assert.equal(result.reason, REASON.ALREADY_SETTLED);
    });

    test('ignores a failure for a refunded order', () => {
        const result = decideWebhookAction({
            event: 'payment.failed',
            entity: { id: 'pay_ABC', order_id: 'order_ABC', status: 'failed' },
            order: paidOrder({
                paymentDetails: { ...paidOrder().paymentDetails, status: 'refunded' },
            }),
        });
        assert.equal(result.action, ACTION.IGNORE);
    });

    test('applies a failure to a genuinely unpaid order', () => {
        const result = decideWebhookAction({
            event: 'payment.failed',
            entity: { id: 'pay_ABC', order_id: 'order_ABC', status: 'failed' },
            order: freshOrder(),
        });
        assert.equal(result.action, ACTION.APPLY);
        assert.equal(result.changes.paymentStatus, 'failed');
        assert.equal(result.changes.orderStatus, 'cancelled');
    });

    test('ignores a failure already recorded (duplicate delivery)', () => {
        const order = freshOrder({
            paymentDetails: { ...freshOrder().paymentDetails, status: 'failed' },
        });
        const result = decideWebhookAction({
            event: 'payment.failed',
            entity: { id: 'pay_ABC', order_id: 'order_ABC', status: 'failed' },
            order,
        });
        assert.equal(result.action, ACTION.IGNORE);
        assert.equal(result.reason, REASON.ALREADY_RECORDED);
    });

    test('refuses a failure for a different gateway order', () => {
        const result = decideWebhookAction({
            event: 'payment.failed',
            entity: { id: 'pay_X', order_id: 'order_OTHER', status: 'failed' },
            order: freshOrder(),
        });
        assert.equal(result.action, ACTION.REJECT);
        assert.equal(result.code, 'PAYMENT_ORDER_MISMATCH');
    });

    test('refuses to cancel an order that is already being prepared', () => {
        // Unpaid fulfilment is its own bug, but the failure webhook must not
        // make it worse by rewriting a live order.
        const result = decideWebhookAction({
            event: 'payment.failed',
            entity: { id: 'pay_ABC', order_id: 'order_ABC', status: 'failed' },
            order: freshOrder({ status: 'preparing' }),
        });
        assert.equal(result.action, ACTION.REJECT);
        assert.equal(result.code, 'ORDER_ALREADY_IN_PROGRESS');
    });
});

describe('refund events', () => {
    test('applies refund.processed', () => {
        const result = decideWebhookAction({
            event: 'refund.processed',
            entity: { id: 'rfnd_1', payment_id: 'pay_ABC', amount: 200000 },
            order: paidOrder(),
        });
        assert.equal(result.action, ACTION.APPLY);
        assert.equal(result.changes.refundStatus, 'completed');
        assert.equal(result.changes.refundAmount, 2000);
    });

    test('ignores a refund for an unknown payment', () => {
        const result = decideWebhookAction({
            event: 'refund.processed',
            entity: { id: 'rfnd_1', payment_id: 'pay_UNKNOWN' },
            order: null,
        });
        assert.equal(result.action, ACTION.IGNORE);
    });

    test('does not let refund.failed undo a completed refund', () => {
        const order = paidOrder({ cancellation: { isCancelled: true, refundStatus: 'completed' } });
        const result = decideWebhookAction({
            event: 'refund.failed',
            entity: { id: 'rfnd_1', payment_id: 'pay_ABC' },
            order,
        });
        assert.equal(result.action, ACTION.IGNORE);
        assert.equal(result.reason, REASON.ALREADY_SETTLED);
    });

    test('applies refund.failed when a refund is genuinely pending', () => {
        const order = paidOrder({ cancellation: { isCancelled: true, refundStatus: 'processing' } });
        const result = decideWebhookAction({
            event: 'refund.failed',
            entity: { id: 'rfnd_1', payment_id: 'pay_ABC' },
            order,
        });
        assert.equal(result.action, ACTION.APPLY);
        assert.equal(result.changes.refundStatus, 'failed');
    });
});

describe('order.paid', () => {
    test('applies a clean order.paid', () => {
        const result = decideWebhookAction({
            event: 'order.paid',
            entity: { id: 'order_ABC', notes: { orderId: 'o1' } },
            order: freshOrder(),
        });
        assert.equal(result.action, ACTION.APPLY);
        assert.equal(result.changes.paymentStatus, 'completed');
    });

    test('refuses order.paid for an order that is cancelled', () => {
        const order = freshOrder({ status: 'cancelled', cancellation: { isCancelled: true } });
        const result = decideWebhookAction({
            event: 'order.paid',
            entity: { id: 'order_ABC', notes: { orderId: 'o1' } },
            order,
        });
        assert.equal(result.action, ACTION.REJECT);
        assert.equal(result.code, 'ORDER_CANCELLED');
    });
});

describe('unknown and malformed events', () => {
    test('ignores an unhandled event type', () => {
        const result = decideWebhookAction({ event: 'subscription.charged', entity: {}, order: freshOrder() });
        assert.equal(result.action, ACTION.IGNORE);
        assert.equal(result.reason, REASON.UNHANDLED_EVENT);
    });

    test('never throws on a missing entity', () => {
        for (const event of ['payment.captured', 'payment.failed', 'refund.processed', 'refund.failed', 'order.paid']) {
            const result = decideWebhookAction({ event, entity: undefined, order: freshOrder() });
            assert.equal(typeof result.action, 'string');
        }
    });

    test('never throws on a missing event name', () => {
        const result = decideWebhookAction({ event: undefined, entity: {}, order: freshOrder() });
        assert.equal(result.action, ACTION.IGNORE);
    });

    test('never throws when the order is missing entirely', () => {
        const result = decideWebhookAction({ event: 'payment.captured', entity: captured(), order: undefined });
        assert.equal(result.action, ACTION.IGNORE);
    });
});
