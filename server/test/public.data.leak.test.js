/**
 * Public reads must not expose other people's ids, raw comments, or event
 * internals. Regression for the data-leak audit.
 */
import { test, after } from 'node:test';
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
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_public_leak_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[public.data.leak] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const foodController = (await import('../src/controllers/food.controller.js')).default;
const userPostController = (await import('../src/controllers/userPost.controller.js')).default;
const ticketController = await import('../src/controllers/foodfest/ticket.user.controller.js');
const { canJoinEventRoom } = await import('../src/services/foodfest.socket.service.js');

const FoodFestEvent = (await import('../src/models/FoodFestEvent.model.js')).default;
const FoodFestTicket = (await import('../src/models/FoodFestTicket.model.js')).default;
const FoodPartner = (await import('../src/models/foodPartner.Model.js')).default;
const foodModel = (await import('../src/models/food.model.js')).default;
const UserPost = (await import('../src/models/userPost.model.js')).default;
const User = (await import('../src/models/user.Model.js')).default;

const call = async (handler, req = {}) => {
    let statusCode = 200;
    let payload;
    await handler({ query: {}, params: {}, body: {}, ...req }, {
        status(code) { statusCode = code; return this; },
        json(value) { payload = value; return this; }
    });
    return { statusCode, payload };
};

const makeUser = (name) => User.create({
    firstName: name,
    lastName: 'Tester',
    email: `${name}-${new mongoose.Types.ObjectId()}@example.com`,
    password: 'hashed-password'
});

test('public event detail hides organizer notes, revenue stats and GPS', needsDb, async () => {
    const organizer = await makeUser('Host');
    const now = Date.now();
    const event = await FoodFestEvent.create({
        name: 'Street Fest',
        venue: { address: '1 Main St', city: 'Pune', gpsLoc: '18.52,73.86', maxCapacity: 500 },
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
        salesStart: new Date(now - 3600000),
        salesEnd: new Date(now + 1800000),
        organizer: organizer._id,
        organizerType: 'user',
        status: 'published',
        organizerNotes: 'internal only',
        organizerAccessGrantedBy: new mongoose.Types.ObjectId(),
        stats: { totalRevenue: 999999 }
    });

    const { statusCode, payload } = await call(ticketController.getEventDetails, {
        params: { eventId: String(event._id) }
    });

    assert.equal(statusCode, 200);
    assert.equal(payload.event.name, 'Street Fest');
    assert.equal(payload.event.venue.address, '1 Main St');
    assert.equal(payload.event.organizerNotes, undefined);
    assert.equal(payload.event.organizer, undefined);
    assert.equal(payload.event.stats, undefined);
    assert.equal(payload.event.organizerAccessGrantedBy, undefined);
    assert.equal(payload.event.venue.gpsLoc, undefined);
});

test('public food feed hides other users\' likes and raw comments', needsDb, async () => {
    const me = await makeUser('Me');
    const other = await makeUser('Other');
    const partner = await FoodPartner.create({
        companyName: 'Dosa Corner',
        email: `food-${new mongoose.Types.ObjectId()}@example.com`,
        password: 'hashed-password',
        mobile: '9876543210',
        address: '2 Test Street'
    });
    await foodModel.create({
        name: 'Masala Dosa',
        type: 'image',
        postType: 'food',
        price: 120,
        foodPartner: partner._id,
        likes: [me._id, other._id],
        comments: [{ user: other._id, text: 'private comment body' }]
    });

    const { payload } = await call(foodController.getAllFoods, { user: { _id: me._id } });
    const post = payload.data.find((p) => p.name === 'Masala Dosa');
    assert.ok(post);
    assert.equal(post.likes.length, 1, 'only the caller\'s own like survives');
    assert.equal(String(post.likes[0]?._id ?? post.likes[0]), String(me._id));
    assert.equal(post.comments, undefined);
    assert.equal(post.isLiked, true);

    const anonymous = await call(foodController.getAllFoods);
    const anonPost = anonymous.payload.data.find((p) => p.name === 'Masala Dosa');
    assert.equal(anonPost.likes.length, 0);
});

test('public user-post feed strips likes and comments too', needsDb, async () => {
    const me = await makeUser('Viewer');
    const author = await makeUser('Author');
    const other = await makeUser('Stranger');
    await UserPost.create({
        title: 'My dosa',
        type: 'image',
        postedBy: author._id,
        likes: [me._id, other._id],
        comments: [{ user: other._id, text: 'secret' }]
    });

    const { payload } = await call(userPostController.getAllUserPosts, { user: { _id: me._id } });
    const post = payload.data[0];
    assert.equal(post.likes.length, 1);
    assert.equal(String(post.likes[0]?._id ?? post.likes[0]), String(me._id));
    assert.equal(post.comments, undefined);
});

test('socket rooms admit only the organizer, an admin or a ticket holder', needsDb, async () => {
    const organizer = await makeUser('Organizer');
    const holder = await makeUser('Holder');
    const stranger = await makeUser('Stranger');
    const event = await FoodFestEvent.create({
        name: 'Room Fest',
        venue: { address: '3 Main St', city: 'Pune' },
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        salesStart: new Date(Date.now() - 3600000),
        salesEnd: new Date(Date.now() + 1800000),
        organizer: organizer._id,
        organizerType: 'user'
    });
    await FoodFestTicket.create({
        eventId: event._id,
        tierId: new mongoose.Types.ObjectId(),
        user: holder._id,
        status: 'valid',
        priceAtPurchase: 100
    });

    const join = (user) => canJoinEventRoom({ user, eventId: String(event._id) });
    assert.equal(await join({ type: 'user', id: organizer._id }), true);
    assert.equal(await join({ type: 'user', id: holder._id }), true);
    assert.equal(await join({ type: 'user', id: stranger._id }), false);
    assert.equal(await join({ type: 'admin', id: new mongoose.Types.ObjectId() }), true);
    assert.equal(await join({ type: 'partner', id: new mongoose.Types.ObjectId() }), false);
    assert.equal(await canJoinEventRoom({ user: { type: 'user', id: holder._id }, eventId: 'nope' }), false);
});
