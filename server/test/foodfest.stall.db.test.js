/**
 * DB-backed regression: the FoodFest stall display/review system.
 *
 * Locks the product decisions it was built on:
 *  - only approved stalls are listed publicly, with display fields and the
 *    partner's proposed items as the price chart
 *  - upvotes are open to any signed-in user and toggle
 *  - reviews require a paid ticket to the stall's event (valid or used),
 *    one per user, and the stall's stored rating is recalculated from the
 *    review itself
 *  - the shared approve/reject helper enforces a rejection reason, and the
 *    organizer decision endpoint cannot reach another event's application
 *
 * Uses MongoMemoryReplSet like the other DB tests; skips cleanly when the
 * binary cannot start.
 */
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
// decideApplication sends a notification email; without creds it fails fast
// and is caught, but make sure a stray env can never trigger a real send.
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

const mongoose = (await import('mongoose')).default;
mongoose.set('strictQuery', true);

let mongoServer;
let connected = false;
let unavailableReason = 'database not started';

try {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_stall_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[foodfest.stall.db] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const publicCtrl = await import('../src/controllers/foodfest/stall.public.controller.js');
const organizerCtrl = await import('../src/controllers/foodfest/organizer.controller.js');
const stallPartnerCtrl = await import('../src/controllers/foodfest/stall.partner.controller.js');
const { decideApplication } = await import('../src/controllers/foodfest/application.admin.controller.js');
const FoodFestEvent = (await import('../src/models/FoodFestEvent.model.js')).default;
const FoodFestTicket = (await import('../src/models/FoodFestTicket.model.js')).default;
const FoodFestStallApplication = (await import('../src/models/FoodFestStallApplication.model.js')).default;
const FoodFestStallReview = (await import('../src/models/FoodFestStallReview.model.js')).default;
const FoodPartner = (await import('../src/models/foodPartner.Model.js')).default;
const foodModel = (await import('../src/models/food.model.js')).default;
const User = (await import('../src/models/user.Model.js')).default;

if (connected) {
    await Promise.all([
        FoodFestEvent.init(),
        FoodFestTicket.init(),
        FoodFestStallApplication.init(),
        FoodFestStallReview.init(),
        FoodPartner.init(),
        foodModel.init(),
        User.init()
    ]);
}

const base = Date.now();
const at = (minutes) => new Date(base + minutes * 60 * 1000);

const userId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();

let partnerId;
let eventId;
let stallId;

// One application per partner per event (unique index), so extra stalls
// need their own partner.
const makePartner = () => FoodPartner.create({
    companyName: 'Chai Point',
    email: `stall-${new mongoose.Types.ObjectId()}@example.com`,
    password: 'hashed-password',
    mobile: '9876543210',
    address: '2 Test Street'
});

const call = async (handler, { user, foodPartner, params = {}, body = {}, query = {} } = {}) => {
    let statusCode = 200;
    let payload;
    const res = {
        status(code) { statusCode = code; return this; },
        json(value) { payload = value; return this; }
    };
    await handler({ user, foodPartner, params, body, query }, res);
    return { statusCode, payload };
};

const makeEvent = (over = {}) => FoodFestEvent.create({
    name: 'Stall Fest',
    venue: {
        address: '1 Main Street',
        city: 'Bengaluru',
        gpsLoc: '12.9716,77.5946',
        maxCapacity: 500
    },
    startTime: at(60),
    endTime: at(180),
    salesStart: at(-60),
    salesEnd: at(30),
    organizer: userId,
    organizerType: 'user',
    organizerAccess: true,
    ...over
});

const makeStall = (over = {}) => FoodFestStallApplication.create({
    eventId,
    foodPartner: partnerId,
    proposedItems: [],
    status: 'approved',
    ...over
});

const makeTicket = (user, over = {}) => FoodFestTicket.create({
    eventId,
    tierId: new mongoose.Types.ObjectId(),
    user,
    status: 'valid',
    priceAtPurchase: 500,
    ...over
});

beforeEach(async () => {
    if (!connected) return;
    await Promise.all([
        FoodFestStallReview.deleteMany({}),
        FoodFestStallApplication.deleteMany({}),
        FoodFestTicket.deleteMany({}),
        FoodFestEvent.deleteMany({}),
        FoodPartner.deleteMany({}),
        foodModel.deleteMany({}),
        User.deleteMany({})
    ]);

    partnerId = (await makePartner())._id;

    // The reviewer the review endpoint populates.
    await User.create({
        _id: userId,
        firstName: 'Asha',
        lastName: 'Rao',
        email: `buyer-${userId}@example.com`,
        password: 'not-used-in-tests'
    });

    const event = await makeEvent({ status: 'published' });
    eventId = event._id;
    stallId = new mongoose.Types.ObjectId();
});

test('only approved stalls are listed, with display fields and the item price chart', needsDb, async () => {
    const item = await foodModel.create({
        name: 'Masala Dosa',
        description: 'Crisp dosa',
        type: 'image',
        postType: 'food',
        price: 120,
        foodPartner: partnerId
    });
    await makeStall({
        _id: stallId,
        position: 'Gate 2, first row',
        timings: '10:00 - 22:00',
        conditions: 'Jain options available',
        image: 'https://ik.imagekit.io/stall.jpg',
        proposedItems: [item._id]
    });
    await makeStall({ foodPartner: (await makePartner())._id, status: 'pending' });
    await makeStall({ foodPartner: (await makePartner())._id, status: 'rejected' });

    const { statusCode, payload } = await call(publicCtrl.listEventStalls, {
        params: { eventId: String(eventId) },
        user: { _id: userId }
    });

    assert.equal(statusCode, 200);
    assert.equal(payload.stalls.length, 1);
    const stall = payload.stalls[0];
    assert.equal(String(stall._id), String(stallId));
    assert.equal(stall.owner.name, 'Chai Point');
    assert.equal(stall.position, 'Gate 2, first row');
    assert.equal(stall.timings, '10:00 - 22:00');
    assert.equal(stall.conditions, 'Jain options available');
    assert.equal(stall.image, 'https://ik.imagekit.io/stall.jpg');
    assert.equal(stall.upvoteCount, 0);
    assert.equal(stall.upvoted, false);
    assert.deepEqual(
        stall.items.map(({ name, price }) => ({ name, price })),
        [{ name: 'Masala Dosa', price: 120 }]
    );
});

test('upvotes toggle for any signed-in user', needsDb, async () => {
    await makeStall({ _id: stallId });
    const user = { _id: userId };
    const params = { stallId: String(stallId) };

    let res = await call(publicCtrl.toggleUpvote, { user, params });
    assert.equal(res.statusCode, 200);
    assert.deepEqual({ upvoted: res.payload.upvoted, count: res.payload.upvoteCount }, { upvoted: true, count: 1 });

    res = await call(publicCtrl.toggleUpvote, { user, params });
    assert.deepEqual({ upvoted: res.payload.upvoted, count: res.payload.upvoteCount }, { upvoted: false, count: 0 });

    // A second user's upvote is independent of the first.
    res = await call(publicCtrl.toggleUpvote, { user: { _id: otherUserId }, params });
    assert.deepEqual({ upvoted: res.payload.upvoted, count: res.payload.upvoteCount }, { upvoted: true, count: 1 });
});

test('reviews are refused without a ticket to the event', needsDb, async () => {
    await makeStall({ _id: stallId });

    const { statusCode, payload } = await call(publicCtrl.createStallReview, {
        user: { _id: userId },
        params: { stallId: String(stallId) },
        body: { rating: 5, comment: 'Great stall' }
    });

    assert.equal(statusCode, 403);
    assert.match(payload.message, /ticket holders/i);
    assert.equal(await FoodFestStallReview.countDocuments(), 0);
});

test('a ticket holder reviews once and the stall rating is recalculated', needsDb, async () => {
    await makeStall({ _id: stallId });
    await makeTicket(userId);
    const user = { _id: userId };
    const params = { stallId: String(stallId) };

    let res = await call(publicCtrl.createStallReview, {
        user, params, body: { rating: 4, comment: 'Good' }
    });
    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.review.rating, 4);
    assert.equal(res.payload.review.user.firstName, 'Asha');

    // One review per user per stall.
    res = await call(publicCtrl.createStallReview, {
        user, params, body: { rating: 1, comment: 'Changed my mind' }
    });
    assert.equal(res.statusCode, 400);

    // A second holder's rating moves the aggregate stored on the stall.
    const second = await User.create({
        firstName: 'Balu',
        lastName: 'Nair',
        email: `second-${new mongoose.Types.ObjectId()}@example.com`,
        password: 'not-used-in-tests'
    });
    await makeTicket(second._id);
    res = await call(publicCtrl.createStallReview, {
        user: { _id: second._id }, params, body: { rating: 2, comment: 'Meh' }
    });
    assert.equal(res.statusCode, 201);

    const stall = await FoodFestStallApplication.findById(stallId);
    assert.equal(stall.ratingCount, 2);
    assert.equal(stall.rating, 3); // (4 + 2) / 2
});

