/**
 * Regression cover for the security holes found after the first audit pass.
 *
 * Each of these existed in shipping code and let a control be bypassed:
 *  - three admin entry points, only one of which honoured the kill switch
 *  - register() minted a token with no tokenVersion, exempt from revocation
 *  - clearCookie omitted the attributes the cookie was set with, so logout
 *    silently failed in production
 *  - POST /api/orders accepted items from multiple vendors
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-regress';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const adminModel = (await import('../src/models/admin.model.js')).default;
const authController = (await import('../src/controllers/auth.controller.js')).default;
const adminController = (await import('../src/controllers/admin.controller.js')).default;
const userModel = (await import('../src/models/user.Model.js')).default;
const isLoggedin = (await import('../src/middlewares/isLoggedin.js')).default;

const realFindOne = adminModel.findOne.bind(adminModel);
const realFindById = adminModel.findById.bind(adminModel);
const realUserFindById = userModel.findById.bind(userModel);

after(() => {
    adminModel.findOne = realFindOne;
    adminModel.findById = realFindById;
    userModel.findById = realUserFindById;
});

const fakeRes = () => {
    const res = { statusCode: 200, body: null, cookieSet: false };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.body = b; return res; };
    res.cookie = () => { res.cookieSet = true; return res; };
    res.clearCookie = () => res;
    return res;
};

// ---------- admin kill switch across ALL entry points ----------

test('POST /api/admin/login refuses a deactivated admin', async () => {
    adminModel.findOne = async () => ({ _id: 'a1', email: 'x@y.z', code: '1234', isActive: false });
    const res = fakeRes();
    await adminController.login({ body: { email: 'x@y.z', code: '1234' } }, res);
    assert.equal(res.cookieSet, false, 'no token may be issued');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Invalid email or code', 'must be indistinguishable from a bad code');
});

test('auth.controller adminLogin refuses a deactivated admin', async () => {
    adminModel.findOne = async () => ({ _id: 'a2', email: 'x@y.z', code: '1234', isActive: false });
    const res = fakeRes();
    await authController.adminLogin({ body: { email: 'x@y.z', code: '1234' } }, res);
    assert.equal(res.cookieSet, false);
    assert.equal(res.statusCode, 400);
});

test('adminProfile refuses a deactivated admin even with a valid token', async () => {
    adminModel.findById = () => {
        // `await adminModel.findById(id).select('-code')` - .select() must return
        // something awaitable that resolves to the document.
        const query = {
            select: () => Promise.resolve({ _id: 'a3', email: 'x@y.z', isActive: false })
        };
        return query;
    };
    const token = jwt.sign({ id: 'a3' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const res = fakeRes();
    await authController.adminProfile({ cookies: { token } }, res);
    assert.equal(res.statusCode, 401);
});

test('every admin login entry point checks isActive', () => {
    for (const rel of ['src/controllers/admin.controller.js', 'src/controllers/auth.controller.js']) {
        const src = read(rel);
        assert.match(src, /isActive === false/, `${rel} must enforce the kill switch`);
    }
});

test('the socket handshake refuses a deactivated admin', () => {
    const src = read('src/services/foodfest.socket.service.js');
    assert.match(
        src,
        /isActive/,
        'socket handshake must check the admin kill switch, not just existence'
    );
});

// ---------- tokenVersion ----------

test('register() issues a token carrying tokenVersion', () => {
    const src = read('src/controllers/auth.controller.js');
    // Every user token mint must embed tv, or that token can never be revoked.
    const userMints = [...src.matchAll(/jwt\.sign\(\{\s*id: user\._id[^}]*\}\s*,\s*process\.env\.JWT_SECRET/g)]
        .map((m) => m[0]);
    assert.ok(userMints.length >= 2, 'expected register and login mints');
    for (const mint of userMints) {
        assert.match(mint, /tv:/, `user token must embed tokenVersion: ${mint}`);
    }
});

test('isLoggedin rejects a mismatched version and treats a missing tv as 0', async () => {
    const doc = { _id: 'u1', tokenVersion: 2 };
    userModel.findById = async () => doc;

    const run = async (payload) => {
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });
        const res = fakeRes();
        let nexted = false;
        await isLoggedin({ cookies: { token } }, res, () => { nexted = true; });
        return nexted;
    };

    assert.equal(await run({ id: 'u1', tv: 2 }), true, 'matching version passes');
    assert.equal(await run({ id: 'u1', tv: 1 }), false, 'stale version is rejected');
    assert.equal(await run({ id: 'u1', tv: 3 }), false, 'a newer version is rejected too');
    assert.equal(await run({ id: 'u1' }), false, 'a token with no tv must NOT outlive a version bump');
});

// ---------- cookie clearing ----------

test('every clearCookie repeats the cookie attributes', () => {
    for (const rel of [
        'src/controllers/auth.controller.js',
        'src/controllers/admin.controller.js',
        'src/controllers/foodPartner.controller.js'
    ]) {
        const src = read(rel);
        const clears = [...src.matchAll(/res\.clearCookie\([^)]*\)/g)].map((m) => m[0]);
        assert.ok(clears.length > 0, `${rel} should have at least one clearCookie`);
        for (const call of clears) {
            assert.match(
                call,
                /authCookieOptions\(/,
                `${rel}: ${call} must match the sameSite/secure attributes used to set the cookie, ` +
                'or browsers keep it in production'
            );
        }
    }
});

// ---------- single-restaurant orders ----------

test('POST /api/orders rejects items from more than one restaurant', () => {
    const src = read('src/controllers/order.controller.js');
    assert.match(
        src,
        /must belong to the same restaurant/,
        'createOrder must enforce the single-vendor rule'
    );
    assert.match(
        src,
        /new Set\(orderItems\.map/,
        'the guard must derive the vendor set from the resolved items'
    );
});

// ---------- sanitization must not rewrite secrets ----------

test('password fields bypass xss escaping but not key stripping', () => {
    const src = read('src/middlewares/sanitization.js');
    assert.match(src, /RAW_STRING_KEYS/, 'secrets must be exempted from HTML escaping');
    for (const key of ['password', 'currentPassword', 'newPassword']) {
        assert.ok(src.includes(`'${key}'`), `${key} must be listed`);
    }
    assert.match(src, /DANGEROUS_KEYS/, 'prototype-pollution stripping must still apply');
});

test('a password containing angle brackets is stored unchanged', async () => {
    const { sanitizeInput } = await import('../src/middlewares/sanitization.js');
    const xss = (await import('xss')).default;

    const req = {
        body: { password: 'P<123>&x', name: '<script>alert(1)</script>' },
        params: {},
        query: { q: 'a&b' }
    };
    sanitizeInput(req, res => {}, () => {});

    assert.equal(req.body.password, 'P<123>&x', 'password must survive untouched');
    assert.notEqual(req.body.name, '<script>alert(1)</script>', 'other fields are still escaped');
});