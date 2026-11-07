/**
 * Edge cases from the final review pass.
 *
 *  - a rejected MIME type surfaced as 500 instead of 400, so a client error was
 *    reported as a server fault (verified by uploading a PDF before the fix)
 *  - POST /api/orders never checked isAvailable/isActive, so a sold-out dish
 *    could still be ordered through the quick-order path
 *  - createOrder's catch relayed error.message on a 500
 *  - admin responses selected a `name` field that exists on neither the User nor
 *    the Admin schema (both use firstName/lastName), so admin screens showed
 *    blank names
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let server;
let basePort;

before(async () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://foodreel.test';
    process.env.JWT_SECRET = 'x'.repeat(32);
    const { default: app } = await import('../src/app.js');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    basePort = server.address().port;
});

after(() => new Promise((resolve) => server.close(resolve)));

function upload(pathname, { field, filename, contentType, content }) {
    const boundary = `----opencode${Math.random().toString(16).slice(2)}`;
    const body = Buffer.concat([
        Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\n` +
            `Content-Type: ${contentType}\r\n\r\n`,
            'utf8'
        ),
        content,
        Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
    ]);

    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                host: '127.0.0.1',
                port: basePort,
                method: 'POST',
                path: pathname,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': body.length
                }
            },
            (res) => {
                let data = '';
                res.on('data', (c) => (data += c));
                res.on('end', () => resolve({ status: res.statusCode, body: data }));
            }
        );
        req.on('error', reject);
        req.end(body);
    });
}

// ---------- 1. rejected MIME type is a client error ----------

test('a PDF rejected by fileFilter returns 400, not 500', async () => {
    const res = await upload('/api/auth/user/register', {
        field: 'profileImage',
        filename: 'doc.pdf',
        contentType: 'application/pdf',
        content: Buffer.from('%PDF-1.7\n', 'utf8')
    });
    assert.equal(res.status, 400, `expected 400, got ${res.status} ${res.body}`);
    assert.doesNotMatch(res.body, /Internal Server Error/);
});

test('an .exe rejected by fileFilter returns 400', async () => {
    // Uses the public register route: routes behind isLoggedin answer 401
    // before multer ever runs, which is the correct middleware order and means
    // an unauthenticated caller cannot probe the filter at all.
    const res = await upload('/api/auth/user/register', {
        field: 'profileImage',
        filename: 'tool.exe',
        contentType: 'application/x-msdownload',
        content: Buffer.from('MZ\0\0', 'utf8')
    });
    assert.equal(res.status, 400, `expected 400, got ${res.status} ${res.body}`);
});

test('auth runs before upload handling, so unauthenticated uploads are 401', async () => {
    const res = await upload('/api/user/profile-picture', {
        field: 'profileImage',
        filename: 'x.png',
        contentType: 'image/png',
        content: Buffer.from('89504e470d0a1a0a', 'hex')
    });
    assert.equal(res.status, 401, 'session check must precede file handling');
});

test('both fileFilters stamp status 400 on rejection', () => {
    const src = read('src/middlewares/fileUpload.js');
    const rejections = [...src.matchAll(/return cb\(\s*err, false\s*\)/g)];
    assert.ok(rejections.length >= 2, 'both filters should reject via a stamped error');
    assert.match(src, /err\.status = 400/);
});

// ---------- 2. order availability ----------

test('createOrder rejects a sold-out or inactive item', () => {
    const src = read('src/controllers/order.controller.js');
    const start = src.indexOf('const createOrder');
    const body = src.slice(start, src.indexOf('const getPartnerOrders', start));
    assert.match(
        body,
        /isActive === false \|\| foodItem\.isAvailable === false/,
        'createOrder must check availability, not just postType and price'
    );
});

test('the availability check returns 400 with a clear message', () => {
    const src = read('src/controllers/order.controller.js');
    assert.match(src, /is currently unavailable/);
});

// ---------- 3. no error.message on a 500 ----------

test('createOrder does not leak error.message', () => {
    const src = read('src/controllers/order.controller.js');
    const start = src.indexOf('const createOrder');
    const body = src.slice(start, src.indexOf('const getPartnerOrders', start));
    assert.doesNotMatch(body, /details:\s*error\.message/, 'a 500 must not relay the driver message');
    assert.match(body, /serverError\(res, error, 'Failed to create order'\)/);
});

test('no controller returns details: error.message', () => {
    const controllers = fs
        .readdirSync(path.join(ROOT, 'src/controllers'), { recursive: true })
        .filter((f) => String(f).endsWith('.js'));
    for (const rel of controllers) {
        const src = fs.readFileSync(path.join(ROOT, 'src/controllers', String(rel)), 'utf8');
        assert.doesNotMatch(
            src,
            /details:\s*error\.message/,
            `${rel} must not relay error.message to the client`
        );
    }
});

// ---------- 4. admin name fields exist on the schema ----------

test('nothing selects a non-existent `name` field on user or admin', () => {
    for (const rel of ['src/controllers/admin.controller.js', 'src/controllers/auth.controller.js']) {
        const src = read(rel);
        assert.doesNotMatch(
            src,
            /populate\('user', '[^']*\bname\b/,
            `${rel} selects \`name\`, which the User schema does not have`
        );
        assert.doesNotMatch(
            src,
            /\badmin\.name\b/,
            `${rel} reads admin.name; the Admin schema only has firstName/lastName`
        );
    }
});

test('admin responses build name from firstName/lastName', () => {
    for (const rel of ['src/controllers/admin.controller.js', 'src/controllers/auth.controller.js']) {
        const src = read(rel);
        assert.match(
            src,
            /\[admin\.firstName, admin\.lastName\]\.filter\(Boolean\)\.join\(' '\)/,
            `${rel} must compose the display name from the fields that exist`
        );
    }
});

test('the populated user name fields match the schema', () => {
    const userSchema = read('src/models/user.Model.js');
    assert.match(userSchema, /firstName/, 'User has firstName');
    assert.match(userSchema, /lastName/, 'User has lastName');

    const admin = read('src/controllers/admin.controller.js');
    assert.match(admin, /populate\('user', 'firstName lastName email'/);
    assert.doesNotMatch(admin, /populate\('user', 'name/);
});