/**
 * DB-backed regression: ticket purchase must respect event and tier state.
 *
 * Before this guard a draft or cancelled event could sell tickets, and an
 * inactive tier or one outside its own sales window was still purchasable.
 * The checks live in the atomic reserve query so a concurrent admin edit
 * cannot slip between validation and reservation.
 *
 * Uses MongoMemoryReplSet like the other DB tests; skips cleanly when the
 * binary cannot start.
 */
import { test, after, beforeEach } from 'node:test';
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
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_purchase_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[foodfest.purchase.db] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const paymentService = (await import('../src/services/payment.service.js')).default;
const { purchaseTicket } = await import('../src/controllers/foodfest/ticket.user.controller.js');
const FoodFestEvent = (await import('../src/models/FoodFestEvent.model.js')).default;
const FoodFestTier = (await import('../src/models/FoodFestTier.model.js')).default;
const FoodFestTicket = (await import('../src/models/FoodFestTicket.model.js')).default;

if (connected) {
    await Promise.all([
        FoodFestEvent.init(),
        FoodFestTier.init(),
        FoodFestTicket.init()
    ]);
}

const originalCreateOrder = paymentService.createOrder;
const originalGetKeyId = paymentService.getKeyId;
let orderCalls = 0;

beforeEach(async () => {
    if (!connected) return;
    await Promise.all([
        FoodFestTicket.deleteMany({}),
        FoodFestTier.deleteMany({}),
        FoodFestEvent.deleteMany({})
    ]);
    orderCalls = 0;
    paymentService.createOrder = async (amount, currency) => {
        orderCalls += 1;
        return {
            success: true,
            order_id: `order_${new mongoose.Types.ObjectId()}`,
            amount: Math.round(amount * 100),
            currency
        };
    };
    paymentService.getKeyId = () => 'rzp_test_key';
});

after(() => {
    paymentService.createOrder = originalCreateOrder;
    paymentService.getKeyId = originalGetKeyId;
});

const base = Date.now();
const at = (minutes) => new Date(base + minutes * 60 * 1000);

const makeEvent = (over = {}) => FoodFestEvent.create({
    name: 'Test FoodFest',
    venue: { address: '1 Main Street', city: 'Bengaluru' },
    startTime: at(60),
    endTime: at(180),
    salesStart: at(-60),
    salesEnd: at(30),
    status: 'published',
    organizer: new mongoose.Types.ObjectId(),
    ...over
});

const makeTier = (eventId, over = {}) => FoodFestTier.create({
    eventId,
    name: 'General Admission',
    price: 500,
    quantity: 2,
    active: true,
    ...over
});

const callPurchase = async (eventId, tierId) => {
    const req = {
        body: { eventId, tierId },
        user: { _id: new mongoose.Types.ObjectId() }
    };
    let statusCode = 200;
    let payload;
    const res = {
        status(code) { statusCode = code; return this; },
        json(body) { payload = body; return this; }
    };
    await purchaseTicket(req, res);
    return { statusCode, payload };
};

const reservedOf = async (tierId) =>
    (await FoodFestTier.findById(tierId).lean()).reserved;

test('a published event with an active tier reserves one seat', needsDb, async () => {
    const event = await makeEvent();
    const tier = await makeTier(event._id);

    const { statusCode, payload } = await callPurchase(event._id, tier._id);

    assert.equal(statusCode, 201);
    assert.equal(payload.success, true);
    assert.match(payload.razorpayOrderId, /^order_/);
    assert.equal(payload.amount, 500);
    assert.equal(orderCalls, 1);

    const ticket = await FoodFestTicket.findOne({}).lean();
    assert.equal(ticket.status, 'pending_payment');
    assert.equal(ticket.paymentDetails.razorpayOrderId, payload.razorpayOrderId);
    assert.equal(await reservedOf(tier._id), 1);
});

test('a live event can still sell tickets', needsDb, async () => {
    const event = await makeEvent({ status: 'live' });
    const tier = await makeTier(event._id);

    const { statusCode } = await callPurchase(event._id, tier._id);

    assert.equal(statusCode, 201);
    assert.equal(await FoodFestTicket.countDocuments(), 1);
});

for (const status of ['draft', 'cancelled', 'completed']) {
    test(`a ${status} event cannot sell tickets`, needsDb, async () => {
        const event = await makeEvent({ status });
        const tier = await makeTier(event._id);

        const { statusCode } = await callPurchase(event._id, tier._id);

        assert.equal(statusCode, 404);
        assert.equal(await FoodFestTicket.countDocuments(), 0);
        assert.equal(await reservedOf(tier._id), 0);
        assert.equal(orderCalls, 0);
    });
}

test('an inactive tier cannot be purchased', needsDb, async () => {
    const event = await makeEvent();
    const tier = await makeTier(event._id, { active: false });

    const { statusCode } = await callPurchase(event._id, tier._id);

    assert.equal(statusCode, 409);
    assert.equal(await reservedOf(tier._id), 0);
    assert.equal(orderCalls, 0);
});

test('a tier before its sales window cannot be purchased', needsDb, async () => {
    const event = await makeEvent();
    const tier = await makeTier(event._id, { salesStart: at(10) });

    const { statusCode } = await callPurchase(event._id, tier._id);

    assert.equal(statusCode, 409);
    assert.equal(await reservedOf(tier._id), 0);
});

test('a tier after its sales window cannot be purchased', needsDb, async () => {
    const event = await makeEvent();
    const tier = await makeTier(event._id, { salesEnd: at(-10) });

    const { statusCode } = await callPurchase(event._id, tier._id);

    assert.equal(statusCode, 409);
    assert.equal(await reservedOf(tier._id), 0);
});

test('an event outside its sales window cannot sell tickets', needsDb, async () => {
    const event = await makeEvent({ salesEnd: at(-10) });
    const tier = await makeTier(event._id);

    const { statusCode } = await callPurchase(event._id, tier._id);

    assert.equal(statusCode, 400);
    assert.equal(await reservedOf(tier._id), 0);
    assert.equal(orderCalls, 0);
});

test('a sold-out tier cannot be oversold', needsDb, async () => {
    const event = await makeEvent();
    const tier = await makeTier(event._id, { quantity: 1, reserved: 1 });

    const { statusCode } = await callPurchase(event._id, tier._id);

    assert.equal(statusCode, 409);
    assert.equal(await reservedOf(tier._id), 1);
    assert.equal(orderCalls, 0);
});
