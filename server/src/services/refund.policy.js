/**
 * Refund policy — pure decision logic, no database, no gateway calls.
 *
 * Policy (decided 2026-09-25):
 *   customer cancels -> refund automatically
 *   partner cancels  -> refund waits for approval
 *   admin cancels    -> refund automatically
 *
 * Anything that is not a settled online payment has nothing to refund, whatever
 * the actor. An unrecognised actor fails closed into the approval path rather
 * than guessing that it may move money.
 */

export const OUTCOME = {
    AUTO_REFUND: 'auto_refund',
    AWAIT_APPROVAL: 'await_approval',
    NONE: 'none',
};

/** Actors whose cancellation refunds without a human in the loop. */
const AUTO_REFUND_ACTORS = new Set(['user', 'admin']);

const isRefundable = (order) =>
    order?.paymentDetails?.method === 'razorpay' &&
    order?.paymentDetails?.status === 'completed' &&
    order?.pricing?.totalAmount > 0;

/**
 * What should happen to the money when an order is cancelled?
 *
 * @returns {{outcome: string, refundStatus: string, amount: number}}
 */
export function decideRefundOnCancellation({ order, actor } = {}) {
    if (!isRefundable(order)) {
        return { outcome: OUTCOME.NONE, refundStatus: 'not_applicable', amount: 0 };
    }

    const amount = order.pricing.totalAmount;

    if (AUTO_REFUND_ACTORS.has(actor)) {
        // 'pending' means "this order owes a refund". The atomic claim in
        // refund.service.js promotes it to 'processing' when it actually starts.
        // Writing 'processing' here would make the claim reject its own order.
        return { outcome: OUTCOME.AUTO_REFUND, refundStatus: 'pending', amount };
    }

    // partner, and anything unrecognised
    return { outcome: OUTCOME.AWAIT_APPROVAL, refundStatus: 'pending_approval', amount };
}

const deny = (code, message, status = 400) => ({ allowed: false, code, message, status });

/** Statuses where the partner is actively working on the order. */
export const FULFILMENT_STATUSES = ['confirmed', 'preparing', 'ready', 'delivered'];

export function decideFulfilmentAllowed({ order, nextStatus } = {}) {
    if (!FULFILMENT_STATUSES.includes(nextStatus)) return { allowed: true };

    const method = order?.paymentDetails?.method;
    if (method !== 'razorpay') return { allowed: true };

    const paymentStatus = order?.paymentDetails?.status;
    if (paymentStatus === 'completed' || paymentStatus === 'refunded') return { allowed: true };

    return {
        allowed: false,
        code: 'PAYMENT_NOT_COMPLETED',
        message: `Cannot mark this order as ${nextStatus} until its payment is completed (currently ${paymentStatus ?? 'unknown'})`,
    };
}

/**
 * Validate an admin's decision on a refund that a partner cancellation left in
 * `pending_approval`.
 * @param {'approve'|'reject'} decision
 */
export function decideRefundApproval({ order, decision } = {}) {
    if (!order) return deny('ORDER_NOT_FOUND', 'Order not found', 404);

    if (decision !== 'approve' && decision !== 'reject') {
        return deny('INVALID_DECISION', 'Decision must be either approve or reject');
    }

    const refundStatus = order.cancellation?.refundStatus;

    if (refundStatus === 'completed') {
        return deny('ALREADY_REFUNDED', 'Refund already processed for this order');
    }
    if (refundStatus === 'processing') {
        return deny('REFUND_IN_FLIGHT', 'A refund is already in progress', 409);
    }
    if (refundStatus !== 'pending_approval') {
        return deny('NOT_AWAITING_APPROVAL', 'This order is not awaiting refund approval');
    }
    if (!isRefundable(order)) {
        return deny('NOT_REFUNDABLE', 'This order has no completed payment to refund');
    }

    return {
        allowed: true,
        rejection: decision === 'reject',
        amount: order.pricing.totalAmount,
    };
}
