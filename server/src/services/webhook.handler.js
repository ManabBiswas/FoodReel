/**
 * Webhook decision logic — pure, no database, no network.
 *
 * Razorpay retries an event until it receives a 2xx, so a webhook handler gets
 * the same event many times and gets events that contradict each other. This
 * module decides what a given event means for a given order; the controller
 * applies the decision and owns the database writes.
 *
 * Three outcomes:
 *   APPLY  - safe, idempotent state change
 *   IGNORE - nothing to do (duplicate delivery, unknown order, terminal state)
 *   REJECT - the event is well-formed but contradicts our records. Never mutate
 *            state; log loudly. REJECT is still acknowledged with 2xx, because
 *            retrying will not fix bad data — retrying forever is worse.
 */

import { toPaise } from './payment.verification.js';

export const ACTION = {
    APPLY: 'apply',
    IGNORE: 'ignore',
    REJECT: 'reject',
};

export const REASON = {
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ALREADY_SETTLED: 'ALREADY_SETTLED',
    ALREADY_RECORDED: 'ALREADY_RECORDED',
    UNHANDLED_EVENT: 'UNHANDLED_EVENT',
};

const ignore = (reason, extra = {}) => ({ action: ACTION.IGNORE, reason, ...extra });
const reject = (code, message, extra = {}) => ({ action: ACTION.REJECT, code, message, ...extra });
const apply = (changes, extra = {}) => ({ action: ACTION.APPLY, changes, ...extra });

/** Payment states that must never move again. */
const isSettled = (paymentDetails) =>
    paymentDetails?.status === 'completed' || paymentDetails?.status === 'refunded';

const isCancelled = (order) => order.status === 'cancelled' || order.cancellation?.isCancelled === true;

/** Order states where work has already started against the customer. */
const IN_PROGRESS = ['preparing', 'ready', 'delivered'];

/** The amount we asked the gateway to charge, in paise. */
const expectedPaise = (order) => {
    const stored = order?.paymentDetails?.razorpayAmount;
    if (Number.isInteger(stored) && stored > 0) return stored;
    const total = order?.pricing?.totalAmount;
    if (!Number.isFinite(Number(total)) || Number(total) <= 0) return null;
    return toPaise(total);
};

/**
 * The order reference is not always the same field: payments and refunds carry
 * it differently, and some payloads only have the payment id to match on.
 */
const resolveOrderKey = (event, entity) => {
    if (event === 'refund.processed' || event === 'refund.failed') {
        return { byPaymentId: entity?.payment_id };
    }
    const notes = entity?.notes ?? {};
    if (notes.orderId) return { byId: String(notes.orderId) };
    if (event === 'payment.captured' || event === 'payment.failed') {
        // Fall back to the gateway order id, which we stored at checkout
        if (entity?.order_id) return { byRazorpayOrderId: entity.order_id };
    }
    if (event === 'order.paid' && entity?.id) return { byRazorpayOrderId: entity.id };
    return {};
};

const decidePaymentCaptured = (entity, order) => {
    if (isSettled(order.paymentDetails)) {
        const existing = order.paymentDetails.razorpayPaymentId;
        // Same payment again -> plain duplicate. Different payment -> the customer
        // paid twice and the extra money must be refunded, so never drop it.
        if (existing && existing === entity?.id) return ignore(REASON.ALREADY_SETTLED);
        return reject('DUPLICATE_CAPTURE', 'Order already settled by a different payment');
    }
    if (isCancelled(order)) {
        return reject('ORDER_CANCELLED', 'Payment captured for a cancelled order; refund required');
    }
    if (order.paymentDetails?.method !== 'razorpay') {
        return reject('NOT_RAZORPAY', 'Online payment reported against a non-online order');
    }
    if (IN_PROGRESS.includes(order.status)) {
        return reject('ORDER_ALREADY_IN_PROGRESS', 'Payment captured for an order already in progress');
    }
    // Bind the gateway order to ours, exactly as the verify endpoint does
    if (order.paymentDetails?.razorpayOrderId !== entity?.order_id) {
        return reject('PAYMENT_ORDER_MISMATCH', 'Captured payment belongs to a different gateway order');
    }
    const expected = expectedPaise(order);
    if (expected === null) return reject('MALFORMED_INPUT', 'Order has no comparable amount');
    if (entity?.amount !== undefined && entity.amount !== expected) {
        return reject('AMOUNT_MISMATCH', 'Captured amount does not match the order total', {
            expectedAmount: expected,
            receivedAmount: entity.amount,
        });
    }
    if (entity?.status && entity.status !== 'captured') {
        return reject('NOT_CAPTURED', `Gateway reported status "${entity.status}"`);
    }

    return apply(
        { paymentStatus: 'completed', orderStatus: 'confirmed', razorpayPaymentId: entity.id },
        { note: 'Payment captured via webhook', paidAt: entity?.created_at ? new Date(entity.created_at * 1000) : null }
    );
};

