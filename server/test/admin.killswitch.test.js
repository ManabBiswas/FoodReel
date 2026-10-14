/**
 * Admin kill-switch tests (audit V-08).
 *
 * isAdmin previously checked only that an admin document *existed*, and the
 * admin schema had no state field at all — so a compromised or departed admin
 * could not be switched off without rotating JWT_SECRET (which logs out every
 * user on the platform).
 *
 * These exercise the middleware and the toggle handler against a stubbed
 * model: the suite runs without Mongo, and mongoose buffers unconnected
 * queries for 10s before failing, so a real query would make these tests
 * assert the wrong thing.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-killswitch';

const adminModel = (await import('../src/models/admin.model.js')).default;
const { default: isAdmin } = await import('../src/middlewares/isAdmin.js');
const { default: adminController } = await import('../src/controllers/admin.controller.js');

const realFindById = adminModel.findById.bind(adminModel);
const realCountDocuments = adminModel.countDocuments.bind(adminModel);

/** Minimal express-like response double. */
function fakeRes() {
    const res = { statusCode: 200, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
}

const tokenFor = (id = 'admin-1') => jwt.sign({ id, email: 'a@b.c' }, process.env.JWT_SECRET, { expiresIn: '5m' });

before(() => {
    adminModel.findById = async () => null;
    adminModel.countDocuments = async () => 0;
});

after(() => {
    adminModel.findById = realFindById;
    adminModel.countDocuments = realCountDocuments;
});

// ---------- middleware ----------

test('isAdmin lets an active admin through', async () => {
    adminModel.findById = async () => ({ _id: 'admin-1', email: 'a@b.c', isActive: true });
    const req = { cookies: { token: tokenFor() } };
    const res = fakeRes();
    let nexted = false;

    await isAdmin(req, res, () => { nexted = true; });

    assert.equal(nexted, true, 'active admin must reach the route handler');
    assert.equal(res.statusCode, 200);
});

test('isAdmin refuses a deactivated admin with 403 (the kill switch)', async () => {
    adminModel.findById = async () => ({ _id: 'admin-1', email: 'a@b.c', isActive: false });
    const req = { cookies: { token: tokenFor() } };
    const res = fakeRes();
    let nexted = false;

    await isAdmin(req, res, () => { nexted = true; });

    assert.equal(nexted, false, 'a deactivated admin must never reach the handler');
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /deactivated/i);
});

test('isAdmin treats a legacy admin document with no isActive field as active', async () => {
    // Documents created before the field existed have isActive === undefined.
    // A truthiness check (!admin.isActive) would lock every existing admin out.
    adminModel.findById = async () => ({ _id: 'legacy', email: 'old@b.c' });
    const req = { cookies: { token: tokenFor('legacy') } };
    const res = fakeRes();
    let nexted = false;

    await isAdmin(req, res, () => { nexted = true; });

    assert.equal(nexted, true, 'legacy admin must not be locked out by the new field');
});

test('isAdmin still 401s when the admin no longer exists', async () => {
    adminModel.findById = async () => null;
    const req = { cookies: { token: tokenFor() } };
    const res = fakeRes();
    let nexted = false;

    await isAdmin(req, res, () => { nexted = true; });

    assert.equal(nexted, false);
    assert.equal(res.statusCode, 401);
});

// ---------- toggle handler ----------

test('toggleAdminActive refuses to deactivate the last active admin', async () => {
    const doc = { _id: 'admin-1', email: 'a@b.c', isActive: true, save: async () => {} };
    adminModel.findById = async () => doc;
    adminModel.countDocuments = async () => 1; // only one active admin remains

    const res = fakeRes();
    await adminController.toggleAdminActive({ params: { adminId: 'admin-1' } }, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /last active admin/i);
    assert.equal(doc.isActive, true, 'the document must not be mutated');
});

test('toggleAdminActive deactivates an admin when others remain', async () => {
    const doc = { _id: 'admin-2', email: 'x@b.c', isActive: true, save: async () => { doc.saved = true; } };
    adminModel.findById = async () => doc;
    adminModel.countDocuments = async () => 2;

    const res = fakeRes();
    await adminController.toggleAdminActive({ params: { adminId: 'admin-2' } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(doc.isActive, false);
    assert.equal(doc.saved, true, 'change must be persisted');
    assert.equal(res.body.admin.isActive, false);
});

test('toggleAdminActive reactivates a deactivated admin', async () => {
    const doc = { _id: 'admin-3', email: 'y@b.c', isActive: false, save: async () => {} };
    adminModel.findById = async () => doc;
    adminModel.countDocuments = async () => 0;

    const res = fakeRes();
    await adminController.toggleAdminActive({ params: { adminId: 'admin-3' } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(doc.isActive, true, 'toggle must be reversible');
});

test('toggleAdminActive treats a legacy admin (no isActive) as active', async () => {
    const doc = { _id: 'legacy', email: 'l@b.c', save: async () => {} }; // isActive undefined
    adminModel.findById = async () => doc;
    adminModel.countDocuments = async () => 5;

    const res = fakeRes();
    await adminController.toggleAdminActive({ params: { adminId: 'legacy' } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(doc.isActive, false, 'first toggle on a legacy doc must deactivate, not activate');
});

test('toggleAdminActive 404s for an unknown admin', async () => {
    adminModel.findById = async () => null;
    const res = fakeRes();
    await adminController.toggleAdminActive({ params: { adminId: 'nope' } }, res);
    assert.equal(res.statusCode, 404);
});