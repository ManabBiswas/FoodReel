/**
 * Route-resolution regressions.
 *
 * Two bugs here broke features outright while unit tests stayed green:
 *  - userPost.getAllUserPosts referenced `filter` without declaring it
 *    (ReferenceError -> 500 on every call)
 *  - foodRoutes declares a catch-all `GET /:id` and was mounted before
 *    userPostRoutes under the same /api/food prefix, so `/api/food/user`
 *    matched the wildcard first, 404'd, and never reached the feed
 *
 * These assert the routes actually resolve through the real app, which is the
 * layer the earlier tests never touched.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://foodreel.test';

// Keep an unconnected DB from hanging requests: these tests assert routing and
// controller reachability, not query results.
mongoose.set('bufferTimeoutMS', 200);

const { default: app } = await import('../src/app.js');

let server;
let basePort;

before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    basePort = server.address().port;
});

after(() => new Promise((resolve) => server.close(resolve)));

function get(path) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            { host: '127.0.0.1', port: basePort, method: 'GET', path },
            (res) => {
                let data = '';
                res.on('data', (c) => (data += c));
                res.on('end', () => resolve({ status: res.statusCode, body: data }));
            }
        );
        req.on('error', reject);
        req.end();
    });
}

test('GET /api/food/user reaches the user-post feed, not the /:id wildcard', async () => {
    const res = await get('/api/food/user');
    assert.notEqual(
        res.status,
        404,
        'must not be swallowed by foodRoutes GET /:id, which 404s on a non-ObjectId id'
    );
    // Reaching the controller means a DB round-trip, which is not a 404/500 from
    // the wildcard. Any of 200/500-from-query is "handler was reached".
    const notWildcard = !res.body.includes('Post not found');
    assert.ok(notWildcard, `handler must be reached, got: ${res.body.slice(0, 120)}`);
});

test('GET /api/food/user does not throw ReferenceError', async () => {
    const res = await get('/api/food/user');
    assert.doesNotMatch(res.body, /filter is not defined/);
});

test('getAllUserPosts declares the filter it mutates', async () => {
    // Source-level guard: the `filter` const is what went missing before.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = fs.readFileSync(
        path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/controllers/userPost.controller.js'),
        'utf8'
    );
    const start = src.indexOf('const getAllUserPosts');
    assert.ok(start > -1, 'getAllUserPosts must exist');
    const body = src.slice(start, src.indexOf('const getUserPostsByUserId', start));
    assert.match(body, /const filter\s*=/, 'getAllUserPosts must declare the filter it mutates');
    assert.match(body, /filter\.postedBy/, 'and it must be the one carrying the own-post exclusion');
});

test('userPostRoutes is mounted before foodRoutes', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = fs.readFileSync(
        path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/app.js'),
        'utf8'
    );
    const userPost = src.indexOf("app.use('/api/food', userPostRoutes)");
    const food = src.indexOf("app.use('/api/food',foodRoutes)");
    assert.ok(userPost > -1 && food > -1, 'both mounts must be present');
    assert.ok(
        userPost < food,
        'userPostRoutes must be mounted first, or GET /:id shadows /api/food/user'
    );
});

test('GET /api/food/:id still resolves for a real-looking id', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const res = await get(`/api/food/${id}`);
    // Not the wildcard-swallowing case: an ObjectId reaches getFoodById.
    assert.doesNotMatch(res.body, /must be a valid id/);
});

test('GET /api/posts/user remains a working alias for the feed', async () => {
    const res = await get('/api/posts/user');
    assert.notEqual(res.status, 404);
    assert.doesNotMatch(res.body, /filter is not defined/);
});