/**
 * Regressions from the FoodFest QR / webhook pass.
 *
 * The QR bug was the worst class of failure in this repo's history: a single
 * truthiness check against a property that does not exist made every FoodFest
 * ticket purchase fail, and nothing caught it because no test exercised the
 * upload path or the storage service's real return shape.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const storageService = (await import('../src/services/storage.service.js')).default;
const qrService = (await import('../src/services/foodfest.qr.service.js')).default;

// ---------- 1. the QR upload contract ----------

test('storage.uploadFile returns no `success` flag (the trap that broke QR)', async () => {
    // Read the real shape rather than assume it: this mismatch is what made
    // `if (!uploadResponse.success)` throw on every successful upload.
    const src = read('src/services/storage.service.js');
    const fn = src.slice(src.indexOf('async function uploadFile'));
    const ret = fn.slice(fn.indexOf('return {'), fn.indexOf('}', fn.indexOf('return {')));
    assert.doesNotMatch(ret, /success\s*:/, 'uploadFile must not be read as if it returned success');
    assert.match(ret, /url:/, 'it returns url');
});

test('createQRImage succeeds when the upload returns a url', async () => {
    const real = storageService.uploadFile;
    storageService.uploadFile = async () => ({
        url: 'https://ik.imagekit.io/abc/tickets/1.png',
        fileId: 'file-1',
        name: '1.png',
        isVideo: false
    });
    try {
        const url = await qrService.createQRImage('signed.token.payload');
        assert.match(url, /^https:\/\//, 'a successful upload must yield the stored URL');
    } finally {
        storageService.uploadFile = real;
    }
});

test('createQRImage still throws when the upload yields no url', async () => {
    const real = storageService.uploadFile;
    storageService.uploadFile = async () => ({ fileId: 'x', name: 'x.png', isVideo: false });
    try {
        await assert.rejects(
            () => qrService.createQRImage('signed.token.payload'),
            /no URL returned/,
            'a missing URL must be reported, not silently returned'
        );
    } finally {
        storageService.uploadFile = real;
    }
});

test('createQRImage propagates a storage failure', async () => {
    const real = storageService.uploadFile;
    storageService.uploadFile = async () => { throw new Error('ImageKit 503'); };
    try {
        await assert.rejects(() => qrService.createQRImage('signed.token.payload'), /ImageKit 503/);
    } finally {
        storageService.uploadFile = real;
    }
});

// ---------- 2. every upload route verifies content ----------

test('every upload route runs verifyFileSignature', () => {
    const routes = ['auth.route.js', 'user.route.js', 'food.route.js', 'userPost.route.js', 'advertisement.route.js'];
    for (const file of routes) {
        const src = read(`src/routes/${file}`);
        const starts = [...src.matchAll(/upload\.single\([^)]*\)/g)];
        assert.ok(starts.length > 0, `${file} should have at least one upload route`);
        for (const start of starts) {
            // Everything between this upload and the next router.* statement
            // (or end of line) is that route's middleware chain.
            const rest = src.slice(start.index + start[0].length);
            const boundary = rest.search(/\n\s*router\./);
            const chain = boundary === -1 ? rest : rest.slice(0, boundary);
            assert.match(
                chain,
                /verifyFileSignature\(/,
                `${file}: an upload route is missing verifyFileSignature`
            );
        }
    }
});

test('fileUpload exports verifyFileSignature both named and on the default', () => {
    const src = read('src/middlewares/fileUpload.js');
    assert.match(src, /export const verifyFileSignature/);
    const defaultExport = src.slice(src.indexOf('export default {'));
    assert.match(
        defaultExport,
        /verifyFileSignature/,
        'the default export must include verifyFileSignature so both import styles work'
    );
});

// ---------- 3. webhook records what it actually did ----------

test('the foodfest webhook branch records a real outcome', () => {
    const src = read('src/controllers/payment.controller.js');
    const start = src.indexOf("foodfest_ticket");
    assert.ok(start > -1, 'the foodfest branch must exist');
    const block = src.slice(start - 400, start + 1400);
    assert.match(block, /recordWebhookOutcome\(/, 'the branch must update the ledger');
    assert.match(block, /result\?\.success/, 'must read the documented success field, not `ok`');
    assert.doesNotMatch(
        block,
        /handled: 'foodfest_ticket_failed'/,
        'a transient failure must not be acknowledged with 200 or Razorpay will never retry'
    );
});

test('the foodfest branch does not swallow errors', () => {
    const src = read('src/controllers/payment.controller.js');
    const start = src.indexOf("kind === 'foodfest_ticket'");
    const block = src.slice(start, start + 1600);
    assert.doesNotMatch(
        block,
        /catch\s*\([^)]*\)\s*\{\s*\n?\s*return res\.status\(200\)/,
        'an inner catch returning 200 would silently drop a paid ticket'
    );
});

test('finalizeTicketPayment reports success, not ok', () => {
    const src = read('src/services/foodfest.ticket.service.js');
    assert.match(src, /return \{ success: true, ticket \}/);
});

// ---------- 4. tokenVersion is honoured everywhere ----------

test('every auth surface checks tokenVersion', () => {
    for (const rel of [
        'src/middlewares/isLoggedin.js',
        'src/middlewares/isUserOrPartner.js',
        'src/middlewares/optionalAuth.js',
        'src/services/foodfest.socket.service.js'
    ]) {
        const src = read(rel);
        assert.match(
            src,
            /decoded\.tv/,
            `${rel} must check tokenVersion so a password change revokes old tokens`
        );
    }
});

test('optionalAuth selects tokenVersion', () => {
    const src = read('src/middlewares/optionalAuth.js');
    assert.match(src, /select\([^)]*tokenVersion/, 'the field must be selected or it is always undefined');
});

test('the socket handshake selects tokenVersion for users', () => {
    const src = read('src/services/foodfest.socket.service.js');
    assert.match(src, /select\([^)]*tokenVersion/);
});

// ---------- 5. sanitizeFilter stays off (V-13) ----------

test('sanitizeFilter is deliberately NOT enabled', async () => {
    // Proven against a real mongod: with sanitizeFilter on, both capacity
    // guards throw "$expr is not allowed with sanitizeFilter", silently
    // disabling zone capacity and ticket oversell protection.
    const src = read('src/db/db.js');
    assert.doesNotMatch(src, /mongoose\.set\('sanitizeFilter',\s*true\)/);
    assert.match(src, /mongoose\.set\('strictQuery',\s*true\)/, 'strictQuery is safe and stays on');
    assert.match(src, /\$expr/, 'db.js should document why sanitizeFilter is off');
});