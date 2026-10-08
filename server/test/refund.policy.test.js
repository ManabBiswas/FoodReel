import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    decideRefundOnCancellation,
    decideRefundRequest,
    decideRefundApproval,
    decideFulfilmentAllowed,
    OUTCOME,
} from '../src/services/refund.policy.js';

/**
 * Refund policy (decided 2026-09-25):
 *   customer cancels -> refund automatically
 *   partner cancels  -> refund waits for approval
 *
 * Today both paths only set refundStatus 'pending' and never move money, so a
 * cancelled paid order leaves the customer out of pocket unless they happen to
 * know about a separate refund endpoint.
 */

const paid = (over = {}) => ({
    _id: 'o1',
    pricing: { totalAmount: 500 },
    paymentDetails: { method: 'razorpay', status: 'completed', razorpayPaymentId: 'pay_1' },
    cancellation: { isCancelled: false },
    ...over,
});

const cod = () =>
    paid({ paymentDetails: { method: 'cod', status: 'pending' } });

describe('decideRefundOnCancellation', () => {
    test('a customer cancelling a paid order refunds automatically', () => {
        const result = decideRefundOnCancellation({ order: paid(), actor: 'user' });
        assert.equal(result.outcome, OUTCOME.AUTO_REFUND);
        // 'pending' = owes a refund. The atomic claim promotes it to 'processing';
        // writing 'processing' here would make the claim reject its own order.
        assert.equal(result.refundStatus, 'pending');
        assert.equal(result.amount, 500);
    });

    test('a partner cancelling a paid order waits for approval', () => {
        const result = decideRefundOnCancellation({ order: paid(), actor: 'partner' });
        assert.equal(result.outcome, OUTCOME.AWAIT_APPROVAL);
        assert.equal(result.refundStatus, 'pending_approval');
        assert.equal(result.amount, 500);
    });

    test('a COD cancellation has nothing to refund', () => {
        const result = decideRefundOnCancellation({ order: cod(), actor: 'user' });
        assert.equal(result.outcome, OUTCOME.NONE);
        assert.equal(result.refundStatus, 'not_applicable');
        assert.equal(result.amount, 0);
    });

    test('an unpaid online cancellation has nothing to refund', () => {
        const order = paid({ paymentDetails: { method: 'razorpay', status: 'pending' } });
        const result = decideRefundOnCancellation({ order, actor: 'user' });
        assert.equal(result.outcome, OUTCOME.NONE);
        assert.equal(result.refundStatus, 'not_applicable');
    });

    test('a failed payment has nothing to refund', () => {
        const order = paid({ paymentDetails: { method: 'razorpay', status: 'failed' } });
        assert.equal(decideRefundOnCancellation({ order, actor: 'user' }).outcome, OUTCOME.NONE);
    });

    test('a partner cancelling an UNPAID order does not queue an approval', () => {
        // Nothing to give back, so there is nothing to approve
        const order = paid({ paymentDetails: { method: 'razorpay', status: 'pending' } });
        const result = decideRefundOnCancellation({ order, actor: 'partner' });
        assert.equal(result.outcome, OUTCOME.NONE);
        assert.equal(result.refundStatus, 'not_applicable');
    });

    test('an admin cancellation refunds automatically', () => {
        const result = decideRefundOnCancellation({ order: paid(), actor: 'admin' });
        assert.equal(result.outcome, OUTCOME.AUTO_REFUND);
    });

    test('an unknown actor fails closed rather than guessing a policy', () => {
        const result = decideRefundOnCancellation({ order: paid(), actor: 'random-actor' });
        assert.equal(result.outcome, OUTCOME.AWAIT_APPROVAL);
    });

    test('never throws on a malformed order', () => {
        for (const order of [null, undefined, {}, { paymentDetails: null }, { pricing: null }]) {
            const result = decideRefundOnCancellation({ order, actor: 'user' });
            assert.equal(result.outcome, OUTCOME.NONE);
        }
    });
});

describe('decideRefundRequest — the customer-initiated refund endpoint', () => {
    test('allows a first refund of a paid order', () => {
        const result = decideRefundRequest({ order: paid(), amount: undefined });
        assert.equal(result.allowed, true);
        assert.equal(result.amount, 500, 'defaults to the full order total');
    });

    test('allows a partial refund', () => {
        const result = decideRefundRequest({ order: paid(), amount: 200 });
        assert.equal(result.allowed, true);
        assert.equal(result.amount, 200);
    });

    test('refuses a refund larger than the order total', () => {
        const result = decideRefundRequest({ order: paid(), amount: 501 });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'AMOUNT_EXCEEDS_TOTAL');
    });

    test('refuses a negative or zero amount', () => {
        assert.equal(decideRefundRequest({ order: paid(), amount: 0 }).allowed, false);
        assert.equal(decideRefundRequest({ order: paid(), amount: -50 }).allowed, false);
    });

    test('refuses when the payment was never completed', () => {
        const order = paid({ paymentDetails: { method: 'razorpay', status: 'pending' } });
        const result = decideRefundRequest({ order, amount: undefined });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'PAYMENT_NOT_COMPLETED');
    });

    test('refuses when there is no payment id to refund against', () => {
        const order = paid({ paymentDetails: { method: 'razorpay', status: 'completed' } });
        const result = decideRefundRequest({ order, amount: undefined });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'NO_PAYMENT_ID');
    });

    test('refuses a second refund once one is completed', () => {
        const order = paid({ cancellation: { isCancelled: true, refundStatus: 'completed' } });
        const result = decideRefundRequest({ order, amount: undefined });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'ALREADY_REFUNDED');
    });

    test('refuses a concurrent duplicate while one is in flight', () => {
        const order = paid({ cancellation: { isCancelled: true, refundStatus: 'processing' } });
        const result = decideRefundRequest({ order, amount: undefined });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'REFUND_IN_FLIGHT');
    });

    test('refuses while an approval is still pending', () => {
        const order = paid({ cancellation: { isCancelled: true, refundStatus: 'pending_approval' } });
        const result = decideRefundRequest({ order, amount: undefined });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'REFUND_AWAITING_APPROVAL');
    });

    test('allows a retry after a previous refund failed', () => {
        const order = paid({ cancellation: { isCancelled: true, refundStatus: 'failed' } });
        assert.equal(decideRefundRequest({ order, amount: undefined }).allowed, true);
    });

    test('refuses a COD order', () => {
        const result = decideRefundRequest({ order: cod(), amount: undefined });
        assert.equal(result.allowed, false);
    });

    test('refuses a missing order', () => {
        assert.equal(decideRefundRequest({ order: null, amount: undefined }).allowed, false);
    });
});

