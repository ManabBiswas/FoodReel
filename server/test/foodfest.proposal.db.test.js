/**
 * DB-backed regression: user event proposals.
 *
 * Covers the full hand-off:
 *  - a regular user submits a proposal (stored as pending, never as an event)
 *  - only an admin can list pending proposals
 *  - approval atomically creates one draft event owned by the user and grants
 *    organizer access, recording the approving admin
 *  - a second approval cannot create a duplicate event
 *  - rejection never creates an event and records the reviewing admin
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
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_proposal_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[foodfest.proposal.db] skipping: ${unavailableReason}`);
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
    createUserProposal,
    getPendingProposals,
    approveProposal,
    rejectProposal
} = await import('../src/controllers/foodfest/proposal.controller.js');
const EventProposal = (await import('../src/models/EventProposal.model.js')).default;
const FoodFestEvent = (await import('../src/models/FoodFestEvent.model.js')).default;

if (connected) {
    await Promise.all([EventProposal.init(), FoodFestEvent.init()]);
}

const base = Date.now();
const at = (minutes) => new Date(base + minutes * 60 * 1000);

const userId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();

const validProposal = (over = {}) => ({
    name: 'Test Street Food Festival',
    description: 'A one-day food festival',
    venue: {
        address: '1 Main Street',
        city: 'Bengaluru',
        gpsLoc: '12.9716,77.5946',
        maxCapacity: 800
    },
    startTime: at(60),
    endTime: at(180),
    salesStart: at(-60),
    salesEnd: at(30),
    otherInfo: 'Expecting 500 visitors and 20 stalls',
    ...over
});

const call = (handler, req) => new Promise((resolve) => {
    const res = {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            resolve(this);
            return this;
        }
    };
    handler({
        user: { _id: userId },
        admin: { _id: adminId },
        params: {},
        body: {},
        ...req
    }, res);
});

beforeEach(async () => {
    if (!connected) return;
    await Promise.all([
        EventProposal.deleteMany({}),
        FoodFestEvent.deleteMany({})
    ]);
});

test('user can submit a proposal without creating an event', needsDb, async () => {
    const res = await call(createUserProposal, { body: validProposal() });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);

    const stored = await EventProposal.findById(res.body.proposal._id);
    assert.ok(stored);
    assert.equal(stored.status, 'pending');
    assert.equal(stored.user.toString(), userId.toString());
    assert.equal(await FoodFestEvent.countDocuments(), 0);
});

test('proposal rejects an invalid date window', needsDb, async () => {
    const res = await call(createUserProposal, {
        body: validProposal({ startTime: at(180), endTime: at(60) })
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /startTime must be before endTime/);
    assert.equal(await EventProposal.countDocuments(), 0);
});

test('proposal requires a GPS location', needsDb, async () => {
    const res = await call(createUserProposal, {
        body: validProposal({ venue: { address: '1 Main Street', city: 'Bengaluru' } })
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /gpsLoc/);
    assert.equal(await EventProposal.countDocuments(), 0);
});

test('approving creates exactly one draft event owned by the user', needsDb, async () => {
    const created = await call(createUserProposal, { body: validProposal() });
    const proposalId = created.body.proposal._id;

    const res = await call(approveProposal, { params: { proposalId } });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.event.status, 'draft');
    assert.equal(res.body.event.organizerType, 'user');
    assert.equal(res.body.event.organizer.toString(), userId.toString());
    assert.equal(res.body.event.venue.gpsLoc, '12.9716,77.5946');
    assert.equal(res.body.event.venue.maxCapacity, 800);
    assert.equal(res.body.event.organizerNotes, 'Expecting 500 visitors and 20 stalls');
    assert.equal(res.body.event.organizerAccess, true);
    assert.equal(res.body.event.organizerAccessGrantedBy.toString(), adminId.toString());
    assert.ok(res.body.event.organizerAccessGrantedAt instanceof Date);
    assert.equal(await FoodFestEvent.countDocuments(), 1);

    const stored = await EventProposal.findById(proposalId);
    assert.equal(stored.status, 'approved');
    assert.equal(stored.eventId.toString(), res.body.event._id.toString());
    assert.equal(stored.reviewedBy.toString(), adminId.toString());
    assert.ok(stored.reviewedAt instanceof Date);
});

test('a second approval cannot create a duplicate event', needsDb, async () => {
    const created = await call(createUserProposal, { body: validProposal() });
    const proposalId = created.body.proposal._id;

    await call(approveProposal, { params: { proposalId } });
    const second = await call(approveProposal, { params: { proposalId } });

    assert.equal(second.statusCode, 409);
    assert.equal(await FoodFestEvent.countDocuments(), 1);
});

test('rejecting never creates an event', needsDb, async () => {
    const created = await call(createUserProposal, { body: validProposal() });
    const proposalId = created.body.proposal._id;

    const res = await call(rejectProposal, { params: { proposalId } });

    assert.equal(res.statusCode, 200);
    const stored = await EventProposal.findById(proposalId);
    assert.equal(stored.status, 'rejected');
    assert.equal(stored.reviewedBy.toString(), adminId.toString());
    assert.ok(stored.reviewedAt instanceof Date);
    assert.equal(await FoodFestEvent.countDocuments(), 0);
});

test('admin pending list excludes processed proposals', needsDb, async () => {
    const first = await call(createUserProposal, { body: validProposal({ name: 'First' }) });
    await call(createUserProposal, { body: validProposal({ name: 'Second' }) });
    await call(rejectProposal, { params: { proposalId: first.body.proposal._id } });

    const res = await call(getPendingProposals, {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.proposals.length, 1);
    assert.equal(res.body.proposals[0].name, 'Second');
});

test('malformed proposal ids are treated as not found', needsDb, async () => {
    const res = await call(approveProposal, { params: { proposalId: 'not-an-id' } });

    assert.equal(res.statusCode, 404);
    assert.equal(await FoodFestEvent.countDocuments(), 0);
});
