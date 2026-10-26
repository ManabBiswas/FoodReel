/**
 * DB-backed regressions for the FoodFest admin list endpoints and the tier
 * capacity invariant. Static tests pin the query shape; these prove the
 * queries and the atomic guard behave against a real replica set.
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
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_admin_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[foodfest.admin.db] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const {
    listEvents,
    listZones,
    listTiers,
    createZone,
    createTier,
    updateTier
} = await import('../src/controllers/foodfest/event.admin.controller.js');
const FoodFestEvent = (await import('../src/models/FoodFestEvent.model.js')).default;
const FoodFestZone = (await import('../src/models/FoodFestZone.model.js')).default;
const FoodFestTier = (await import('../src/models/FoodFestTier.model.js')).default;

beforeEach(async () => {
    if (!connected) return;
    await Promise.all([
        FoodFestZone.deleteMany({}),
        FoodFestTier.deleteMany({}),
        FoodFestEvent.deleteMany({})
    ]);
});

const at = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

const makeEvent = (over = {}) => FoodFestEvent.create({
    name: 'Test FoodFest',
    venue: { address: '1 Main Street', city: 'Bengaluru' },
    startTime: at(60),
    endTime: at(180),
    salesStart: at(-60),
    salesEnd: at(30),
    organizer: new mongoose.Types.ObjectId(),
    ...over
});

const makeTier = (eventId, over = {}) => FoodFestTier.create({
    eventId,
    name: 'General Admission',
    price: 500,
    quantity: 10,
    ...over
});

const call = async (handler, { params = {}, body = {} } = {}) => {
    let statusCode = 200;
    let payload;
    const req = { params, body };
    const res = {
        status(code) { statusCode = code; return this; },
        json(value) { payload = value; return this; }
    };
    await handler(req, res);
    return { statusCode, payload };
};

test('the admin event list includes drafts and is newest first', needsDb, async () => {
    const older = await makeEvent({ name: 'Older', status: 'published', startTime: at(60) });
    const newer = await makeEvent({ name: 'Newer', status: 'draft', startTime: at(120) });

    const { statusCode, payload } = await call(listEvents);

    assert.equal(statusCode, 200);
    assert.deepEqual(payload.events.map((event) => event.name), ['Newer', 'Older']);
    assert.ok(payload.events.some((event) => String(event._id) === String(newer._id)));
    assert.ok(payload.events.some((event) => String(event._id) === String(older._id)));
});

test('the admin zone list is scoped to one event', needsDb, async () => {
    const event = await makeEvent();
    const other = await makeEvent({ name: 'Other' });
    await FoodFestZone.create({ eventId: event._id, name: 'Gate A', capacity: 10 });
    await FoodFestZone.create({ eventId: other._id, name: 'Gate B', capacity: 10 });

    const { statusCode, payload } = await call(listZones, { params: { eventId: String(event._id) } });

    assert.equal(statusCode, 200);
    assert.deepEqual(payload.zones.map((zone) => zone.name), ['Gate A']);
});

test('the admin tier list exposes sold and reserved counts', needsDb, async () => {
    const event = await makeEvent();
    await makeTier(event._id, { name: 'VIP', price: 1000, quantity: 5, sold: 2, reserved: 1 });
    await makeTier(event._id, { name: 'GA', price: 500, quantity: 10, sold: 4 });

    const { statusCode, payload } = await call(listTiers, { params: { eventId: String(event._id) } });

    assert.equal(statusCode, 200);
    assert.deepEqual(payload.tiers.map((tier) => tier.name), ['GA', 'VIP']);
    assert.equal(payload.tiers[1].sold, 2);
    assert.equal(payload.tiers[1].reserved, 1);
});

test('zone and tier lists 404 an unknown event', needsDb, async () => {
    const unknown = String(new mongoose.Types.ObjectId());
    assert.equal((await call(listZones, { params: { eventId: unknown } })).statusCode, 404);
    assert.equal((await call(listTiers, { params: { eventId: unknown } })).statusCode, 404);
    assert.equal((await call(listZones, { params: { eventId: 'not-an-id' } })).statusCode, 404);
});

test('zones and tiers cannot be created against an unknown event', needsDb, async () => {
    const unknown = String(new mongoose.Types.ObjectId());
    const zone = await call(createZone, {
        params: { eventId: unknown },
        body: { name: 'Gate A', capacity: 10 }
    });
    const tier = await call(createTier, {
        params: { eventId: unknown },
        body: { name: 'GA', price: 500, quantity: 10 }
    });

    assert.equal(zone.statusCode, 404);
    assert.equal(tier.statusCode, 404);
    assert.equal(await FoodFestZone.countDocuments(), 0);
    assert.equal(await FoodFestTier.countDocuments(), 0);
});

test('zones and tiers can be created for an existing event', needsDb, async () => {
    const event = await makeEvent();

    const zone = await call(createZone, {
        params: { eventId: String(event._id) },
        body: { name: 'Gate A', capacity: 10 }
    });
    const tier = await call(createTier, {
        params: { eventId: String(event._id) },
        body: { name: 'GA', price: 500, quantity: 10 }
    });

    assert.equal(zone.statusCode, 201);
    assert.equal(tier.statusCode, 201);
    assert.equal(await FoodFestZone.countDocuments({ eventId: event._id }), 1);
    assert.equal(await FoodFestTier.countDocuments({ eventId: event._id }), 1);
});

test('a tier cannot shrink below sold + reserved', needsDb, async () => {
    const event = await makeEvent();
    const tier = await makeTier(event._id, { quantity: 10, sold: 4, reserved: 2 });

    const rejected = await call(updateTier, {
        params: { tierId: String(tier._id) },
        body: { quantity: 5 }
    });

    assert.equal(rejected.statusCode, 409);
    assert.equal((await FoodFestTier.findById(tier._id).lean()).quantity, 10);

    const allowed = await call(updateTier, {
        params: { tierId: String(tier._id) },
        body: { quantity: 6 }
    });

    assert.equal(allowed.statusCode, 200);
    assert.equal(allowed.payload.tier.quantity, 6);
});
