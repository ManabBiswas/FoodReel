import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldLogAccess } from '../src/middlewares/requestId.js';

test('access log always keeps faults and slow requests', () => {
    assert.equal(shouldLogAccess(500, 5, { sample: 0.99, rate: 0 }), true);
    assert.equal(shouldLogAccess(503, 5, { sample: 0.99, rate: 0 }), true);
    assert.equal(shouldLogAccess(200, 1500, { sample: 0.99, rate: 0 }), true);
});

test('access log samples healthy requests', () => {
    assert.equal(shouldLogAccess(200, 5, { sample: 0.5, rate: 0.1 }), false);
    assert.equal(shouldLogAccess(200, 5, { sample: 0.05, rate: 0.1 }), true);
    assert.equal(shouldLogAccess(404, 5, { sample: 0.99, rate: 1 }), true);
});
