/**
 * DB-backed regression: organizer powers for user-hosted FoodFest events.
 *
 * Covers the promise made at approval time:
 *  - an approved proposal's owner can manage the whole event
 *  - foreign events are invisible, revoked access is refused
 *  - ticket tiers and venue zones are fully manageable by the organizer
 *  - attendees and revenue are scoped to the organizer's event
 *  - lifecycle actions follow draft -> published -> live -> completed
 *  - an admin can revoke and restore access without touching the event
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
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_organizer_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[foodfest.organizer.db] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const organizer = await import('../src/controllers/foodfest/organizer.controller.js');
const { setOrganizerAccess } = await import('../src/controllers/foodfest/event.admin.controller.js');
const FoodFestEvent = (await import('../src/models/FoodFestEvent.model.js')).default;
const FoodFestTier = (await import('../src/models/FoodFestTier.model.js')).default;
const FoodFestZone = (await import('../src/models/FoodFestZone.model.js')).default;
const FoodFestTicket = (await import('../src/models/FoodFestTicket.model.js')).default;
const FoodFestCheckIn = (await import('../src/models/FoodFestCheckIn.model.js')).default;
const User = (await import('../src/models/user.Model.js')).default;

if (connected) {
    await Promise.all([
        FoodFestEvent.init(),
        FoodFestTier.init(),
        FoodFestZone.init(),
        FoodFestTicket.init(),
        FoodFestCheckIn.init(),
        User.init()
    ]);
}

const base = Date.now();
const at = (minutes) => new Date(base + minutes * 60 * 1000);

const userId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();

let buyerId;

const makeEvent = (over = {}) => FoodFestEvent.create({
    name: 'Test FoodFest',
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

const makeTier = (eventId, over = {}) => FoodFestTier.create({
    eventId,
    name: 'General Admission',
    price: 500,
    quantity: 10,
    ...over
});

const makeZone = (eventId, over = {}) => FoodFestZone.create({
    eventId,
    name: 'Main lawn',
    capacity: 100,
    ...over
});

const makeTicket = (eventId, tierId, over = {}) => FoodFestTicket.create({
    eventId,
    tierId,
    user: buyerId,
    status: 'valid',
    priceAtPurchase: 500,
    ...over
});

const call = async (handler, {
    user = { _id: userId },
    admin = { _id: adminId },
    params = {},
    body = {},
    query = {}
} = {}) => {
    let statusCode = 200;
    let payload;
    const res = {
        status(code) { statusCode = code; return this; },
        json(value) { payload = value; return this; }
    };
    await handler({ user, admin, params, body, query }, res);
    return { statusCode, payload };
};

beforeEach(async () => {
    if (!connected) return;
    await Promise.all([
        FoodFestCheckIn.deleteMany({}),
        FoodFestTicket.deleteMany({}),
        FoodFestZone.deleteMany({}),
        FoodFestTier.deleteMany({}),
        FoodFestEvent.deleteMany({}),
        User.deleteMany({})
    ]);

    const buyer = await User.create({
        firstName: 'Asha',
        lastName: 'Rao',
        email: `buyer-${new mongoose.Types.ObjectId()}@example.com`,
        password: 'not-used-in-tests'
    });
    buyerId = buyer._id;
});

test('listMyEvents returns only the user\'s own user-hosted events', needsDb, async () => {
    const own = await makeEvent({ name: 'Own draft' });
    await makeEvent({ name: 'Other user', organizer: otherUserId });
    await makeEvent({ name: 'Admin event', organizer: userId, organizerType: 'admin' });

    const { statusCode, payload } = await call(organizer.listMyEvents);

    assert.equal(statusCode, 200);
    assert.deepEqual(payload.events.map((event) => event.name), ['Own draft']);
    assert.equal(String(payload.events[0]._id), String(own._id));
});

test('foreign events are 404 and revoked access is 403', needsDb, async () => {
    const foreign = await makeEvent({ name: 'Foreign', organizer: otherUserId });
    const revoked = await makeEvent({ name: 'Revoked', organizerAccess: false });
    const adminHosted = await makeEvent({
        name: 'Admin hosted',
        organizer: userId,
        organizerType: 'admin'
    });

    assert.equal(
        (await call(organizer.getMyEvent, { params: { eventId: String(foreign._id) } })).statusCode,
        404
    );
    assert.equal(
        (await call(organizer.getMyEvent, { params: { eventId: String(revoked._id) } })).statusCode,
        403
    );
    assert.equal(
        (await call(organizer.getMyEvent, { params: { eventId: String(adminHosted._id) } })).statusCode,
        404
    );
    assert.equal(
        (await call(organizer.getMyEvent, { params: { eventId: 'not-an-id' } })).statusCode,
        404
    );

    const foreignTier = await makeTier(foreign._id);
    const foreignZone = await makeZone(foreign._id);

    assert.equal(
        (await call(organizer.updateMyTier, {
            params: { tierId: String(foreignTier._id) },
            body: { price: 1 }
        })).statusCode,
        404
    );
    assert.equal(
        (await call(organizer.updateMyZone, {
            params: { zoneId: String(foreignZone._id) },
            body: { capacity: 1 }
        })).statusCode,
        404
    );
});

test('an organizer can edit a draft event and venue fields merge', needsDb, async () => {
    const event = await makeEvent();

    const res = await call(organizer.updateMyEvent, {
        params: { eventId: String(event._id) },
        body: { name: 'Renamed festival', venue: { city: 'Mumbai' } }
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.event.name, 'Renamed festival');
    assert.equal(res.payload.event.venue.address, '1 Main Street');
    assert.equal(res.payload.event.venue.city, 'Mumbai');
    assert.equal(res.payload.event.venue.maxCapacity, 500);
});

test('event edits are blocked once live and invalid windows are rejected', needsDb, async () => {
    const live = await makeEvent({ name: 'Already live', status: 'live' });

    const liveRes = await call(organizer.updateMyEvent, {
        params: { eventId: String(live._id) },
        body: { name: 'Nope' }
    });

    assert.equal(liveRes.statusCode, 409);
    assert.equal((await FoodFestEvent.findById(live._id)).name, 'Already live');

    const draft = await makeEvent({ name: 'Draft event' });
    const bad = await call(organizer.updateMyEvent, {
        params: { eventId: String(draft._id) },
        body: { startTime: at(180), endTime: at(60) }
    });

    assert.equal(bad.statusCode, 400);
    assert.match(bad.payload.message, /startTime must be before endTime/);
});

test('an organizer can create, edit, pause and delete ticket tiers', needsDb, async () => {
    const event = await makeEvent();

    const created = await call(organizer.createMyTier, {
        params: { eventId: String(event._id) },
        body: { name: 'General admission', price: 499, quantity: 100 }
    });

    assert.equal(created.statusCode, 201);
    assert.equal(created.payload.tier.name, 'General admission');
    assert.equal(created.payload.tier.quantity, 100);

    const missing = await call(organizer.createMyTier, {
        params: { eventId: String(event._id) },
        body: { name: 'Incomplete' }
    });
    assert.equal(missing.statusCode, 400);

    const paused = await call(organizer.updateMyTier, {
        params: { tierId: String(created.payload.tier._id) },
        body: { active: false, price: 599 }
    });
    assert.equal(paused.statusCode, 200);
    assert.equal(paused.payload.tier.active, false);
    assert.equal(paused.payload.tier.price, 599);

    const deleted = await call(organizer.deleteMyTier, {
        params: { tierId: String(created.payload.tier._id) }
    });
    assert.equal(deleted.statusCode, 200);
    assert.equal(await FoodFestTier.countDocuments(), 0);
});

test('a tier cannot shrink below sold + reserved and cannot be deleted after sales', needsDb, async () => {
    const event = await makeEvent();
    const tier = await makeTier(event._id, { quantity: 10, sold: 4, reserved: 2 });

    const rejected = await call(organizer.updateMyTier, {
        params: { tierId: String(tier._id) },
        body: { quantity: 5 }
    });
    assert.equal(rejected.statusCode, 409);
    assert.equal((await FoodFestTier.findById(tier._id)).quantity, 10);

    const allowed = await call(organizer.updateMyTier, {
        params: { tierId: String(tier._id) },
        body: { quantity: 6 }
    });
    assert.equal(allowed.statusCode, 200);
    assert.equal(allowed.payload.tier.quantity, 6);

    await makeTicket(event._id, tier._id, { status: 'valid' });

    const blocked = await call(organizer.deleteMyTier, {
        params: { tierId: String(tier._id) }
    });
    assert.equal(blocked.statusCode, 409);
    assert.equal(await FoodFestTier.countDocuments({ _id: tier._id }), 1);
});

test('an organizer can manage zones but cannot delete one with check-ins', needsDb, async () => {
    const event = await makeEvent();

    const created = await call(organizer.createMyZone, {
        params: { eventId: String(event._id) },
        body: {
            name: 'Main lawn',
            capacity: 300,
            warningThreshold: 75,
            criticalThreshold: 90
        }
    });
    assert.equal(created.statusCode, 201);
    assert.equal(created.payload.zone.capacity, 300);

    const updated = await call(organizer.updateMyZone, {
        params: { zoneId: String(created.payload.zone._id) },
        body: { capacity: 350, tracksExit: true }
    });
    assert.equal(updated.statusCode, 200);
    assert.equal(updated.payload.zone.capacity, 350);
    assert.equal(updated.payload.zone.tracksExit, true);

    const tier = await makeTier(event._id);
    const ticket = await makeTicket(event._id, tier._id, { status: 'used' });

    await FoodFestCheckIn.create({
        ticketId: ticket._id,
        zoneId: created.payload.zone._id,
        eventId: event._id,
        gateStaffId: adminId,
        gateStaffModel: 'Admin',
        action: 'admit'
    });

    const blocked = await call(organizer.deleteMyZone, {
        params: { zoneId: String(created.payload.zone._id) }
    });
    assert.equal(blocked.statusCode, 409);
    assert.equal(await FoodFestZone.countDocuments({ _id: created.payload.zone._id }), 1);

    await FoodFestCheckIn.deleteMany({});
    const deleted = await call(organizer.deleteMyZone, {
        params: { zoneId: String(created.payload.zone._id) }
    });
    assert.equal(deleted.statusCode, 200);
    assert.equal(await FoodFestZone.countDocuments({ _id: created.payload.zone._id }), 0);
});

test('attendee list is scoped to the event and summary counts only paid tickets', needsDb, async () => {
    const event = await makeEvent();
    const other = await makeEvent({ name: 'Other event' });
    const tier = await makeTier(event._id, { quantity: 100, sold: 4, reserved: 1 });
    const otherTier = await makeTier(other._id, { name: 'Other tier' });

    await makeTicket(event._id, tier._id, { status: 'valid', priceAtPurchase: 500 });
    await makeTicket(event._id, tier._id, { status: 'used', priceAtPurchase: 700 });
    await makeTicket(event._id, tier._id, { status: 'pending_payment', priceAtPurchase: 500 });
    await makeTicket(event._id, tier._id, { status: 'refunded', priceAtPurchase: 500 });
    await makeTicket(other._id, otherTier._id, { status: 'valid', priceAtPurchase: 999 });

    const list = await call(organizer.listMyEventTickets, {
        params: { eventId: String(event._id) }
    });

    assert.equal(list.statusCode, 200);
    assert.equal(list.payload.tickets.length, 4);
    assert.ok(list.payload.tickets.every(
        (ticket) => String(ticket.eventId) === String(event._id)
    ));
    assert.ok(list.payload.tickets.every((ticket) => ticket.tierId?.name === tier.name));
    assert.ok(list.payload.tickets.every((ticket) => ticket.user?.firstName === 'Asha'));

    const filtered = await call(organizer.listMyEventTickets, {
        params: { eventId: String(event._id) },
        query: { status: 'valid' }
    });
    assert.equal(filtered.statusCode, 200);
    assert.equal(filtered.payload.tickets.length, 1);

    const summary = await call(organizer.getMyEventSummary, {
        params: { eventId: String(event._id) }
    });

    assert.equal(summary.statusCode, 200);
    assert.equal(summary.payload.summary.revenue, 1200);
    assert.equal(summary.payload.summary.sold, 4);
    assert.equal(summary.payload.summary.reserved, 1);
    assert.equal(summary.payload.summary.capacity, 100);
    assert.equal(summary.payload.summary.checkedIn, 1);
    assert.equal(summary.payload.summary.byStatus.valid, 1);
    assert.equal(summary.payload.summary.byStatus.used, 1);
    assert.equal(summary.payload.summary.byStatus.pending_payment, 1);
    assert.equal(summary.payload.summary.byStatus.refunded, 1);
});

test('publishing requires a tier and warns when tiers exceed zone capacity', needsDb, async () => {
    const event = await makeEvent();

    const noTier = await call(organizer.publishMyEvent, {
        params: { eventId: String(event._id) }
    });
    assert.equal(noTier.statusCode, 400);

    await makeTier(event._id, { quantity: 100 });

    const published = await call(organizer.publishMyEvent, {
        params: { eventId: String(event._id) }
    });
    assert.equal(published.statusCode, 200);
    assert.equal(published.payload.event.status, 'published');
    assert.deepEqual(published.payload.warnings, []);

    const second = await makeEvent({ name: 'Second draft' });
    await makeTier(second._id, { quantity: 100 });
    await makeZone(second._id, { capacity: 40 });

    const warned = await call(organizer.publishMyEvent, {
        params: { eventId: String(second._id) }
    });
    assert.equal(warned.statusCode, 200);
    assert.equal(warned.payload.warnings.length, 1);
    assert.match(warned.payload.warnings[0], /exceeds venue capacity/);
});

test('lifecycle transitions follow draft -> published -> live -> completed', needsDb, async () => {
    const upcoming = await makeEvent({ name: 'Upcoming' });
    await makeTier(upcoming._id, { quantity: 10 });
    await call(organizer.publishMyEvent, {
        params: { eventId: String(upcoming._id) }
    });

    const early = await call(organizer.goLiveMyEvent, {
        params: { eventId: String(upcoming._id) }
    });
    assert.equal(early.statusCode, 400);
    assert.match(early.payload.message, /outside event date range/);

    const running = await makeEvent({
        name: 'Running now',
        startTime: at(-10),
        endTime: at(180)
    });
    await makeTier(running._id, { quantity: 10 });
    await call(organizer.publishMyEvent, {
        params: { eventId: String(running._id) }
    });

    const live = await call(organizer.goLiveMyEvent, {
        params: { eventId: String(running._id) }
    });
    assert.equal(live.statusCode, 200);
    assert.equal(live.payload.event.status, 'live');

    const completed = await call(organizer.completeMyEvent, {
        params: { eventId: String(running._id) }
    });
    assert.equal(completed.statusCode, 200);
    assert.equal(completed.payload.event.status, 'completed');

    const again = await call(organizer.publishMyEvent, {
        params: { eventId: String(running._id) }
    });
    assert.equal(again.statusCode, 400);
});

test('revoked organizer access blocks management but leaves the event intact', needsDb, async () => {
    const event = await makeEvent({ status: 'draft' });
    await FoodFestEvent.findByIdAndUpdate(
        event._id,
        { $set: { organizerAccess: false } }
    );

    const publish = await call(organizer.publishMyEvent, {
        params: { eventId: String(event._id) }
    });
    assert.equal(publish.statusCode, 403);

    const tier = await call(organizer.createMyTier, {
        params: { eventId: String(event._id) },
        body: { name: 'GA', price: 100, quantity: 10 }
    });
    assert.equal(tier.statusCode, 403);

    const stored = await FoodFestEvent.findById(event._id);
    assert.equal(stored.status, 'draft');
    assert.equal(stored.organizerAccess, false);
    assert.equal(await FoodFestTier.countDocuments({ eventId: event._id }), 0);
});

test('an admin can revoke and restore access without touching the event', needsDb, async () => {
    const event = await makeEvent();
    const before = await FoodFestEvent.findById(event._id);

    const revoke = await call(setOrganizerAccess, {
        params: { eventId: String(event._id) },
        body: { granted: false }
    });

    assert.equal(revoke.statusCode, 200);
    assert.equal(revoke.payload.event.organizerAccess, false);
    assert.equal(revoke.payload.event.name, before.name);
    assert.equal(String(revoke.payload.event.organizer), String(userId));
    assert.equal(revoke.payload.event.status, 'draft');

    const blocked = await call(organizer.getMyEvent, {
        params: { eventId: String(event._id) }
    });
    assert.equal(blocked.statusCode, 403);

    const restore = await call(setOrganizerAccess, {
        params: { eventId: String(event._id) },
        body: { granted: true }
    });

    assert.equal(restore.statusCode, 200);
    assert.equal(restore.payload.event.organizerAccess, true);
    assert.equal(
        restore.payload.event.organizerAccessGrantedBy.toString(),
        adminId.toString()
    );
    assert.ok(restore.payload.event.organizerAccessGrantedAt instanceof Date);

    const allowed = await call(organizer.getMyEvent, {
        params: { eventId: String(event._id) }
    });
    assert.equal(allowed.statusCode, 200);
});

test('admin access changes validate the event and input', needsDb, async () => {
    const adminHosted = await makeEvent({
        name: 'Admin hosted',
        organizer: adminId,
        organizerType: 'admin'
    });
    const userHosted = await makeEvent({ name: 'User hosted' });

    assert.equal(
        (await call(setOrganizerAccess, {
            params: { eventId: String(adminHosted._id) },
            body: { granted: true }
        })).statusCode,
        400
    );
    assert.equal(
        (await call(setOrganizerAccess, {
            params: { eventId: String(userHosted._id) },
            body: {}
        })).statusCode,
        400
    );
    assert.equal(
        (await call(setOrganizerAccess, {
            params: { eventId: 'not-an-id' },
            body: { granted: true }
        })).statusCode,
        404
    );
    assert.equal(
        (await call(setOrganizerAccess, {
            params: { eventId: String(new mongoose.Types.ObjectId()) },
            body: { granted: true }
        })).statusCode,
        404
    );
});
