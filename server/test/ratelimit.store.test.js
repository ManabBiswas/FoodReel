/**
 * Shared Mongo-backed rate-limit store (audit V-15).
 *
 * Two properties matter and are easy to get wrong:
 *  - a bucket must NOT have its window extended by each request, or the limit
 *    never trips at all
 *  - when Mongo is unavailable the store must fail OPEN into in-memory
 *    counting, never to "unlimited" and never to a 500 on every request
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

const mongoose = (await import('mongoose')).default;
const { MongoRateLimitStore, buildStore } = await import('../src/middlewares/rateLimitStore.js');

let mongoServer;
let connected = false;

try {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri(), { dbName: 'ratelimit_test' });
    connected = true;
} catch (error) {
    console.error('[ratelimit.test] skipping:', error.message);
}

after(async () => {
    MongoRateLimitStore.resetReadiness();
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : 'no database available' };
const Counter = () => mongoose.models.ratelimitcounters;

test('counts hits and reports a reset time in the future', needsDb, async () => {
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 't1' });
    const first = await store.increment('client-a');
    const second = await store.increment('client-a');

    assert.equal(first.totalHits, 1);
    assert.equal(second.totalHits, 2);
    assert.ok(second.resetTime instanceof Date);
    assert.ok(second.resetTime.getTime() > Date.now(), 'resetTime must be in the future');
});

test('buckets are per client key', needsDb, async () => {
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 't2' });
    await store.increment('client-x');
    await store.increment('client-x');
    const other = await store.increment('client-y');
    assert.equal(other.totalHits, 1, 'a different client must not inherit the count');
});

test('buckets are per limiter prefix (windows never mix)', needsDb, async () => {
    const payments = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'pay' });
    const auth = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'auth' });

    await payments.increment('same-key');
    await payments.increment('same-key');
    const viaAuth = await auth.increment('same-key');

    assert.equal(viaAuth.totalHits, 1, 'limiters with different windows must not share a bucket');
});

test('the window is not extended by later requests', needsDb, async () => {
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 't3' });

    const first = await store.increment('c');
    const firstReset = first.resetTime.getTime();

    await new Promise((r) => setTimeout(r, 60));
    const later = await store.increment('c');

    assert.equal(
        later.resetTime.getTime(),
        firstReset,
        'resetTime must stay fixed for the life of the window, otherwise the limit never trips'
    );
    assert.equal(later.totalHits, 2);
});

test('an expired window resets the counter', needsDb, async () => {
    // 60ms window: first hit sets it, then the bucket is stale.
    const store = new MongoRateLimitStore({ windowMs: 60, prefix: 't4' });

    await store.increment('c');
    await store.increment('c');
    await new Promise((r) => setTimeout(r, 200));

    const afterWindow = await store.increment('c');
    assert.equal(afterWindow.totalHits, 1, 'a new window must start counting from 1');
});

test('counter documents are persisted, not held in process memory', needsDb, async () => {
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 't5' });
    await store.increment('persisted');
    assert.equal(await Counter().countDocuments({ _id: 't5:persisted' }), 1);
});

test('decrement, resetKey and resetAll reach the database', needsDb, async () => {
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 't6' });

    await store.increment('c');
    await store.increment('c');
    await store.decrement('c');
    assert.equal((await Counter().findById('t6:c')).totalHits, 1);

    await store.resetKey('c');
    assert.equal(await Counter().countDocuments({ _id: 't6:c' }), 0);

    await store.increment('a');
    await store.increment('b');
    await store.resetAll();
    assert.equal(
        await Counter().countDocuments({ _id: new RegExp('^t6:') }),
        0,
        'resetAll must clear this limiter\'s buckets'
    );
});

test('resetAll leaves other limiter prefixes alone', needsDb, async () => {
    const t7 = new MongoRateLimitStore({ windowMs: 60_000, prefix: 't7' });
    const t8 = new MongoRateLimitStore({ windowMs: 60_000, prefix: 't8' });

    await t7.increment('shared');
    await t8.increment('shared');
    await t7.resetAll();

    assert.equal(await Counter().countDocuments({ _id: 't8:shared' }), 1);
});

test('falls back to in-memory counting when the database is gone', async () => {
    // Simulates a DB outage: the store must still count rather than stop
    // limiting. Failing open to "no limit" would make the outage an abuse
    // window; failing closed would 500 every request.
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'offline' });
    store.isStoreActive = () => false;

    const a = await store.increment('c');
    const b = await store.increment('c');

    assert.equal(a.totalHits, 1);
    assert.equal(b.totalHits, 2, 'counting must continue in memory during an outage');
    assert.equal(await Counter().countDocuments({ _id: 'offline:c' }), 0);
});

test('buildStore returns undefined without MONGODB_URL so express uses memory', () => {
    const previous = process.env.MONGODB_URL;
    delete process.env.MONGODB_URL;
    try {
        assert.equal(buildStore({ windowMs: 1000 }), undefined);
    } finally {
        if (previous !== undefined) process.env.MONGODB_URL = previous;
    }
});

test('every limiter declares a shared store', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = fs.readFileSync(
        path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/middlewares/rateLimiter.js'),
        'utf8'
    );
    const limiters = [...src.matchAll(/export const (\w+) = rateLimit\(\{/g)].map((m) => m[1]);
    assert.equal(limiters.length, 5, 'expected five limiters');
    for (const name of limiters) {
        const body = src.slice(src.indexOf(`export const ${name} = rateLimit({`));
        assert.match(
            body.slice(0, 300),
            /store: buildStore\(/,
            `${name} must use the shared store, not per-process memory`
        );
    }
});

// ---------- regression: the startup lockout ----------

test('a request during connection does not pin the store to memory', needsDb, async () => {
    // Render probes /health while connectDB() is still resolving. If that first
    // request caches a falsy readiness result, the process stays on in-memory
    // counters forever and limits stop being shared.
    MongoRateLimitStore.resetReadiness();

    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'startup' });
    store.isStoreActive = () => false; // as if Mongo were still connecting
    await store.increment('c');

    // Mongo is fully connected from here on.
    store.isStoreActive = () => true;
    await store.increment('c');
    await store.increment('c');

    assert.equal(
        await Counter().countDocuments({ _id: 'startup:c' }),
        1,
        'the store must recover and persist once the database is ready'
    );

    MongoRateLimitStore.resetReadiness();
});

test('readiness retries after a failed init rather than caching the failure', needsDb, async () => {
    // The store must be able to recover within the same process, so a transient
    // failure (index creation, brief disconnect) does not permanently downgrade
    // this limiter to in-memory counting.
    MongoRateLimitStore.resetReadiness();

    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'reinit' });

    store.isStoreActive = () => false; // first call degrades
    await store.increment('c');

    store.isStoreActive = () => true; // database healthy again
    await store.increment('c');

    assert.equal(
        await Counter().countDocuments({ _id: 'reinit:c' }),
        1,
        'a later request must reach the database after an earlier one degraded'
    );

    MongoRateLimitStore.resetReadiness();
});

// ---------- regression: single round-trip and correct pipeline semantics ----------

test('a fresh key is created with the count at 1', needsDb, async () => {
    MongoRateLimitStore.resetReadiness();
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'pipe' });
    const first = await store.increment('newkey');
    assert.equal(first.totalHits, 1, 'a brand new key must start at exactly 1');
});

test('a document with no resetAt is treated as expired, not counted', needsDb, async () => {
    // Guards the pipeline's expired test: a missing resetAt compares as null,
    // which is already <= now, so it must reset rather than increment.
    MongoRateLimitStore.resetReadiness();
    await Counter().collection.insertOne({ _id: 'legacy:c', totalHits: 5 });

    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'legacy' });
    const result = await store.increment('c');
    assert.equal(result.totalHits, 1, 'a stale document must restart at 1');
});

test('decrement never drives the shared counter below zero', needsDb, async () => {
    MongoRateLimitStore.resetReadiness();
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'floor' });

    await store.increment('c');
    await store.decrement('c');
    await store.decrement('c');
    await store.decrement('c');

    const doc = await Counter().findById('floor:c');
    assert.equal(doc.totalHits, 0, 'the counter must clamp at zero, not go negative');
});

test('a prefix is required so limiters cannot collide by accident', () => {
    assert.throws(
        () => new MongoRateLimitStore({ windowMs: 1000 }),
        /prefix/,
        'an auto-generated prefix would differ per process and break sharing'
    );
});

test('the local fallback map is bounded during a prolonged outage', async () => {
    const store = new MongoRateLimitStore({ windowMs: 60_000, prefix: 'flood' });
    store.isStoreActive = () => false;

    for (let i = 0; i < 5200; i++) {
        await store.increment(`ip-${i}`);
    }
    assert.ok(
        store.local.size <= 5000,
        `fallback map must stay bounded, got ${store.local.size} entries`
    );
});