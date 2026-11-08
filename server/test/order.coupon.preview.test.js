/**
 * Quick-order coupon preview.
 *
 * Reel quick order creates an order directly (no cart), so it uses
 * POST /api/orders/validate-coupon to show the discount before payment.
 * These tests lock the preview to the same coupon rules as checkout.
 *
 * DB-backed. Skips cleanly when mongodb-memory-server cannot start.
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
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_order_coupon_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[order.coupon.preview] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const couponModel = (await import('../src/models/coupon.model.js')).default;
const foodModel = (await import('../src/models/food.model.js')).default;
const foodPartnerModel = (await import('../src/models/foodPartner.Model.js')).default;
const orderController = (await import('../src/controllers/order.controller.js')).default;

const oid = () => new mongoose.Types.ObjectId();

const callPreview = async ({ body, userId = oid() }) => {
    const req = { body, user: { _id: userId }, id: 'test' };
    let statusCode = 200;
    let payload;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            payload = data;
            return this;
        }
    };
    await orderController.validateOrderCoupon(req, res);
    return { statusCode, payload };
};

const mkPartner = () => foodPartnerModel.create({
    companyName: 'Preview Kitchen',
    email: `preview-${oid()}@example.com`,
    password: 'hashed-password',
    mobile: '9876543210',
    address: '1 Test Street'
});

const mkFood = (partnerId, overrides = {}) => foodModel.create({
    name: 'Test Dish',
    description: 'Test dish',
    type: 'image',
    postType: 'food',
    price: 120,
    foodPartner: partnerId,
    ...overrides
});

const mkCoupon = (partnerId, overrides = {}) => couponModel.create({
    code: 'PREVIEW20',
    partnerId,
    discountType: 'fixed',
    discountValue: 20,
    minOrderAmount: 0,
    perUserLimit: 1,
    ...overrides
});

describe('POST /api/orders/validate-coupon (quick order preview)', () => {
    beforeEach(async () => {
        if (!connected) return;
        await Promise.all([
            couponModel.deleteMany({}),
            foodModel.deleteMany({}),
            foodPartnerModel.deleteMany({})
        ]);
    });

    test('returns the discount and server pricing for a valid code', needsDb, async () => {
        const partner = await mkPartner();
        const food = await mkFood(partner._id);
        await mkCoupon(partner._id, { minOrderAmount: 100 });

        const { statusCode, payload } = await callPreview({
            body: { items: [{ foodItemId: food._id, quantity: 1 }], code: 'preview20' }
        });

        assert.equal(statusCode, 200);
        assert.equal(payload.success, true);
        assert.equal(payload.code, 'PREVIEW20');
        assert.equal(payload.discount, 20);
        assert.equal(payload.pricing.discount, 20);
        assert.equal(payload.pricing.itemPrice, 120);
        // 120 + 3.60 platform = 123.60; 5% GST = 6.18; 129.78 - 20 = 109.78
        assert.equal(payload.pricing.totalAmount, 109.78);
    });

    test('below the minimum returns COUPON_BELOW_MINIMUM', needsDb, async () => {
        const partner = await mkPartner();
        const food = await mkFood(partner._id, { price: 80 });
        await mkCoupon(partner._id, { minOrderAmount: 100 });

        const { statusCode, payload } = await callPreview({
            body: { items: [{ foodItemId: food._id, quantity: 1 }], code: 'PREVIEW20' }
        });

        assert.equal(statusCode, 400);
        assert.equal(payload.code, 'COUPON_BELOW_MINIMUM');
        assert.equal(payload.minOrderAmount, 100);
    });

    test('a code from another kitchen is rejected', needsDb, async () => {
        const partner = await mkPartner();
        const otherPartner = await mkPartner();
        const food = await mkFood(partner._id);
        await mkCoupon(otherPartner._id);

        const { statusCode, payload } = await callPreview({
            body: { items: [{ foodItemId: food._id, quantity: 1 }], code: 'PREVIEW20' }
        });

        assert.equal(statusCode, 400);
        assert.equal(payload.code, 'COUPON_WRONG_RESTAURANT');
    });

    test('an unavailable item is rejected before coupon validation', needsDb, async () => {
        const partner = await mkPartner();
        const food = await mkFood(partner._id, { isAvailable: false });
        await mkCoupon(partner._id);

        const { statusCode, payload } = await callPreview({
            body: { items: [{ foodItemId: food._id, quantity: 1 }], code: 'PREVIEW20' }
        });

        assert.equal(statusCode, 400);
        assert.match(payload.error, /currently unavailable/);
    });
});
