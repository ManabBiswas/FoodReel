import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    decideCancelRequest,
    decideCancelRequestDecision,
    CANCEL_REQUEST_STATUSES,
    RESUME_STATUS,
} from '../src/services/cancelRequest.policy.js';

/**
 * A partner whose food is already being prepared cannot cancel the order on
 * their own — the customer is waiting and the money is usually captured. They
 * raise a request, the order parks in 'cancel_requested', and an admin decides.
 */

const order = (over = {}) => ({
    _id: 'o1',
    status: 'preparing',
    cancellation: { isCancelled: false },
    cancelRequest: undefined,
    ...over,
});

describe('decideCancelRequest — the partner raising a request', () => {
    test('a preparing order can be sent for review', () => {
        const result = decideCancelRequest({ order: order(), reason: 'Out of ingredients' });
        assert.equal(result.allowed, true);
        assert.equal(result.reason, 'Out of ingredients');
    });

    test('a ready order can be sent for review', () => {
        const result = decideCancelRequest({ order: order({ status: 'ready' }), reason: 'Food quality issue' });
        assert.equal(result.allowed, true);
    });

    test('only preparing and ready are eligible', () => {
        assert.deepEqual(CANCEL_REQUEST_STATUSES, ['preparing', 'ready']);
    });

    test('a pending order is refused — it already has a direct cancel path', () => {
        const result = decideCancelRequest({ order: order({ status: 'pending' }), reason: 'x' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'STATUS_NOT_ELIGIBLE');
    });

    test('a confirmed order is refused — it already has a direct cancel path', () => {
        const result = decideCancelRequest({ order: order({ status: 'confirmed' }), reason: 'x' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'STATUS_NOT_ELIGIBLE');
    });

    test('a delivered order is refused', () => {
        const result = decideCancelRequest({ order: order({ status: 'delivered' }), reason: 'x' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'STATUS_NOT_ELIGIBLE');
    });

    test('an already cancelled order is refused', () => {
        const result = decideCancelRequest({
            order: order({ status: 'cancelled', cancellation: { isCancelled: true } }),
            reason: 'x',
        });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'ALREADY_CANCELLED');
    });

    test('a second request while one is pending is refused', () => {
        const result = decideCancelRequest({
            order: order({ status: 'cancel_requested', cancelRequest: { status: 'pending' } }),
            reason: 'x',
        });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'REQUEST_ALREADY_PENDING');
        assert.equal(result.status, 409);
    });

    test('a reason is required', () => {
        assert.equal(decideCancelRequest({ order: order(), reason: '' }).code, 'REASON_REQUIRED');
        assert.equal(decideCancelRequest({ order: order(), reason: '   ' }).code, 'REASON_REQUIRED');
        assert.equal(decideCancelRequest({ order: order() }).code, 'REASON_REQUIRED');
    });

    test('the reason is trimmed and capped', () => {
        const result = decideCancelRequest({ order: order(), reason: `  ${'x'.repeat(300)}  ` });
        assert.equal(result.reason.length, 200);
        assert.equal(result.reason, 'x'.repeat(200));
    });

    test('the details are optional but capped', () => {
        const result = decideCancelRequest({ order: order(), reason: 'x', details: 'y'.repeat(2000) });
        assert.equal(result.details.length, 1000);
    });

    test('a missing order is refused', () => {
        const result = decideCancelRequest({ order: null, reason: 'x' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'ORDER_NOT_FOUND');
    });

    test('never throws on a malformed order', () => {
        for (const bad of [undefined, {}, { status: null }]) {
            assert.doesNotThrow(() => decideCancelRequest({ order: bad, reason: 'x' }));
        }
    });
});

describe('decideCancelRequestDecision — the admin deciding', () => {
    const pending = () =>
        order({
            status: 'cancel_requested',
            cancelRequest: { status: 'pending', reason: 'Out of ingredients' },
        });

    test('an admin may approve a pending request', () => {
        const result = decideCancelRequestDecision({ order: pending(), decision: 'approve' });
        assert.equal(result.allowed, true);
        assert.equal(result.rejection, false);
    });

    test('an admin may reject a pending request', () => {
        const result = decideCancelRequestDecision({ order: pending(), decision: 'reject' });
        assert.equal(result.allowed, true);
        assert.equal(result.rejection, true);
    });

    test('an order with no pending request cannot be decided', () => {
        const result = decideCancelRequestDecision({ order: order(), decision: 'approve' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'NO_PENDING_REQUEST');
    });

    test('a request that was already decided cannot be decided again', () => {
        const result = decideCancelRequestDecision({
            order: order({ status: 'cancel_requested', cancelRequest: { status: 'approved' } }),
            decision: 'approve',
        });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'NO_PENDING_REQUEST');
    });

    test('a rejected request cannot be decided again', () => {
        const result = decideCancelRequestDecision({
            order: order({ status: 'cancelled', cancelRequest: { status: 'rejected' } }),
            decision: 'reject',
        });
        assert.equal(result.allowed, false);
    });

    test('an unrecognised decision is refused', () => {
        const result = decideCancelRequestDecision({ order: pending(), decision: 'maybe' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'INVALID_DECISION');
    });

    test('a missing order is refused', () => {
        const result = decideCancelRequestDecision({ order: null, decision: 'approve' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'ORDER_NOT_FOUND');
    });
});

describe('the order lifecycle agrees with the cancel-request policy', () => {
    test('a rejected request resumes at preparing by default', () => {
        assert.equal(RESUME_STATUS, 'preparing');
    });
});
