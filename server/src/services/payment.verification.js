/**
 * Payment binding verification.
 *
 A valid Razorpay signature proves only that the gateway returned a payment for a gateway order that WE created. It does not prove which of our orders that gateway order belongs to, nor for how much. Without an explicit binding check a user can pay the cheapest order they can create, keep the valid signature, and present it against their most expensive order.
 
 This module is deliberately pure — no database, no network, no clock — so it can be exhaustively unit tested. The controller supplies the already-fetched order and gateway payment and translates the result into an HTTP response.
 */

export const FAILURE = {
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    NOT_RAZORPAY: 'NOT_RAZORPAY',
    ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
    ORDER_CANCELLED: 'ORDER_CANCELLED',
    ORDER_ALREADY_IN_PROGRESS: 'ORDER_ALREADY_IN_PROGRESS',
    ORDER_NOT_PAYMENT_CREATED: 'ORDER_NOT_PAYMENT_CREATED',
    PAYMENT_ORDER_MISMATCH: 'PAYMENT_ORDER_MISMATCH',
    AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
    CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
    NOT_CAPTURED: 'NOT_CAPTURED',
    GATEWAY_PAYMENT_MISSING: 'GATEWAY_PAYMENT_MISSING',
    MALFORMED_INPUT: 'MALFORMED_INPUT',
};

const REJECTED = {
    [FAILURE.ORDER_NOT_FOUND]: { status: 404, message: 'Order not found' },
    [FAILURE.NOT_RAZORPAY]: { status: 400, message: 'This order is not payable online' },
    [FAILURE.ORDER_ALREADY_PAID]: { status: 409, message: 'Order payment is already settled' },
    [FAILURE.ORDER_CANCELLED]: { status: 409, message: 'Order was cancelled; payment cannot be applied' },
    [FAILURE.ORDER_ALREADY_IN_PROGRESS]: { status: 409, message: 'Order is already being prepared' },
    [FAILURE.ORDER_NOT_PAYMENT_CREATED]: { status: 400, message: 'Payment does not belong to this order' },
    [FAILURE.PAYMENT_ORDER_MISMATCH]: { status: 400, message: 'Payment does not belong to this order' },
    [FAILURE.AMOUNT_MISMATCH]: { status: 400, message: 'Payment amount does not match the order total' },
    [FAILURE.CURRENCY_MISMATCH]: { status: 400, message: 'Payment currency does not match the order' },
    [FAILURE.NOT_CAPTURED]: { status: 400, message: 'Payment has not been captured' },
    // The gateway lookup itself failed — that is our problem, not the caller's
    [FAILURE.GATEWAY_PAYMENT_MISSING]: { status: 502, message: 'Could not confirm the payment with the payment gateway' },
    [FAILURE.MALFORMED_INPUT]: { status: 400, message: 'Invalid payment details' },
};

const reject = (code, extra = {}) => ({
    ok: false,
    code,
    status: REJECTED[code].status,
    message: REJECTED[code].message,
    ...extra,
});

/** Rupees -> paise, as an integer. Avoids 0.1 + 0.2 style float drift. */
export const toPaise = (rupees) => Math.round(Number(rupees) * 100);

/**
 * The amount we asked the gateway to charge: prefer the value captured at
 * checkout time, fall back to the order total for orders created before that
 * field existed.
 */
const expectedPaise = (order) => {
    const stored = order?.paymentDetails?.razorpayAmount;
    if (Number.isInteger(stored) && stored > 0) return stored;
    const total = order?.pricing?.totalAmount;
    if (!Number.isFinite(Number(total)) || Number(total) <= 0) return null;
    return toPaise(total);
};

/** Order states where work has already started against the customer. */
const IN_PROGRESS = ['preparing', 'ready', 'delivered'];

/**
 * Local-only checks: everything that can be decided from the order document,
 * with no gateway call. Run this BEFORE fetching payment details so a mismatched
 * gateway order id is rejected without spending a network round trip.
 */
export function verifyOrderBinding({ order, razorpayOrderId } = {}) {
    if (!order || typeof order !== 'object') return reject(FAILURE.ORDER_NOT_FOUND);
    if (!razorpayOrderId || typeof razorpayOrderId !== 'string') return reject(FAILURE.MALFORMED_INPUT);

    const paymentDetails = order.paymentDetails;
    if (!paymentDetails || typeof paymentDetails !== 'object') return reject(FAILURE.MALFORMED_INPUT);

    // Only online payments are settled through this path
    if (paymentDetails.method !== 'razorpay') return reject(FAILURE.NOT_RAZORPAY);

    // Terminal states must not be re-settled (replay protection)
    if (paymentDetails.status === 'completed') return reject(FAILURE.ORDER_ALREADY_PAID);
    if (paymentDetails.status === 'refunded') return reject(FAILURE.ORDER_ALREADY_PAID);

    // A cancelled order must never become paid (cancel-then-pay race)
    if (order.status === 'cancelled' || order.cancellation?.isCancelled === true) {
        return reject(FAILURE.ORDER_CANCELLED);
    }

    // Settling an order that is already being prepared would drag it BACKWARD
    // to 'confirmed'. Money here is not the problem; the state machine is.
    if (IN_PROGRESS.includes(order.status)) {
        return reject(FAILURE.ORDER_ALREADY_IN_PROGRESS);
    }

    // THE BINDING CHECK: the gateway order must be the one we created for this
    // order during checkout. Without this, any valid payment settles any order.
    if (!paymentDetails.razorpayOrderId || paymentDetails.razorpayOrderId !== razorpayOrderId) {
        return reject(FAILURE.ORDER_NOT_PAYMENT_CREATED);
    }

    return { ok: true };
}

