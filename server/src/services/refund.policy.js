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

/**
 * Validate a customer-initiated refund request (POST /api/payment/refund).
 *
 * This is the read-side guard. It cannot prevent two concurrent requests from
 * both passing — the atomic claim in refund.service.js does that — but it
 * rejects the obvious replay of a refund that is already done or in flight.
 */
export function decideRefundRequest({ order, amount } = {}) {
    if (!order) return deny('ORDER_NOT_FOUND', 'Order not found', 404);

    const paymentDetails = order.paymentDetails;
    if (paymentDetails?.method !== 'razorpay') {
        return deny('NOT_RAZORPAY', 'This order was not paid online');
    }
    if (paymentDetails.status !== 'completed') {
        return deny('PAYMENT_NOT_COMPLETED', 'Order payment is not completed. Cannot refund.');
    }
    if (!paymentDetails.razorpayPaymentId) {
        return deny('NO_PAYMENT_ID', 'No payment id is recorded for this order');
    }

    const refundStatus = order.cancellation?.refundStatus;
    if (refundStatus === 'completed') return deny('ALREADY_REFUNDED', 'Refund already processed for this order');
    if (refundStatus === 'processing') return deny('REFUND_IN_FLIGHT', 'A refund is already in progress', 409);
    if (refundStatus === 'pending_approval') {
        return deny('REFUND_AWAITING_APPROVAL', 'This refund is awaiting approval', 409);
    }

    const total = order.pricing?.totalAmount ?? 0;
    const requested = amount === undefined || amount === null ? total : Number(amount);

    if (!Number.isFinite(requested) || requested <= 0) {
        return deny('INVALID_AMOUNT', 'Refund amount must be greater than zero');
    }
    if (requested > total) {
        return deny('AMOUNT_EXCEEDS_TOTAL', 'Refund amount cannot exceed the order total');
    }

    return { allowed: true, amount: Math.round(requested * 100) / 100 };
}

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