const decidePaymentFailed = (entity, order) => {
    // The bug this replaces: a late payment.failed used to set an already-paid
    // order to cancelled.
    if (isSettled(order.paymentDetails)) return ignore(REASON.ALREADY_SETTLED);
    if (isCancelled(order)) return ignore(REASON.ALREADY_SETTLED);
    // A retry of the same failure must not re-apply, or every delivery adds
    // another order note to the document.
    if (order.paymentDetails?.status === 'failed') return ignore(REASON.ALREADY_RECORDED);
    if (order.paymentDetails?.razorpayOrderId !== entity?.order_id) {
        return reject('PAYMENT_ORDER_MISMATCH', 'Failure reported for a different gateway order');
    }
    if (IN_PROGRESS.includes(order.status)) {
        return reject('ORDER_ALREADY_IN_PROGRESS', 'Payment failed for an order already in progress');
    }

    return apply(
        { paymentStatus: 'failed', orderStatus: 'cancelled' },
        { note: `Payment failed via webhook: ${entity?.error_description || 'Unknown error'}` }
    );
};

const decideRefundProcessed = (entity, order) => {
    if (order.cancellation?.refundStatus === 'completed') return ignore(REASON.ALREADY_SETTLED);
    const amount = Number.isInteger(entity?.amount) ? entity.amount / 100 : undefined;
    return apply(
        { refundStatus: 'completed', refundAmount: amount },
        { note: `Refund completed: ${amount === undefined ? 'amount unknown' : `₹${amount}`}. Refund ID: ${entity?.id}` }
    );
};

const decideRefundFailed = (entity, order) => {
    // A late failure must not undo a refund that already completed
    if (order.cancellation?.refundStatus === 'completed') return ignore(REASON.ALREADY_SETTLED);
    return apply(
        { refundStatus: 'failed' },
        { note: `Refund failed: ${entity?.error_description || 'Unknown error'}` }
    );
};

const decideOrderPaid = (entity, order) => {
    if (isSettled(order.paymentDetails)) return ignore(REASON.ALREADY_SETTLED);
    if (isCancelled(order)) return reject('ORDER_CANCELLED', 'order.paid for a cancelled order');
    if (order.paymentDetails?.razorpayOrderId && order.paymentDetails.razorpayOrderId !== entity?.id) {
        return reject('PAYMENT_ORDER_MISMATCH', 'order.paid for a different gateway order');
    }
    return apply({ paymentStatus: 'completed', orderStatus: 'confirmed' }, { note: 'Order marked as paid via webhook' });
};

/**
 * Decide what a webhook event means for an order.
 *
 * @returns {{action:'apply'|'ignore'|'reject', changes?:object, reason?:string, code?:string}}
 */
export function decideWebhookAction({ event, entity, order } = {}) {
    if (!event || typeof event !== 'string') return ignore(REASON.UNHANDLED_EVENT);

    // For refund events the controller resolves the order by payment id, so an
    // absent order here simply means "nothing to update".
    const needsOrder = event !== 'refund.processed' && event !== 'refund.failed';
    if (needsOrder && (!order || typeof order !== 'object')) {
        return ignore(REASON.ORDER_NOT_FOUND, { lookup: resolveOrderKey(event, entity) });
    }
    if (!needsOrder && (!order || typeof order !== 'object')) {
        return ignore(REASON.ORDER_NOT_FOUND, { lookup: resolveOrderKey(event, entity) });
    }

    const safeOrder = order ?? {};
    const safeEntity = entity && typeof entity === 'object' ? entity : {};

    switch (event) {
        case 'payment.captured':
            return decidePaymentCaptured(safeEntity, safeOrder);
        case 'payment.failed':
            return decidePaymentFailed(safeEntity, safeOrder);
        case 'refund.processed':
            return decideRefundProcessed(safeEntity, safeOrder);
        case 'refund.failed':
            return decideRefundFailed(safeEntity, safeOrder);
        case 'order.paid':
            return decideOrderPaid(safeEntity, safeOrder);
        default:
            return ignore(REASON.UNHANDLED_EVENT);
    }
}

export { resolveOrderKey };
