/**
 * Concurrency proof for the FoodFest ticket sweeper.
 *
 * The sweeper releases the tier reservation (`reserved: -1`) when a ticket ages
 * out of pending_payment. The original implementation was, in essence:
 *
 *     findByIdAndUpdate(ticket._id, { status: 'expired' })
 *     findByIdAndUpdate(ticket.tierId, { $inc: { reserved: -1 } })
 *
 * The write filtered on `_id` alone. There was no precondition on the ticket's
 * current status, so an overlapping sweep — and `startTicketSweeper` had no
 * re-entrancy guard — re-matched a ticket that was already expired and ran the
 * decrement a second time. The floor was also unconditional, so `reserved` had
 * nothing stopping it at zero.
 *
 * That matters because inventory is checked with `sold + reserved < quantity`.
 * A negative `reserved` undercounts and oversells. FoodFestTier's schema does
 * declare `reserved: { min: 0 }`, but update operators bypass validation, so the
 * `$inc` writes a negative value straight through.
 *
 * Verified non-vacuous: restoring both original defects makes these assertions
 * report `reserved = -6` and `-4` and the script exits 1.
 *
 * Kept out of `test/` on purpose: CI has no MongoDB (the MONGODB_URL in ci.yml
 * only lets the module graph load), so `npm test` must stay DB-free.
 *
 * Usage: npm run test:sweeper
 */
import mongoose from 'mongoose';
import 'dotenv/config';
import FoodFestEvent from '../src/models/FoodFestEvent.model.js';
import FoodFestTier from '../src/models/FoodFestTier.model.js';
import FoodFestTicket from '../src/models/FoodFestTicket.model.js';
import { sweepOnce } from '../src/services/foodfest.sweeper.js';

const base = process.env.MONGODB_URL || 'mongodb://localhost:27017/FoodReel';
const testUrl = base.replace(/\/([^/?]+)(\?|$)/, '/FoodReel_sweeptest$2');

const failures = [];
const check = (label, actual, expected) => {
    const ok = Object.is(actual, expected);
    if (!ok) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(46)} ${JSON.stringify(actual)}`);
};

// The sweeper reports "already at reserved=0" through console.warn. Capture it
// so each case can assert on its own count instead of trusting stderr, which
// does not interleave reliably with stdout when piped.
const warns = [];
console.warn = (...args) => warns.push(args.join(' '));
const warnsDuring = async (fn) => {
    const before = warns.length;
    await fn();
    return warns.length - before;
};

const AGED = new Date(Date.now() - 20 * 60 * 1000); // older than the 15m threshold
const FRESH = new Date();

const reset = async () => {
    await FoodFestTicket.deleteMany({});
    await FoodFestTier.deleteMany({});
    await FoodFestEvent.deleteMany({});
};

/** Seed an isolated tier with `ticketCount` tickets at an explicit `reserved`. */
const seedN = async ({ reserved, ticketCount, status = 'pending_payment', createdAt = AGED }) => {
    await reset();
    const event = await FoodFestEvent.create({
        name: 'Sweeper Proof',
        description: 'throwaway',
        venue: { address: '1 test st', city: 'Testville' },
        startTime: new Date(),
        endTime: new Date(Date.now() + 86_400_000),
        salesStart: new Date(Date.now() - 86_400_000),
        salesEnd: new Date(Date.now() + 86_400_000),
        organizer: new mongoose.Types.ObjectId(),
    });
    const tier = await FoodFestTier.create({
        eventId: event._id, name: 'Tier A', price: 100, quantity: 100, sold: 0, reserved,
    });
    const ids = [];
    for (let i = 0; i < ticketCount; i++) {
        // Raw insert: mongoose timestamps overwrite an explicit createdAt, and
        // the sweeper keys off createdAt.
        const res = await FoodFestTicket.collection.insertOne({
            eventId: event._id, tierId: tier._id, user: new mongoose.Types.ObjectId(),
            status, priceAtPurchase: 100, createdAt, updatedAt: createdAt,
        });
        ids.push(res.insertedId);
    }
    return { tier, ids };
};

const reservedOf = async (tierId) => (await FoodFestTier.findById(tierId).lean()).reserved;
const statusesOf = async (ids) =>
    (await FoodFestTicket.find({ _id: { $in: ids } }).select('status').lean()).map((t) => t.status);

const run = async () => {
    await mongoose.connect(testUrl, { serverSelectionTimeoutMS: 8000 });
    console.log(`isolated test db: ${mongoose.connection.name}\n`);

    // 1. Five overlapping sweeps over two stale tickets. Two releases are the
    //    only correct outcome, and neither may ever touch the floor: if a third
    //    sweep got a claim through, reserved would already be 0 and the floor
    //    would have to absorb it. A non-zero warn count here means the claim
    //    guard failed.
    console.log('1) overlapping sweeps release each reservation exactly once');
    {
        const { tier, ids } = await seedN({ reserved: 2, ticketCount: 2 });
        const w = await warnsDuring(() =>
            Promise.all(Array.from({ length: 5 }, () => sweepOnce())));
        check('reserved after 5 concurrent sweeps (2 tickets)', await reservedOf(tier._id), 0);
        check('all tickets expired', (await statusesOf(ids)).every((s) => s === 'expired'), true);
        check('floor had to absorb nothing (claim guard held)', w, 0);
    }

    // 2. The floor: reserved is already 0, so the $inc must not run at all.
    console.log('\n2) reserved never goes below zero');
    {
        const { tier } = await seedN({ reserved: 0, ticketCount: 1 });
        const w = await warnsDuring(() =>
            Promise.all(Array.from({ length: 4 }, () => sweepOnce())));
        check('reserved stays at 0', await reservedOf(tier._id), 0);
        check('release blocked by the floor', w, 1);
    }

    // 3. Inside the 15 minute window the sweeper must not touch anything.
    console.log('\n3) tickets inside the 15 minute window are left alone');
    {
        const { tier, ids } = await seedN({ reserved: 1, ticketCount: 1, createdAt: FRESH });
        const w = await warnsDuring(() => sweepOnce());
        check('reservation untouched', await reservedOf(tier._id), 1);
        check('ticket still pending_payment', (await statusesOf(ids))[0], 'pending_payment');
        check('nothing to release', w, 0);
    }

    // 4. Non-pending tickets are not candidates at all.
    console.log('\n4) valid tickets are never candidates');
    {
        const { tier, ids } = await seedN({ reserved: 1, ticketCount: 1, status: 'valid' });
        const w = await warnsDuring(() => sweepOnce());
        check('reservation untouched', await reservedOf(tier._id), 1);
        check('ticket stays valid', (await statusesOf(ids))[0], 'valid');
        check('nothing to release', w, 0);
    }

    const pass = failures.length === 0;
    console.log(`\n  ${pass ? 'PASS — each reservation released exactly once' : 'FAIL'}`);
    for (const f of failures) console.log(`    ${f}`);

    await mongoose.connection.dropDatabase();
    console.log('  test database dropped');
    await mongoose.disconnect();
    process.exitCode = pass ? 0 : 1;
};

run().catch((e) => {
    console.error('sweeper proof error:', e.message);
    process.exitCode = 1;
});
