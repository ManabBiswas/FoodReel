/**
 * Cancel-request policy — pure decision logic, no database, no gateway calls.
 *
 * A partner normally cancels an order outright while it is still 'pending' or
 * 'confirmed' (see partnerCancelOrder). Once the food is actually being made
 * ('preparing' or 'ready'), the partner can no longer cancel unilaterally: the
 * customer is already waiting, and the money has usually been captured. So the
 * partner raises a *request*, the order parks in 'cancel_requested', and an
 * admin decides.
 *
 * The rules:
 *   - only 'preparing' and 'ready' orders can be sent for review
 *   - a request cannot be raised twice
 *   - approving cancels the order and releases the refund
 *   - rejecting sends the partner back to preparing the food
 */

/** Statuses a partner may request cancellation from. */
export const CANCEL_REQUEST_STATUSES = ['preparing', 'ready'];

/** The status an order falls back to when an admin rejects the request. */
export const RESUME_STATUS = 'preparing';

export const CANCEL_REQUEST_REASONS = [
    'Item unavailable',
    'Out of ingredients',
    'Kitchen equipment failure',
    'Food quality issue',
    'Cannot prepare in time',
    'Other',
];

const deny = (code, message, status = 400) => ({ allowed: false, code, message, status });

/**
 * Can this partner raise a cancel request on this order right now?
 *
 * @returns {{allowed: true, reason: string, details: string}|{allowed: false, code: string, message: string, status: number}}
 */
export function decideCancelRequest({ order, reason, details } = {}) {
    if (!order) return deny('ORDER_NOT_FOUND', 'Order not found', 404);

    if (order.cancellation?.isCancelled || order.status === 'cancelled') {
        return deny('ALREADY_CANCELLED', 'This order is already cancelled', 400);
    }

    if (order.cancelRequest?.status === 'pending') {
        return deny('REQUEST_ALREADY_PENDING', 'A cancellation request for this order is already awaiting review', 409);
    }

    // 'pending' and 'confirmed' already have a direct cancel path, so a request
    // from those states is a mistake, not a special case.
    if (!CANCEL_REQUEST_STATUSES.includes(order.status)) {
        return deny(
            'STATUS_NOT_ELIGIBLE',
            `A cancellation request can only be raised while preparing or ready. Current status: ${order.status}`,
            400
        );
    }

    const trimmedReason = typeof reason === 'string' ? reason.trim().slice(0, 200) : '';
    if (!trimmedReason) {
        return deny('REASON_REQUIRED', 'Please give a reason for the cancellation request');
    }

    const trimmedDetails = typeof details === 'string' ? details.trim().slice(0, 1000) : '';

    return { allowed: true, reason: trimmedReason, details: trimmedDetails };
}

/**
 * Can this admin decide the pending cancel request on this order?
 *
 * @param {'approve'|'reject'} decision
 */
export function decideCancelRequestDecision({ order, decision } = {}) {
    if (!order) return deny('ORDER_NOT_FOUND', 'Order not found', 404);

    if (decision !== 'approve' && decision !== 'reject') {
        return deny('INVALID_DECISION', 'Decision must be either approve or reject');
    }

    if (order.status !== 'cancel_requested' || order.cancelRequest?.status !== 'pending') {
        return deny('NO_PENDING_REQUEST', 'This order is not awaiting a cancellation decision', 409);
    }

    if (order.cancellation?.isCancelled || order.status === 'cancelled') {
        return deny('ALREADY_CANCELLED', 'This order is already cancelled', 400);
    }

    return { allowed: true, rejection: decision === 'reject' };
}
