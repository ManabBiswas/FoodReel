/**
 * Session revocation (V-09) and password hashing cost (V-10).
 *
 * V-09: JWTs were stateless and valid for 7 days with no way to invalidate an
 *       individual account. tokenVersion lets a password change kill every
 *       outstanding token for that user only.
 * V-10: hashes were created at bcrypt cost 10; the target is 12, upgraded
 *       transparently as users log in.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-session';

const userModel = (await import('../src/models/user.Model.js')).default;
const { default: isLoggedin } = await import('../src/middlewares/isLoggedin.js');
const { BCRYPT_COST, hashCostOf, hashPassword, verifyPassword } =
    await import('../src/utils/password.js');

const realFindById = userModel.findById.bind(userModel);

function fakeRes() {
    const res = { statusCode: 200, body: null };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.body = b; return res; };
    return res;
}

const stubUser = (doc) => { userModel.findById = async () => doc; };
const sign = (tv) =>
    jwt.sign(tv === undefined ? { id: 'u1' } : { id: 'u1', tv }, process.env.JWT_SECRET, { expiresIn: '5m' });

const run = async (token) => {
    const res = fakeRes();
    let nexted = false;
    await isLoggedin({ cookies: { token } }, res, () => { nexted = true; });
    return { nexted, res };
};

// ---------- V-09 ----------

test('token matching the stored version is accepted', async () => {
    stubUser({ _id: 'u1', tokenVersion: 3 });
    const { nexted, res } = await run(sign(3));
    assert.equal(nexted, true);
    assert.equal(res.statusCode, 200);
});

test('token from before a password change is rejected (401)', async () => {
    stubUser({ _id: 'u1', tokenVersion: 4 }); // user bumped to 4 after changing password
    const { nexted, res } = await run(sign(3)); // attacker/old token still says 3
    assert.equal(nexted, false, 'a stale token must not reach the route handler');
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /log in again/i);
});

test('a legacy token with no tv still works (no forced logout on upgrade)', async () => {
    // Tokens issued before tokenVersion existed carry no tv; documents default
    // to 0. Rejecting these would sign every user out on deploy.
    stubUser({ _id: 'u1', tokenVersion: 0 });
    const { nexted } = await run(sign(undefined));
    assert.equal(nexted, true);
});

test('a legacy document with no tokenVersion field accepts a tv:0 token', async () => {
    stubUser({ _id: 'u1' }); // field absent entirely
    const { nexted } = await run(sign(0));
    assert.equal(nexted, true);
});

test('blocked users are still refused before the version check', async () => {
    stubUser({ _id: 'u1', isBlocked: true, tokenVersion: 1 });
    const { nexted, res } = await run(sign(1));
    assert.equal(nexted, false);
    assert.equal(res.statusCode, 403);
});

test('user model defaults tokenVersion to 0 for new documents', () => {
    const doc = new userModel({ email: 'a@b.c', password: 'x' });
    assert.equal(doc.tokenVersion, 0);
});

// ---------- V-10 ----------

test('new hashes use the target cost', async () => {
    const hash = await hashPassword('correct horse battery staple');
    assert.equal(hashCostOf(hash), BCRYPT_COST);
    assert.ok(BCRYPT_COST >= 12, 'OWASP floor is 12');
});

test('hashCostOf reads the cost out of a bcrypt hash', () => {
    assert.equal(hashCostOf('$2a$10$abcdefghijklmnopqrstuv'), 10);
    assert.equal(hashCostOf('$2b$12$abcdefghijklmnopqrstuv'), 12);
    assert.equal(hashCostOf('not-a-hash'), null);
});

test('verifyPassword accepts the correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('s3cret-value');
    assert.equal(await verifyPassword('s3cret-value', hash), true);
    assert.equal(await verifyPassword('wrong', hash), false);
});

test('verifyPassword upgrades a legacy cost-10 hash on success', async () => {
    const bcrypt = (await import('bcrypt')).default;
    const legacy = await bcrypt.hash('legacy-pass', 10);
    assert.equal(hashCostOf(legacy), 10);

    let persisted = null;
    const ok = await verifyPassword('legacy-pass', legacy, async (newHash) => { persisted = newHash; });

    assert.equal(ok, true);
    assert.ok(persisted, 'a rehash must be handed to the caller to persist');
    assert.equal(hashCostOf(persisted), BCRYPT_COST);
});

test('verifyPassword does NOT rehash on a failed attempt', async () => {
    const bcrypt = (await import('bcrypt')).default;
    const legacy = await bcrypt.hash('legacy-pass', 10);
    let called = false;
    const ok = await verifyPassword('wrong-guess', legacy, async () => { called = true; });
    assert.equal(ok, false);
    assert.equal(called, false, 'failed logins must not trigger cost-12 bcrypt work');
});

test('verifyPassword still returns true when the rehash cannot be saved', async () => {
    const bcrypt = (await import('bcrypt')).default;
    const legacy = await bcrypt.hash('legacy-pass', 10);
    const ok = await verifyPassword('legacy-pass', legacy, async () => {
        throw new Error('db down');
    });
    assert.equal(ok, true, 'a valid login must not fail because the upgrade failed to persist');
});

test('verifyPassword does not upgrade an already-current hash', async () => {
    const hash = await hashPassword('already-good');
    let called = false;
    await verifyPassword('already-good', hash, async () => { called = true; });
    assert.equal(called, false, 'no needless rehash on every login');
});

test('a hash upgraded at login still verifies with the new cost', async () => {
    const bcrypt = (await import('bcrypt')).default;
    const legacy = await bcrypt.hash('round-trip', 10);
    let stored = legacy;
    await verifyPassword('round-trip', legacy, async (h) => { stored = h; });
    assert.equal(await bcrypt.compare('round-trip', stored), true);
    assert.equal(hashCostOf(stored), BCRYPT_COST);
});

test('auth controller no longer hardcodes a bcrypt cost', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
    for (const rel of ['src/controllers/auth.controller.js', 'src/controllers/foodPartner.controller.js']) {
        const src = fs.readFileSync(path.join(root, rel), 'utf8');
        assert.doesNotMatch(
            src,
            /bcrypt\.hash\([^)]*,\s*\d+\)/,
            `${rel} must route hashing through utils/password.js so the cost lives in one place`
        );
    }
});