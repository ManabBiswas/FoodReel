import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    verifyPaymentBinding,
    verifyOrderBinding,
    toPaise,
    FAILURE,
} from '../src/services/payment.verification.js';

/**
 * A ₹10 payment must not settle a ₹2000 order.
  The Razorpay signature only proves the gateway returned a payment for a gateway order WE created. It says nothing about which of *our* orders that gateway order belongs to, so without an explicit binding check a user can pay the cheapest order they can build and then present that signature against their most expensive one.
 */

const makeOrder = (overrides = {}) => ({
    _id: 'order-expensive',
    currency: 'INR',
    status: 'pending',
    pricing: { totalAmount: 2000 },
    paymentDetails: {
        method: 'razorpay',
        status: 'processing',
        razorpayOrderId: 'order_razorpay_expensive',
        razorpayAmount: 200000, // paise
    },
    cancellation: { isCancelled: false },
    ...overrides,
});

const makeGatewayPayment = (overrides = {}) => ({
    id: 'pay_legit',
    order_id: 'order_razorpay_expensive',
    amount: 200000, // paise
    currency: 'INR',
    status: 'captured',
    method: 'upi',
    ...overrides,
});

describe('toPaise', () => {
    test('converts rupees to paise', () => {
        assert.equal(toPaise(2000), 200000);
        assert.equal(toPaise(10.5), 1050);
    });

    test('rounds to the nearest paise and never returns a float', () => {
        assert.equal(toPaise(19.999), 2000);
        assert.equal(toPaise(0.1 + 0.2), 30); // 0.30000000000000004
    });
});

describe('verifyPaymentBinding — the core security check', () => {
    test('accepts a genuine, fully-bound payment', () => {
        const result = verifyPaymentBinding({
            order: makeOrder(),
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment(),
        });
        assert.equal(result.ok, true, result.message);
    });

    test('THE EXPLOIT: a cheap payment cannot settle an expensive order', () => {
        // User legitimately pays a ₹10 order and receives a valid signature.
        const cheapPayment = makeGatewayPayment({
            order_id: 'order_razorpay_cheap',
            amount: 1000,
        });
        const expensiveOrder = makeOrder();

        const result = verifyPaymentBinding({
            order: expensiveOrder,
            razorpayOrderId: 'order_razorpay_cheap',
            gatewayPayment: cheapPayment,
        });

        assert.equal(result.ok, false);
        // It must fail on the order binding, before the amount is even considered
        assert.equal(result.code, FAILURE.ORDER_NOT_PAYMENT_CREATED);
    });

    test('rejects a gateway payment belonging to a different gateway order', () => {
        const result = verifyPaymentBinding({
            order: makeOrder(),
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ order_id: 'order_razorpay_someone_else' }),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.PAYMENT_ORDER_MISMATCH);
    });

    test('rejects when the order has no stored razorpayOrderId (never put through checkout)', () => {
        const order = makeOrder();
        delete order.paymentDetails.razorpayOrderId;

        const result = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment(),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.ORDER_NOT_PAYMENT_CREATED);
    });
});

describe('verifyPaymentBinding — amount and currency', () => {
    test('rejects an underpayment (partial amount)', () => {
        const result = verifyPaymentBinding({
            order: makeOrder(),
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ amount: 1000 }),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.AMOUNT_MISMATCH);
    });

    test('rejects an overpayment', () => {
        const result = verifyPaymentBinding({
            order: makeOrder(),
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ amount: 999999 }),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.AMOUNT_MISMATCH);
    });

    test('falls back to pricing.totalAmount when razorpayAmount was never stored', () => {
        const order = makeOrder();
        delete order.paymentDetails.razorpayAmount;

        // Gateway charged the correct amount for the total -> accepted
        const good = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ amount: 200000 }),
        });
        assert.equal(good.ok, true, good.message);

        // Gateway charged less -> rejected
        const bad = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ amount: 199999 }),
        });
        assert.equal(bad.ok, false);
        assert.equal(bad.code, FAILURE.AMOUNT_MISMATCH);
    });

    test('rejects a foreign currency', () => {
        const result = verifyPaymentBinding({
            order: makeOrder({ currency: 'INR' }),
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ currency: 'USD' }),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.CURRENCY_MISMATCH);
    });
});

describe('verifyPaymentBinding — capture state', () => {
    test('rejects a payment that is authorized but not captured', () => {
        const result = verifyPaymentBinding({
            order: makeOrder(),
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ status: 'authorized' }),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.NOT_CAPTURED);
    });

    test('rejects a failed payment', () => {
        const result = verifyPaymentBinding({
            order: makeOrder(),
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ status: 'failed' }),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.NOT_CAPTURED);
    });

    test('rejects when the gateway returned no payment at all', () => {
        const result = verifyPaymentBinding({
            order: makeOrder(),
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: null,
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.GATEWAY_PAYMENT_MISSING);
        assert.equal(result.status, 502);
    });
});