/**
 * Bind a gateway payment to a FoodFest ticket.
 */
export function verifyTicketPaymentBinding({ ticket, razorpayOrderId, gatewayPayment } = {}) {
    if (!ticket || typeof ticket !== 'object') return reject(FAILURE.ORDER_NOT_FOUND);
    if (!razorpayOrderId || typeof razorpayOrderId !== 'string') return reject(FAILURE.MALFORMED_INPUT);

    const details = ticket.paymentDetails;
    if (!details || typeof details !== 'object') return reject(FAILURE.MALFORMED_INPUT);

    // Terminal states must not be re-finalised
    if (ticket.status === 'valid' || ticket.status === 'used') {
        return reject(FAILURE.ORDER_ALREADY_PAID);
    }
    if (ticket.status === 'refunded' || ticket.status === 'cancelled' || ticket.status === 'expired') {
        return reject(FAILURE.ORDER_CANCELLED);
    }

    // THE BINDING CHECK: this must be the gateway order created for THIS ticket
    if (!details.razorpayOrderId || details.razorpayOrderId !== razorpayOrderId) {
        return reject(FAILURE.ORDER_NOT_PAYMENT_CREATED);
    }

    if (!gatewayPayment || typeof gatewayPayment !== 'object') {
        return reject(FAILURE.GATEWAY_PAYMENT_MISSING);
    }
    if (gatewayPayment.order_id !== razorpayOrderId) {
        return reject(FAILURE.PAYMENT_ORDER_MISMATCH);
    }

    // Compare against what the gateway was asked to charge, falling back to the ticket's own purchase price.
    
    let expected = null;
    if (Number.isInteger(details.razorpayAmount) && details.razorpayAmount > 0) {
        expected = details.razorpayAmount;
    } else if (Number.isFinite(Number(ticket.priceAtPurchase)) && Number(ticket.priceAtPurchase) > 0) {
        expected = toPaise(ticket.priceAtPurchase);
    }
    if (expected === null) return reject(FAILURE.MALFORMED_INPUT);

    if (!Number.isInteger(gatewayPayment.amount) || gatewayPayment.amount !== expected) {
        return reject(FAILURE.AMOUNT_MISMATCH, { expectedAmount: expected, receivedAmount: gatewayPayment.amount });
    }
    if (gatewayPayment.currency) {
        const ticketCurrency = ticket.currency || 'INR';
        if (gatewayPayment.currency !== ticketCurrency) return reject(FAILURE.CURRENCY_MISMATCH);
    }
    if (gatewayPayment.status !== 'captured') return reject(FAILURE.NOT_CAPTURED);

    return { ok: true, expectedAmount: expected };
}

/**
 * Decide whether a gateway payment may be applied to an order.
 *
 * @param {object}  args
 * @param {object}  args.order            the order document (may be null)
 * @param {string}  args.razorpayOrderId  gateway order id supplied by the client
 * @param {object}  args.gatewayPayment   the fetched gateway payment entity
 * @returns {{ok: true} | {ok: false, code: string, status: number, message: string}}
 */
export function verifyPaymentBinding({ order, razorpayOrderId, gatewayPayment } = {}) {
    const local = verifyOrderBinding({ order, razorpayOrderId });
    if (!local.ok) return local;

    if (!gatewayPayment || typeof gatewayPayment !== 'object') {
        return reject(FAILURE.GATEWAY_PAYMENT_MISSING);
    }

    // The gateway must say the payment belongs to that same gateway order
    if (gatewayPayment.order_id !== razorpayOrderId) {
        return reject(FAILURE.PAYMENT_ORDER_MISMATCH);
    }

    // Amount must match exactly what we asked for, in paise
    const expected = expectedPaise(order);
    if (expected === null) return reject(FAILURE.MALFORMED_INPUT);
    if (!Number.isInteger(gatewayPayment.amount) || gatewayPayment.amount !== expected) {
        return reject(FAILURE.AMOUNT_MISMATCH, { expectedAmount: expected, receivedAmount: gatewayPayment.amount });
    }

    // Currency must match the order's own currency
    const orderCurrency = order.currency || 'INR';
    if (gatewayPayment.currency && gatewayPayment.currency !== orderCurrency) {
        return reject(FAILURE.CURRENCY_MISMATCH);
    }

    // Only a captured payment has actually moved money
    if (gatewayPayment.status !== 'captured') return reject(FAILURE.NOT_CAPTURED);

    return { ok: true, expectedAmount: expected, capturedAt: gatewayPayment.created_at };
}