describe('decideRefundApproval — the admin decision on a pending_approval refund', () => {
    const awaiting = () =>
        paid({
            status: 'cancelled',
            cancellation: { isCancelled: true, cancelledBy: 'partner', refundStatus: 'pending_approval', refundAmount: 500 },
        });

    test('an admin may approve a refund awaiting approval', () => {
        const result = decideRefundApproval({ order: awaiting(), decision: 'approve' });
        assert.equal(result.allowed, true);
        assert.equal(result.amount, 500);
    });

    test('an admin may reject it, which is a distinct outcome from a failure', () => {
        const result = decideRefundApproval({ order: awaiting(), decision: 'reject' });
        assert.equal(result.allowed, true);
        assert.equal(result.rejection, true);
    });

    test('refuses to approve a refund that is not awaiting approval', () => {
        // e.g. a plain customer cancellation, which is auto-refunded already
        const result = decideRefundApproval({ order: paid(), decision: 'approve' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'NOT_AWAITING_APPROVAL');
    });

    test('refuses to approve a refund that is already completed', () => {
        const order = awaiting();
        order.cancellation.refundStatus = 'completed';
        assert.equal(decideRefundApproval({ order, decision: 'approve' }).allowed, false);
    });

    test('refuses to approve a refund already in flight', () => {
        const order = awaiting();
        order.cancellation.refundStatus = 'processing';
        const result = decideRefundApproval({ order, decision: 'approve' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'REFUND_IN_FLIGHT');
    });

    test('refuses an already-rejected refund', () => {
        const order = awaiting();
        order.cancellation.refundStatus = 'rejected';
        assert.equal(decideRefundApproval({ order, decision: 'approve' }).allowed, false);
    });

    test('refuses a duplicate decision', () => {
        const result = decideRefundApproval({ order: awaiting(), decision: 'reject' });
        assert.equal(result.allowed, true);
        const second = decideRefundApproval({ order: { ...awaiting(), cancellation: { isCancelled: true, refundStatus: 'rejected' } }, decision: 'reject' });
        assert.equal(second.allowed, false);
    });

    test('refuses an unrecognised decision', () => {
        const result = decideRefundApproval({ order: awaiting(), decision: 'maybe' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'INVALID_DECISION');
    });

    test('refuses a missing order', () => {
        assert.equal(decideRefundApproval({ order: null, decision: 'approve' }).allowed, false);
    });

    test('refuses a decision on an unpaid order', () => {
        const order = awaiting();
        order.paymentDetails.status = 'pending';
        assert.equal(decideRefundApproval({ order, decision: 'approve' }).allowed, false);
    });
});

describe('decideFulfilmentAllowed — no unpaid fulfilment', () => {
    const order = (paymentDetails) => ({ paymentDetails });

    test('blocks an online order that has not been paid', () => {
        for (const next of ['confirmed', 'preparing', 'ready', 'delivered']) {
            const result = decideFulfilmentAllowed({
                order: order({ method: 'razorpay', status: 'pending' }),
                nextStatus: next,
            });
            assert.equal(result.allowed, false, `should block ${next}`);
            assert.equal(result.code, 'PAYMENT_NOT_COMPLETED');
        }
    });

    test('blocks an online order whose payment is still processing or failed', () => {
        for (const status of ['processing', 'failed']) {
            assert.equal(
                decideFulfilmentAllowed({ order: order({ method: 'razorpay', status }), nextStatus: 'confirmed' }).allowed,
                false,
                `should block status ${status}`
            );
        }
    });

    test('allows a paid online order through', () => {
        const result = decideFulfilmentAllowed({
            order: order({ method: 'razorpay', status: 'completed' }),
            nextStatus: 'confirmed',
        });
        assert.equal(result.allowed, true);
    });

    test('COD is exempt — the money is collected on delivery', () => {
        const result = decideFulfilmentAllowed({
            order: order({ method: 'cod', status: 'pending' }),
            nextStatus: 'confirmed',
        });
        assert.equal(result.allowed, true);
    });

    test('cancellation is always allowed regardless of payment', () => {
        const result = decideFulfilmentAllowed({
            order: order({ method: 'razorpay', status: 'pending' }),
            nextStatus: 'cancelled',
        });
        assert.equal(result.allowed, true);
    });

    test('an order with no payment details is not blocked by this gate', () => {
        assert.equal(decideFulfilmentAllowed({ order: {}, nextStatus: 'confirmed' }).allowed, true);
        assert.equal(decideFulfilmentAllowed({ order: null, nextStatus: 'confirmed' }).allowed, true);
    });
});