describe('verifyPaymentBinding — order state guards', () => {
    test('rejects replay: an already-paid order cannot be settled twice', () => {
        const order = makeOrder({
            paymentDetails: {
                method: 'razorpay',
                status: 'completed',
                razorpayOrderId: 'order_razorpay_expensive',
                razorpayAmount: 200000,
            },
        });

        const result = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment(),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.ORDER_ALREADY_PAID);
    });

    test('rejects payment against a cancelled order (cancel-then-pay)', () => {
        const order = makeOrder({
            status: 'cancelled',
            cancellation: { isCancelled: true, cancelledBy: 'user' },
        });

        const result = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment(),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.ORDER_CANCELLED);
        assert.equal(result.status, 409);
    });

    test('a COD order is never settled by an online payment', () => {
        const order = makeOrder({
            paymentDetails: {
                method: 'cod',
                status: 'pending',
                razorpayOrderId: 'order_razorpay_expensive',
                razorpayAmount: 200000,
            },
        });

        const result = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment(),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.NOT_RAZORPAY);
    });

    // Settling a payment on an order already being prepared would drag the
    // order BACKWARD from 'preparing' to 'confirmed'.
    for (const status of ['preparing', 'ready', 'delivered']) {
        test(`refuses to settle an order already ${status}`, () => {
            const result = verifyOrderBinding({
                order: makeOrder({ status }),
                razorpayOrderId: 'order_razorpay_expensive',
            });
            assert.equal(result.ok, false);
            assert.equal(result.code, FAILURE.ORDER_ALREADY_IN_PROGRESS);
            assert.equal(result.status, 409);
        });
    }
});

describe('verifyOrderBinding — runs before any gateway call', () => {
    const bound = (over = {}) =>
        makeOrder({
            status: 'pending',
            paymentDetails: {
                method: 'razorpay',
                status: 'processing',
                razorpayOrderId: 'order_razorpay_expensive',
                razorpayAmount: 200000,
            },
            ...over,
        });

    test('accepts a matching gateway order id without needing the gateway', () => {
        const result = verifyOrderBinding({
            order: bound(),
            razorpayOrderId: 'order_razorpay_expensive',
        });
        assert.equal(result.ok, true);
    });

    test('rejects the exploit with no gateway payment supplied at all', () => {
        const result = verifyOrderBinding({
            order: bound(),
            razorpayOrderId: 'order_razorpay_cheap',
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.ORDER_NOT_PAYMENT_CREATED);
    });

    test('refunded orders cannot be re-settled', () => {
        const order = makeOrder({
            paymentDetails: {
                method: 'razorpay',
                status: 'refunded',
                razorpayOrderId: 'order_razorpay_expensive',
                razorpayAmount: 200000,
            },
        });

        const result = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment(),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.ORDER_ALREADY_PAID);
    });
});

describe('verifyPaymentBinding — which amount is authoritative', () => {
    test('a stored razorpayAmount wins, so pricing is irrelevant once checkout ran', () => {
        // The gateway was asked for 200000 paise at checkout; that agreement is
        // what matters, even if pricing is later absent or changed.
        const order = { ...makeOrder(), pricing: undefined };

        const result = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ amount: 200000 }),
        });
        assert.equal(result.ok, true, result.message);
    });

    test('with neither a stored amount nor a total there is nothing to check against', () => {
        const order = { ...makeOrder(), pricing: undefined };
        delete order.paymentDetails.razorpayAmount;

        const result = verifyPaymentBinding({
            order,
            razorpayOrderId: 'order_razorpay_expensive',
            gatewayPayment: makeGatewayPayment({ amount: 200000 }),
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, FAILURE.MALFORMED_INPUT);
    });
});

describe('verifyPaymentBinding — never throws on malformed input', () => {
    const hostile = [
        ['null order', null, makeGatewayPayment()],
        ['undefined gateway payment', makeOrder(), undefined],
        ['order with no paymentDetails', { ...makeOrder(), paymentDetails: undefined }, makeGatewayPayment()],
        ['gateway payment with no amount', makeOrder(), { ...makeGatewayPayment(), amount: undefined }],
        ['gateway payment with null amount', makeOrder(), { ...makeGatewayPayment(), amount: null }],
    ];

    for (const [label, order, gatewayPayment] of hostile) {
        test(`returns a failure result for ${label}`, () => {
            const result = verifyPaymentBinding({
                order,
                razorpayOrderId: 'order_razorpay_expensive',
                gatewayPayment,
            });
            assert.equal(result.ok, false);
            assert.equal(typeof result.code, 'string');
            assert.equal(typeof result.message, 'string');
        });
    }
});
