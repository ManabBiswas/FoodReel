import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isGatewayOrderReusable, GATEWAY_ORDER_REUSE_WINDOW_MS } from '../src/services/gatewayOrderReuse.js';

/**
 * A retried checkout must reuse its gateway order, or the customer is charged
 * twice. But an abandoned checkout leaves paymentDetails.status 'processing'
 * forever, and its gateway order dies at Razorpay. The sweep found 23 orders
 * stuck in 'processing' aged 224-248 days — handing those back would fail.
 */

const order = (paymentDetails) => ({ paymentDetails });

describe('isGatewayOrderReusable', () => {
    test('reuses a gateway order created moments ago', () => {
        const result = isGatewayOrderReusable(
            order({
                razorpayOrderId: 'order_ABC',
                status: 'processing',
                razorpayOrderCreatedAt: new Date(Date.now() - 60 * 1000),
            })
        );
        assert.equal(result, true);
    });

    test('refuses an abandoned gateway order from weeks ago', () => {
        const result = isGatewayOrderReusable(
            order({
                razorpayOrderId: 'order_ABC',
                status: 'processing',
                razorpayOrderCreatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            })
        );
        assert.equal(result, false);
    });

    test('refuses once the window has passed', () => {
        const result = isGatewayOrderReusable(
            order({
                razorpayOrderId: 'order_ABC',
                status: 'processing',
                razorpayOrderCreatedAt: new Date(Date.now() - GATEWAY_ORDER_REUSE_WINDOW_MS - 1000),
            })
        );
        assert.equal(result, false);
    });

    // The 23 legacy orders in the local database have no timestamp at all
    test('refuses a legacy order with no creation timestamp', () => {
        const result = isGatewayOrderReusable(
            order({ razorpayOrderId: 'order_ABC', status: 'processing' })
        );
        assert.equal(result, false, 'an undated gateway order is assumed dead');
    });

    test('refuses when there is no gateway order', () => {
        assert.equal(isGatewayOrderReusable(order({ status: 'processing' })), false);
        assert.equal(isGatewayOrderReusable(order({})), false);
    });

    test('refuses once the payment is already settled', () => {
        const result = isGatewayOrderReusable(
            order({
                razorpayOrderId: 'order_ABC',
                status: 'completed',
                razorpayOrderCreatedAt: new Date(),
            })
        );
        assert.equal(result, false);
    });

    test('refuses a timestamp from the future (clock skew)', () => {
        const result = isGatewayOrderReusable(
            order({
                razorpayOrderId: 'order_ABC',
                status: 'processing',
                razorpayOrderCreatedAt: new Date(Date.now() + 60 * 60 * 1000),
            })
        );
        assert.equal(result, false);
    });

    test('never throws on a malformed order', () => {
        for (const bad of [null, undefined, {}, { paymentDetails: null }, { paymentDetails: 'x' }]) {
            assert.equal(isGatewayOrderReusable(bad), false);
        }
    });
});
