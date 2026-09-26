import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createCache } from '../src/utils/cache.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('createCache', () => {
    test('returns undefined before anything is cached', () => {
        const cache = createCache(1000);
        assert.equal(cache.get(), undefined);
    });

    test('resolve() produces a value and get() then serves it', async () => {
        const cache = createCache(1000);
        let calls = 0;
        const produce = async () => { calls++; return { n: calls }; };

        const first = await cache.resolve(produce);
        const second = await cache.resolve(produce);

        assert.deepEqual(first, { n: 1 });
        assert.deepEqual(second, { n: 1 });
        assert.equal(calls, 1, 'producer must not run again inside the TTL');
    });

    test('a burst of concurrent callers runs the producer once', async () => {
        // This is the property the dashboard relies on: many admins polling at
        // once must collapse into a single database aggregation.
        const cache = createCache(1000);
        let calls = 0;
        const produce = async () => {
            calls++;
            await sleep(20);
            return calls;
        };

        const results = await Promise.all(
            Array.from({ length: 100 }, () => cache.resolve(produce))
        );

        assert.equal(calls, 1, 'thundering herd was not prevented');
        assert.ok(results.every((r) => r === 1));
    });

    test('expires after the TTL', async () => {
        const cache = createCache(40);
        let calls = 0;
        const produce = async () => ++calls;

        await cache.resolve(produce);
        await cache.resolve(produce);
        assert.equal(calls, 1);

        await sleep(70);
        await cache.resolve(produce);
        assert.equal(calls, 2, 'stale value was served past the TTL');
    });

    test('invalidate() forces the next resolve to re-produce', async () => {
        const cache = createCache(10_000);
        let calls = 0;
        const produce = async () => ++calls;

        await cache.resolve(produce);
        cache.invalidate();
        assert.equal(cache.get(), undefined);
        await cache.resolve(produce);

        assert.equal(calls, 2);
    });

    test('a producer failure is not cached and does not wedge the cache', async () => {
        const cache = createCache(1000);
        let calls = 0;
        const flaky = async () => {
            calls++;
            if (calls === 1) throw new Error('db down');
            return 'ok';
        };

        await assert.rejects(() => cache.resolve(flaky), /db down/);
        // Must be able to recover immediately rather than serving a failure
        const recovered = await cache.resolve(flaky);
        assert.equal(recovered, 'ok');
        assert.equal(calls, 2);
    });

    test('concurrent callers all observe the same rejection', async () => {
        const cache = createCache(1000);
        let calls = 0;
        const failing = async () => { calls++; await sleep(10); throw new Error('boom'); };

        const settled = await Promise.allSettled(
            Array.from({ length: 5 }, () => cache.resolve(failing))
        );

        assert.equal(calls, 1);
        assert.ok(settled.every((s) => s.status === 'rejected'));
    });
});
