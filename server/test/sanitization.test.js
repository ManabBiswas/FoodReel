import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeInput, sanitizeMultipart } from '../src/middlewares/sanitization.js';

const run = (middleware, req) => {
    const res = {};
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    return { req, nextCalled };
};

describe('sanitizeInput', () => {
    test('strips Mongo query operators from the body (NoSQL injection)', () => {
        const req = { body: { email: 'a@b.com', $ne: null }, query: {}, params: {} };
        run(sanitizeInput, req);
        assert.equal(req.body.$ne, undefined);
        assert.equal(req.body.email, 'a@b.com');
    });

    test('strips operators from nested objects', () => {
        const req = {
            body: { filter: { $where: 'this.price > 0' } },
            query: {},
            params: {},
        };
        run(sanitizeInput, req);
        assert.equal(req.body.filter.$where, undefined);
    });

    test('strips operators from the query string', () => {
        const req = { body: {}, params: {}, query: { $gt: 10, page: '2' } };
        run(sanitizeInput, req);
        assert.equal(req.query.$gt, undefined);
        assert.equal(req.query.page, '2');
    });

    test('drops prototype-pollution keys', () => {
        const req = { body: { __proto__: { polluted: true }, ok: 1 }, query: {}, params: {} };
        run(sanitizeInput, req);
        assert.equal({}.polluted, undefined, 'Object.prototype was polluted');
        assert.equal(req.body.ok, 1);
    });

    test('escapes HTML in string values', () => {
        const req = {
            body: { bio: '<script>alert(1)</script>' },
            query: {},
            params: {},
        };
        run(sanitizeInput, req);
        assert.ok(!req.body.bio.includes('<script>'));
    });

    test('leaves a Buffer body untouched (webhook HMAC must stay byte-identical)', () => {
        const raw = Buffer.from('{"event":"payment.captured"}');
        const req = { body: raw, query: {}, params: {} };
        run(sanitizeInput, req);
        assert.ok(Buffer.isBuffer(req.body), 'webhook body was replaced');
        assert.equal(req.body.toString(), raw.toString());
    });

    test('always calls next()', () => {
        const { nextCalled } = run(sanitizeInput, { body: {}, query: {}, params: {} });
        assert.equal(nextCalled, true);
    });
});

describe('sanitizeMultipart', () => {
    test('strips path separators from the uploaded filename', () => {
        const req = {
            body: { caption: 'hi' },
            file: { originalname: '../../etc/passwd' },
        };
        run(sanitizeMultipart, req);
        assert.ok(!req.file.originalname.includes('/'));
        assert.ok(!req.file.originalname.includes('\\'));
    });

    test('handles a files object keyed by field name', () => {
        const req = {
            body: {},
            files: { file: [{ originalname: 'a/b.png' }] },
        };
        run(sanitizeMultipart, req);
        assert.ok(!req.files.file[0].originalname.includes('/'));
    });

    test('is a no-op when nothing was uploaded', () => {
        const { nextCalled } = run(sanitizeMultipart, { body: { a: 1 } });
        assert.equal(nextCalled, true);
    });
});