test('a scanned (used) ticket also counts as attendance', needsDb, async () => {
    await makeStall({ _id: stallId });
    await makeTicket(userId, { status: 'used' });

    const { statusCode } = await call(publicCtrl.createStallReview, {
        user: { _id: userId },
        params: { stallId: String(stallId) },
        body: { rating: 5, comment: 'Loved it' }
    });

    assert.equal(statusCode, 201);
});

test('the shared decision helper requires a rejection reason', needsDb, async () => {
    const stall = await makeStall({ _id: stallId, status: 'pending' });

    let result = await decideApplication({ appId: stall._id, decision: 'rejected', actorId: userId });
    assert.equal(result.status, 400);

    result = await decideApplication({
        appId: stall._id, decision: 'rejected', actorId: userId, reason: 'Menu incomplete'
    });
    assert.equal(result.status, 200);
    assert.equal(result.application.status, 'rejected');
    assert.equal(result.application.rejectionReason, 'Menu incomplete');
    assert.ok(result.application.reviewedAt);
});

test('organizer decisions are scoped to their own event', needsDb, async () => {
    await makeStall({ _id: stallId, status: 'pending' });
    const otherEvent = await makeEvent({ name: 'Foreign fest' });
    const foreignStall = await makeStall({ eventId: otherEvent._id, status: 'pending' });
    const params = { eventId: String(eventId), appId: String(foreignStall._id) };

    // Application belongs to a different event -> invisible to this organizer.
    let res = await call(organizerCtrl.decideMyStall, {
        user: { _id: userId }, params, body: { decision: 'approved' }
    });
    assert.equal(res.statusCode, 404);

    // Unknown decision value is a 400, not a silent pass-through.
    res = await call(organizerCtrl.decideMyStall, {
        user: { _id: userId },
        params: { eventId: String(eventId), appId: String(stallId) },
        body: { decision: 'maybe' }
    });
    assert.equal(res.statusCode, 400);

    // The legitimate path works.
    res = await call(organizerCtrl.decideMyStall, {
        user: { _id: userId },
        params: { eventId: String(eventId), appId: String(stallId) },
        body: { decision: 'approved' }
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.application.status, 'approved');
});

test('oversized display fields are a 400, not a Mongoose ValidationError 500', needsDb, async () => {
    const item = await foodModel.create({
        name: 'Masala Dosa',
        description: 'Crisp dosa',
        type: 'image',
        postType: 'food',
        price: 120,
        foodPartner: partnerId
    });

    const { statusCode } = await call(stallPartnerCtrl.applyForStall, {
        foodPartner: { _id: partnerId },
        params: { eventId: String(eventId) },
        body: { proposedItems: [String(item._id)], position: 'x'.repeat(121) }
    });

    assert.equal(statusCode, 400);
    assert.equal(await FoodFestStallApplication.countDocuments(), 0);
});
