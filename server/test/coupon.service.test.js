/**
 * Coupon domain tests.
 *
 * The audit found the discount path was a dead sticker: `computeDiscount`
 * existed as a stub but no request could ever reach it. These tests lock the
 * real rules in `coupon.service.js` — discount maths, every validation
 * branch, idempotent consume/release, the usage-limit race, and ad sync.
 *
 * DB-backed. Runs against a real mongod via MongoMemoryReplSet like
 * db.integration.test.js; skips cleanly when the binary cannot start.
 */
import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const mongoose = (await import('mongoose')).default;
mongoose.set('strictQuery', true);

let mongoServer;
let connected = false;
let unavailableReason = 'database not started';

try {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_coupon_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[coupon.service] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const couponService = (await import('../src/services/coupon.service.js')).default;
const couponModel = (await import('../src/models/coupon.model.js')).default;
const orderModel = (await import('../src/models/order.model.js')).default;
const paymentService = (await import('../src/services/payment.service.js')).default;

const { normalizeCode, isValidCode, MIN_CODE_LENGTH, computeDiscount, getEligibleSummary, validateCoupon, resolveCartDiscount,
    consumeCoupon, releaseCoupon, findCodeConflict, syncCouponForPromotion,
    getPartnerStats } = couponService;

const oid = () => new mongoose.Types.ObjectId();

beforeEach(async () => {
    if (!connected) return;
    await couponModel.deleteMany({});
    await orderModel.deleteMany({});
});

const PARTNER = oid();
const OTHER_PARTNER = oid();
const USER = oid();
const OTHER_USER = oid();

const mkCoupon = (overrides = {}) => couponModel.create({
    code: 'WEEKEND50',
    partnerId: PARTNER,
    description: 'Test offer',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 0,
    perUserLimit: 1,
    ...overrides
});

const mkOrder = ({ userId = USER, couponDoc = null, discountAmount = 50, status = 'pending' } = {}) => {
    const data = {
        user: userId,
        items: [{ foodItem: oid(), quantity: 1, priceAtOrder: 279, foodPartner: PARTNER }],
        orderSource: 'cart',
        paymentDetails: { method: 'cod', status: 'pending' },
        deliveryAddress: {
            fullName: 'Test User', phone: '9876543210', addressLine1: '1 Test St',
            city: 'Kolkata', state: 'West Bengal', pincode: '700001'
        },
        pricing: { itemPrice: 279, deliveryFee: 0, platformFee: 8.37, taxes: { gst: 14.37, total: 14.37 }, discount: discountAmount, totalAmount: 251.74 }
    };
    if (couponDoc) {
        data.coupon = { couponId: couponDoc._id, code: couponDoc.code, discountType: couponDoc.discountType, discountAmount };
    }
    return orderModel.create({ ...data, status });
};

// ---------- pure functions (no DB needed) ----------

describe('normalizeCode', () => {
    test('uppercases and trims', () => {
        assert.equal(normalizeCode('  weekend50 '), 'WEEKEND50');
        assert.equal(normalizeCode('CDP-200_x'), 'CDP-200_X');
    });
    test('non-strings become empty', () => {
        assert.equal(normalizeCode(null), '');
        assert.equal(normalizeCode(undefined), '');
        assert.equal(normalizeCode(123), '');
        assert.equal(normalizeCode(''), '');
    });
});

describe('isValidCode', () => {
    test('requires 5-32 characters', () => {
        assert.equal(MIN_CODE_LENGTH, 5);
        assert.equal(isValidCode('ABCD'), false);
        assert.equal(isValidCode('ABCDE'), true);
        assert.equal(isValidCode('  abcde  '), true);
        assert.equal(isValidCode('A'.repeat(32)), true);
        assert.equal(isValidCode('A'.repeat(33)), false);
    });
    test('rejects characters outside the code alphabet', () => {
        assert.equal(isValidCode('AB CDE'), false);
        assert.equal(isValidCode('ABCDE!'), false);
        assert.equal(isValidCode(''), false);
    });
    test('the model refuses a code under five characters', needsDb, async () => {
        await assert.rejects(mkCoupon({ code: 'ABCD' }));
    });
});

describe('computeDiscount', () => {
    test('fixed discount is capped at the subtotal', () => {
        assert.equal(computeDiscount({ discountType: 'fixed', discountValue: 200 }, 279), 200);
        assert.equal(computeDiscount({ discountType: 'fixed', discountValue: 999 }, 279), 279);
    });
    test('percentage discount honours the cap', () => {
        assert.equal(computeDiscount({ discountType: 'percentage', discountValue: 20 }, 1000), 200);
        assert.equal(computeDiscount({ discountType: 'percentage', discountValue: 20, maxDiscount: 150 }, 1000), 150);
        assert.equal(computeDiscount({ discountType: 'percentage', discountValue: 20, maxDiscount: null }, 1000), 200);
    });
    test('rounds to paise', () => {
        assert.equal(computeDiscount({ discountType: 'percentage', discountValue: 15 }, 333.33), 50);
    });
    test('never negative, never on an empty cart', () => {
        assert.equal(computeDiscount({ discountType: 'fixed', discountValue: 50 }, 0), 0);
        assert.equal(computeDiscount(null, 500), 0);
        assert.equal(computeDiscount({ discountType: 'fixed', discountValue: -20 }, 500), 0);
    });
    test('zero subtotal returns 0 even for a huge fixed code', () => {
        assert.equal(computeDiscount({ discountType: 'fixed', discountValue: 10000 }, 0), 0);
    });
});

describe('payment pricing clamp (coupon safety net)', () => {
    test('a discount larger than the payable total clamps to zero, not negative', () => {
        const p = paymentService.calculatePricing(100, 1, 0, 99999);
        assert.equal(p.totalAmount, 0);
        assert.ok(p.discount <= p.itemPrice + p.deliveryFee + p.platformFee + p.taxes.gst);
    });
    test('negative and NaN discounts are treated as zero', () => {
        const clean = paymentService.calculatePricing(279, 1, 0, 0);
        assert.equal(paymentService.calculatePricing(279, 1, 0, -50).discount, 0);
        assert.equal(paymentService.calculatePricing(279, 1, 0, NaN).discount, 0);
        assert.equal(paymentService.calculatePricing(279, 1, 0, -50).totalAmount, clean.totalAmount);
    });
    test('total is always a 2-decimal paise value', () => {
        const p = paymentService.calculatePricing(279, 1, 0, 200);
        assert.equal(p.totalAmount, 101.74);
    });
});

// ---------- validateCoupon ----------

describe('validateCoupon', () => {
    test('happy path returns the discount for the owning restaurant', needsDb, async () => {
        await mkCoupon();
        const r = await validateCoupon({ code: 'weekend50', userId: USER, partnerId: PARTNER, itemsTotal: 500 });
        assert.equal(r.ok, true);
        assert.equal(r.discountAmount, 50);
        assert.equal(r.coupon.code, 'WEEKEND50');
    });

    test('empty input is COUPON_REQUIRED', needsDb, async () => {
        assert.equal((await validateCoupon({ code: '', partnerId: PARTNER, itemsTotal: 500 })).code, 'COUPON_REQUIRED');
        assert.equal((await validateCoupon({ code: '   ', partnerId: PARTNER, itemsTotal: 500 })).code, 'COUPON_REQUIRED');
    });

    test('a code under five characters is rejected before lookup', needsDb, async () => {
        const r = await validateCoupon({ code: 'ABC', partnerId: PARTNER, itemsTotal: 500 });
        assert.equal(r.ok, false);
        assert.equal(r.code, 'COUPON_INVALID');
    });
    test('unknown code is COUPON_NOT_FOUND', needsDb, async () => {
        assert.equal((await validateCoupon({ code: 'NOPE999', partnerId: PARTNER, itemsTotal: 500 })).code, 'COUPON_NOT_FOUND');
    });
    test('inactive code is COUPON_INACTIVE', needsDb, async () => {
        await mkCoupon({ isActive: false });
        assert.equal((await validateCoupon({ code: 'WEEKEND50', partnerId: PARTNER, itemsTotal: 500 })).code, 'COUPON_INACTIVE');
    });
    test('expired code is COUPON_EXPIRED', needsDb, async () => {
        await mkCoupon({ validUntil: new Date(Date.now() - 1000) });
        assert.equal((await validateCoupon({ code: 'WEEKEND50', partnerId: PARTNER, itemsTotal: 500 })).code, 'COUPON_EXPIRED');
    });
    test('future code is COUPON_NOT_STARTED', needsDb, async () => {
        await mkCoupon({ validFrom: new Date(Date.now() + 864e5) });
        assert.equal((await validateCoupon({ code: 'WEEKEND50', partnerId: PARTNER, itemsTotal: 500 })).code, 'COUPON_NOT_STARTED');
    });
    test('wrong restaurant is COUPON_WRONG_RESTAURANT', needsDb, async () => {
        await mkCoupon();
        const r = await validateCoupon({ code: 'WEEKEND50', partnerId: OTHER_PARTNER, itemsTotal: 500 });
        assert.equal(r.code, 'COUPON_WRONG_RESTAURANT');
        const r2 = await validateCoupon({ code: 'WEEKEND50', partnerId: null, itemsTotal: 500 });
        assert.equal(r2.code, 'COUPON_WRONG_RESTAURANT');
    });
    test('below minimum is COUPON_BELOW_MINIMUM with the shortfall', needsDb, async () => {
        await mkCoupon({ minOrderAmount: 499 });
        const r = await validateCoupon({ code: 'WEEKEND50', partnerId: PARTNER, itemsTotal: 279 });
        assert.equal(r.code, 'COUPON_BELOW_MINIMUM');
        assert.equal(r.minOrderAmount, 499);
        assert.match(r.message, /220/);
    });
    test('at the exact minimum passes', needsDb, async () => {
        await mkCoupon({ minOrderAmount: 499 });
        const r = await validateCoupon({ code: 'WEEKEND50', partnerId: PARTNER, itemsTotal: 499 });
        assert.equal(r.ok, true);
    });
    test('exhausted code is COUPON_LIMIT_REACHED', needsDb, async () => {
        await mkCoupon({ usageLimit: 2, usedCount: 2 });
        assert.equal((await validateCoupon({ code: 'WEEKEND50', partnerId: PARTNER, itemsTotal: 500 })).code, 'COUPON_LIMIT_REACHED');
    });
    test('one below the limit still passes', needsDb, async () => {
        await mkCoupon({ usageLimit: 2, usedCount: 1 });
        assert.equal((await validateCoupon({ code: 'WEEKEND50', partnerId: PARTNER, itemsTotal: 500 })).ok, true);
    });
    test('per-user limit blocks a repeat use but not another customer', needsDb, async () => {
        const coupon = await mkCoupon({ perUserLimit: 1 });
        const order = await mkOrder({ userId: USER, couponDoc: coupon });
        const consumed = await consumeCoupon(order);
        assert.equal(consumed.ok, true);

        const repeat = await validateCoupon({ code: 'WEEKEND50', userId: USER, partnerId: PARTNER, itemsTotal: 500 });
        assert.equal(repeat.code, 'COUPON_USER_LIMIT_REACHED');

        const other = await validateCoupon({ code: 'WEEKEND50', userId: OTHER_USER, partnerId: PARTNER, itemsTotal: 500 });
        assert.equal(other.ok, true);
    });
    test('a cancelled redemption frees the per-user slot', needsDb, async () => {
        const coupon = await mkCoupon({ perUserLimit: 1 });
        const order = await mkOrder({ userId: USER, couponDoc: coupon });
        await consumeCoupon(order);
        // Mirror the real cancel flow: the status becomes 'cancelled' and the
        // redemption is released. Validation only ignores consumed orders
        // whose status is 'cancelled', so release alone must not free the slot.
        order.status = 'cancelled';
        await order.save();
        await releaseCoupon(order);
        const r = await validateCoupon({ code: 'WEEKEND50', userId: USER, partnerId: PARTNER, itemsTotal: 500 });
        assert.equal(r.ok, true);
    });
    test('percentage codes validate with the capped amount', needsDb, async () => {
        await mkCoupon({ code: 'P20OFF', discountType: 'percentage', discountValue: 20, maxDiscount: 150 });
        const r = await validateCoupon({ code: 'P20OFF', partnerId: PARTNER, itemsTotal: 1000 });
        assert.equal(r.ok, true);
        assert.equal(r.discountAmount, 150);
    });
});

// ---------- consume / release ----------

describe('consumeCoupon', () => {
    test('counts exactly one redemption per order', needsDb, async () => {
        const coupon = await mkCoupon();
        const order = await mkOrder({ couponDoc: coupon });
        const r = await consumeCoupon(order);
        assert.equal(r.ok, true);
        assert.equal((await couponModel.findById(coupon._id)).usedCount, 1);
        const stored = await orderModel.findById(order._id);
        assert.ok(stored.coupon.consumedAt, 'consumedAt must be stamped');
    });

    test('is idempotent: verify and webhook racing both land safely', needsDb, async () => {
        const coupon = await mkCoupon();
        const order = await mkOrder({ couponDoc: coupon });
        const first = await consumeCoupon(order);
        const second = await consumeCoupon(order);
        assert.equal(first.ok, true);
        assert.equal(second.alreadyConsumed, true);
        assert.equal((await couponModel.findById(coupon._id)).usedCount, 1);
    });

    test('orders without a coupon are skipped', needsDb, async () => {
        const order = await mkOrder();
        assert.equal((await consumeCoupon(order)).skipped, true);
    });

    test('the usage-limit race admits exactly one winner', needsDb, async () => {
        const coupon = await mkCoupon({ usageLimit: 1, perUserLimit: 5 });
        const o1 = await mkOrder({ userId: USER, couponDoc: coupon });
        const o2 = await mkOrder({ userId: OTHER_USER, couponDoc: coupon });
        const [r1, r2] = await Promise.all([consumeCoupon(o1), consumeCoupon(o2)]);
        const winners = [r1, r2].filter((r) => r.ok && r.coupon);
        const honoured = [r1, r2].filter((r) => !r.ok && r.honoured);
        assert.equal(winners.length, 1, 'exactly one order may consume beyond the limit');
        assert.equal(honoured.length, 1, 'the loser must be honoured, not failed');
        assert.equal((await couponModel.findById(coupon._id)).usedCount, 1);
    });

    test('per-user limit at consume time honours without counting', needsDb, async () => {
        const coupon = await mkCoupon({ perUserLimit: 1 });
        const o1 = await mkOrder({ userId: USER, couponDoc: coupon });
        const o2 = await mkOrder({ userId: USER, couponDoc: coupon });
        await consumeCoupon(o1);
        const r2 = await consumeCoupon(o2);
        assert.equal(r2.ok, false);
        assert.equal(r2.code, 'COUPON_USER_LIMIT_REACHED');
        assert.equal(r2.honoured, true);
        assert.equal((await couponModel.findById(coupon._id)).usedCount, 1);
        const stored = await orderModel.findById(o2._id);
        assert.equal(stored.coupon.consumedAt, undefined, 'the over-limit order must not count as consumed');
        assert.ok(stored.orderNotes.some((n) => /per-customer limit/.test(n.note)));
    });
});

describe('releaseCoupon', () => {
    test('a cancellation returns the redemption to the pool', needsDb, async () => {
        const coupon = await mkCoupon();
        const order = await mkOrder({ couponDoc: coupon });
        await consumeCoupon(order);
        assert.equal((await couponModel.findById(coupon._id)).usedCount, 1);
        const r = await releaseCoupon(order);
        assert.equal(r.ok, true);
        assert.equal((await couponModel.findById(coupon._id)).usedCount, 0);
        assert.ok((await orderModel.findById(order._id)).coupon.releasedAt);
    });

    test('is idempotent: a double cancel cannot push usedCount below zero', needsDb, async () => {
        const coupon = await mkCoupon();
        const order = await mkOrder({ couponDoc: coupon });
        await consumeCoupon(order);
        await releaseCoupon(order);
        const again = await releaseCoupon(order);
        assert.equal(again.alreadyReleased, true);
        assert.equal((await couponModel.findById(coupon._id)).usedCount, 0);
    });

    test('orders that were never consumed are skipped', needsDb, async () => {
        const coupon = await mkCoupon();
        const order = await mkOrder({ couponDoc: coupon });
        assert.equal((await releaseCoupon(order)).alreadyReleased, true);
    });
});

// ---------- resolveCartDiscount ----------

describe('resolveCartDiscount', () => {
    test('no promo on the cart is a no-op', needsDb, async () => {
        const cart = { user: USER, activeRestaurant: PARTNER, appliedPromo: undefined };
        assert.deepEqual(await resolveCartDiscount(cart), { ok: false, hasCoupon: false, discount: 0 });
    });
    test('a still-valid code refreshes the stored discount amount', needsDb, async () => {
        await mkCoupon({ discountType: 'percentage', discountValue: 20 });
        const cart = {
            user: USER, activeRestaurant: PARTNER, appliedPromo: { code: 'weekend50' },
            items: [{ foodItem: oid(), quantity: 1, priceAtAdd: 1000 }]
        };
        const r = await resolveCartDiscount(cart);
        assert.equal(r.ok, true);
        assert.equal(r.discount, 200);
        assert.equal(cart.appliedPromo.discountAmount, 200);
        assert.equal(cart.appliedPromo.code, 'WEEKEND50');
    });
    test('a stale code reports why it was dropped', needsDb, async () => {
        await mkCoupon({ minOrderAmount: 499 });
        const cart = {
            user: USER, activeRestaurant: PARTNER, appliedPromo: { code: 'WEEKEND50' },
            items: [{ foodItem: oid(), quantity: 1, priceAtAdd: 279 }]
        };
        const r = await resolveCartDiscount(cart);
        assert.equal(r.ok, false);
        assert.equal(r.hasCoupon, true);
        assert.equal(r.code, 'COUPON_BELOW_MINIMUM');
        assert.match(r.message, /220/);
    });
});

// ---------- ad sync + conflicts ----------

describe('syncCouponForPromotion', () => {
    test('derives a fixed coupon from the advertised prices', needsDb, async () => {
        const r = await syncCouponForPromotion({
            code: 'THALI299', partnerId: PARTNER,
            prices: { original: 399, discounted: 299 }, description: 'Thali offer'
        });
        assert.equal(r.ok, true);
        assert.equal(r.coupon.discountType, 'fixed');
        assert.equal(r.coupon.discountValue, 100);
        assert.equal(r.coupon.code, 'THALI299');
    });
    test('an edit moves the discount, not the code', needsDb, async () => {
        const first = await syncCouponForPromotion({
            code: 'THALI299', partnerId: PARTNER,
            prices: { original: 399, discounted: 299 }
        });
        const second = await syncCouponForPromotion({
            existingCouponId: first.coupon._id, code: 'THALI299', partnerId: PARTNER,
            prices: { original: 399, discounted: 349 }
        });
        assert.equal(second.coupon._id.toString(), first.coupon._id.toString());
        assert.equal(second.coupon.discountValue, 50);
    });
    test('clearing the code deactivates the redeemable coupon', needsDb, async () => {
        const first = await syncCouponForPromotion({
            code: 'THALI299', partnerId: PARTNER,
            prices: { original: 399, discounted: 299 }
        });
        const r = await syncCouponForPromotion({ existingCouponId: first.coupon._id, code: '', partnerId: PARTNER });
        assert.equal(r.ok, true);
        assert.equal(r.coupon, null);
        const stored = await couponModel.findById(first.coupon._id);
        assert.equal(stored.isActive, false);
    });
    test('prices without a discount yield COUPON_NO_DISCOUNT', needsDb, async () => {
        const r = await syncCouponForPromotion({
            code: 'FLAT299', partnerId: PARTNER,
            prices: { original: 299, discounted: 299 }
        });
        assert.equal(r.ok, false);
        assert.equal(r.code, 'COUPON_NO_DISCOUNT');
        assert.equal(await couponModel.countDocuments({ code: 'FLAT299' }), 0);
    });
    test('rejects a code shorter than five characters', needsDb, async () => {
        const r = await syncCouponForPromotion({
            code: 'AB1', partnerId: PARTNER,
            prices: { original: 399, discounted: 299 }
        });
        assert.equal(r.ok, false);
        assert.equal(r.code, 'COUPON_INVALID_CODE');
        assert.equal(await couponModel.countDocuments({ code: 'AB1' }), 0);
    });
    test('another restaurant cannot take the code', needsDb, async () => {
        await syncCouponForPromotion({
            code: 'THALI299', partnerId: PARTNER,
            prices: { original: 399, discounted: 299 }
        });
        const r = await syncCouponForPromotion({
            code: 'THALI299', partnerId: OTHER_PARTNER,
            prices: { original: 399, discounted: 299 }
        });
        assert.equal(r.ok, false);
        assert.equal(r.code, 'COUPON_CODE_TAKEN');
    });
});

describe('findCodeConflict', () => {
    test('same owner is not a conflict, a stranger is', needsDb, async () => {
        await mkCoupon();
        assert.equal(await findCodeConflict('WEEKEND50', PARTNER), null);
        assert.equal(await findCodeConflict('missing', OTHER_PARTNER), null);
        assert.equal(await findCodeConflict('', OTHER_PARTNER), null);
        const conflict = await findCodeConflict('weekend50', OTHER_PARTNER);
        assert.equal(conflict.code, 'WEEKEND50');
    });
});

// ---------- partner stats ----------

describe('getPartnerStats', () => {
    test('aggregates orders, discount and revenue; cancelled orders are excluded', needsDb, async () => {
        const a = await mkCoupon({ code: 'AAAAA', discountValue: 50 });
        const b = await mkCoupon({ code: 'BBBBB', discountValue: 100 });
        await mkCoupon({ code: 'CCCCC', partnerId: OTHER_PARTNER });

        const live = await mkOrder({ couponDoc: a, discountAmount: 50 });
        await consumeCoupon(live);
        const cancelled = await mkOrder({ couponDoc: a, discountAmount: 50 });
        await consumeCoupon(cancelled);
        cancelled.status = 'cancelled';
        await cancelled.save();
        await releaseCoupon(cancelled);

        const stats = await getPartnerStats(PARTNER);
        assert.equal(stats.length, 2, 'only this partner\'s coupons are listed');
        const row = stats.find((c) => c.code === 'AAAAA');
        assert.equal(row.stats.orders, 1);
        assert.equal(row.stats.discountGiven, 50);
        assert.equal(row.stats.revenue, 251.74);
        const empty = stats.find((c) => c.code === 'BBBBB');
        assert.deepEqual(empty.stats, { orders: 0, discountGiven: 0, revenue: 0 });
    });
    test('a partner with no coupons gets an empty list', needsDb, async () => {
        assert.deepEqual(await getPartnerStats(OTHER_PARTNER), []);
    });
});

// ---------- item scoping + minimum quantity ----------

describe('item scoping (applicableItemIds)', () => {
    const ITEM_A = oid();
    const ITEM_B = oid();
    const ITEM_C = oid();

    test('getEligibleSummary counts quantities, not lines', () => {
        const coupon = { applicableItemIds: [ITEM_A], discountType: 'fixed', discountValue: 50 };
        const summary = getEligibleSummary(coupon, [
            { foodItemId: ITEM_A, quantity: 2, price: 100 },
            { foodItemId: ITEM_B, quantity: 1, price: 300 }
        ]);
        assert.equal(summary.scoped, true);
        assert.equal(summary.eligibleTotal, 200);
        assert.equal(summary.eligibleQuantity, 2);
        assert.equal(summary.eligibleItems, 1);
        assert.equal(summary.ineligibleItems, 1);
        assert.equal(summary.cartTotal, 500);
        assert.equal(summary.cartQuantity, 3);
    });

    test('a whole-cart code (no applicableItemIds) is eligible on everything', () => {
        const summary = getEligibleSummary({ applicableItemIds: [] }, [
            { foodItemId: ITEM_A, quantity: 2, price: 100 },
            { foodItemId: ITEM_B, quantity: 1, price: 300 }
        ]);
        assert.equal(summary.scoped, false);
        assert.equal(summary.eligibleTotal, 500);
        assert.equal(summary.eligibleQuantity, 3);
        assert.equal(summary.ineligibleItems, 0);
    });

    test('a scoped code with no eligible items fails COUPON_NO_ELIGIBLE_ITEMS', needsDb, async () => {
        await mkCoupon({ code: 'SCOPED', applicableItemIds: [ITEM_A] });
        const r = await validateCoupon({
            code: 'SCOPED', partnerId: PARTNER, userId: OTHER_USER,
            items: [{ foodItemId: ITEM_B, quantity: 1, price: 500 }]
        });
        assert.equal(r.ok, false);
        assert.equal(r.code, 'COUPON_NO_ELIGIBLE_ITEMS');
    });

    test('the minimum is measured on the eligible portion only', needsDb, async () => {
        await mkCoupon({ code: 'SCOPED', applicableItemIds: [ITEM_A], minOrderAmount: 250 });
        const r = await validateCoupon({
            code: 'SCOPED', partnerId: PARTNER, userId: OTHER_USER,
            items: [
                { foodItemId: ITEM_A, quantity: 1, price: 200 },
                { foodItemId: ITEM_B, quantity: 1, price: 500 }
            ]
        });
        assert.equal(r.ok, false);
        assert.equal(r.code, 'COUPON_BELOW_MINIMUM');
        assert.equal(r.minOrderAmount, 250);
        assert.equal(r.eligibleTotal, 200);
        assert.match(r.message, /50/); // ₹50 short on the eligible portion, not the ₹700 cart
    });

    test('a percentage discount counts only the eligible portion', needsDb, async () => {
        await mkCoupon({
            code: 'SCOPED', applicableItemIds: [ITEM_A],
            discountType: 'percentage', discountValue: 50, maxDiscount: null
        });
        const r = await validateCoupon({
            code: 'SCOPED', partnerId: PARTNER, userId: OTHER_USER,
            items: [
                { foodItemId: ITEM_A, quantity: 2, price: 100 },
                { foodItemId: ITEM_B, quantity: 1, price: 500 }
            ]
        });
        assert.equal(r.ok, true);
        assert.equal(r.discountAmount, 100); // 50% of ₹200 eligible, not of the ₹700 cart
        assert.equal(r.eligibleTotal, 200);
        assert.equal(r.scoped, true);
    });

    test('a scoped code succeeds when the eligible portion qualifies', needsDb, async () => {
        await mkCoupon({ code: 'SCOPED', applicableItemIds: [ITEM_A], discountValue: 20, minOrderAmount: 2 });
        const r = await validateCoupon({
            code: 'SCOPED', partnerId: PARTNER, userId: OTHER_USER,
            items: [{ foodItemId: ITEM_A, quantity: 1, price: 99 }]
        });
        assert.equal(r.ok, true);
        assert.equal(r.discountAmount, 20);
    });

    test('whole-cart legacy codes still validate with the items array', needsDb, async () => {
        await mkCoupon({ code: 'LEGACY', minOrderAmount: 2 });
        const r = await validateCoupon({
            code: 'LEGACY', partnerId: PARTNER, userId: OTHER_USER,
            items: [{ foodItemId: ITEM_C, quantity: 1, price: 99 }]
        });
        assert.equal(r.ok, true);
        assert.equal(r.scoped, false);
    });

    test('resolveCartDiscount re-validates scope on every mutation', needsDb, async () => {
        await mkCoupon({ code: 'SCOPED', applicableItemIds: [ITEM_A], discountValue: 30 });
        const cart = {
            user: USER, activeRestaurant: PARTNER,
            appliedPromo: { code: 'SCOPED' },
            items: [
                { foodItem: { _id: ITEM_A }, quantity: 1, priceAtAdd: 100 },
                { foodItem: { _id: ITEM_B }, quantity: 1, priceAtAdd: 400 }
            ]
        };
        const r = await resolveCartDiscount(cart);
        assert.equal(r.ok, true);
        assert.equal(r.discount, 30);
        assert.equal(r.ineligibleItems, 1);

        // The eligible item leaves the cart -> the code stops being valid.
        cart.items = [{ foodItem: { _id: ITEM_B }, quantity: 1, priceAtAdd: 400 }];
        const dropped = await resolveCartDiscount(cart);
        assert.equal(dropped.ok, false);
        assert.equal(dropped.code, 'COUPON_NO_ELIGIBLE_ITEMS');
    });
});

describe('minimum quantity (minQuantity)', () => {
    test('whole-cart codes count total quantity', needsDb, async () => {
        await mkCoupon({ code: 'BUY2X', minQuantity: 2 });
        const item = (quantity) => ({ foodItemId: oid(), quantity, price: 50 });
        const below = await validateCoupon({
            code: 'BUY2X', partnerId: PARTNER, userId: OTHER_USER, items: [item(1)]
        });
        assert.equal(below.code, 'COUPON_BELOW_QUANTITY');
        assert.equal(below.minQuantity, 2);
        assert.equal(below.eligibleQuantity, 1);

        const ok = await validateCoupon({
            code: 'BUY2X', partnerId: PARTNER, userId: OTHER_USER, items: [item(2)]
        });
        assert.equal(ok.ok, true);
        assert.equal(ok.eligibleQuantity, 2);
    });

    test('scoped codes count eligible quantity, never the whole cart', needsDb, async () => {
        const A = oid();
        const B = oid();
        await mkCoupon({ code: 'SCOPED', applicableItemIds: [A], minQuantity: 2 });
        const r = await validateCoupon({
            code: 'SCOPED', partnerId: PARTNER, userId: OTHER_USER,
            items: [
                { foodItemId: A, quantity: 1, price: 500 },
                { foodItemId: B, quantity: 5, price: 500 }
            ]
        });
        assert.equal(r.code, 'COUPON_BELOW_QUANTITY', 'five ineligible items cannot satisfy a 2-item rule');
        assert.equal(r.eligibleQuantity, 1);
    });

    test('quantity is summed across lines of the same item', needsDb, async () => {
        const A = oid();
        await mkCoupon({ code: 'SCOPED', applicableItemIds: [A], minQuantity: 3 });
        const r = await validateCoupon({
            code: 'SCOPED', partnerId: PARTNER, userId: OTHER_USER,
            items: [
                { foodItemId: A, quantity: 1, price: 100 },
                { foodItemId: A, quantity: 2, price: 100 }
            ]
        });
        assert.equal(r.ok, true);
        assert.equal(r.eligibleQuantity, 3);
    });
});
