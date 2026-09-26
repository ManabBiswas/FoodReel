import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import paymentService from '../src/services/payment.service.js';

/**
 * The pricing formula is the single source of truth for what a customer pays:
 *   base = itemPrice * quantity
 *   total = base + deliveryFee + 3% platform fee, +5% GST, - discount
 * These tests lock the formula AND document two known weaknesses so a future
 * change to them is a deliberate decision rather than an accident.
 */
describe('calculatePricing', () => {
    test('applies quantity to the item price', () => {
        const p = paymentService.calculatePricing(100, 3);
        assert.equal(p.itemPrice, 300);
    });

    test('platform fee is 3% and GST is 5% of the pre-tax subtotal', () => {
        const p = paymentService.calculatePricing(100, 1);
        assert.equal(p.platformFee, 3);          // 3% of 100
        assert.equal(p.taxes.gst, 5.15);         // 5% of (100 + 0 + 3)
        assert.equal(p.totalAmount, 108.15);
    });

    test('delivery fee is distance-tiered', () => {
        assert.equal(paymentService.calculatePricing(100, 1, 0).deliveryFee, 0);
        assert.equal(paymentService.calculatePricing(100, 1, 1.9).deliveryFee, 0);
        assert.equal(paymentService.calculatePricing(100, 1, 2).deliveryFee, 20);
        assert.equal(paymentService.calculatePricing(100, 1, 4.9).deliveryFee, 20);
        assert.equal(paymentService.calculatePricing(100, 1, 5).deliveryFee, 40);
        assert.equal(paymentService.calculatePricing(100, 1, 9.9).deliveryFee, 40);
        assert.equal(paymentService.calculatePricing(100, 1, 25).deliveryFee, 60);
    });

    test('rounds to paise so no float drift reaches Razorpay', () => {
        const p = paymentService.calculatePricing(33.33, 3);
        // Every monetary field must be a 2-decimal value
        for (const key of ['itemPrice', 'platformFee', 'totalAmount']) {
            assert.equal(Math.round(p[key] * 100) / 100, p[key], `${key} has sub-paise precision`);
        }
        assert.equal(p.taxes.gst, Math.round(p.taxes.gst * 100) / 100);
    });

    test('subtracts discount after tax', () => {
        const withDiscount = paymentService.calculatePricing(100, 1, 0, 10);
        const without = paymentService.calculatePricing(100, 1, 0, 0);
        assert.equal(without.totalAmount - withDiscount.totalAmount, 10);
    });

    test('returns a total equal to its own components', () => {
        const p = paymentService.calculatePricing(249.99, 2, 6, 15);
        const expected =
            p.itemPrice + p.deliveryFee + p.platformFee + p.taxes.gst - p.discount;
        assert.equal(p.totalAmount, Math.round(expected * 100) / 100);
    });

    // KNOWN WEAKNESS: callers currently pass no distance, so deliveryFee is
    // always 0 (see order.controller.js / cart.controller.js). The tiers above
    // are therefore dead code in the current order flow. If you start passing a
    // real distance, these two tests should be replaced with assertions on the
    // real behaviour.
    test('KNOWN GAP: no caller passes a distance yet, so fees are always 0', () => {
        const p = paymentService.calculatePricing(500, 2);
        assert.equal(p.deliveryFee, 0);
    });

    // KNOWN WEAKNESS: negative price or a NaN quantity is not rejected here.
    // Callers validate, but the service itself is unguarded. A test that
    // documents the current (unsafe) behaviour makes an eventual fix visible.
    test('KNOWN GAP: does not reject a negative price', () => {
        const p = paymentService.calculatePricing(-100, 1);
        assert.ok(p.totalAmount < 0, 'expected the unguarded negative total');
    });
});
