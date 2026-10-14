/**
 * End-to-end upload tests (regression cover for a shipped breakage).
 *
 * The V-12 magic-byte check was originally written inside multer's fileFilter,
 * where file.buffer does not exist yet - multer calls fileFilter after parsing
 * the part headers but BEFORE consuming the stream. Every upload in the app
 * failed with "Empty upload", and the unit tests missed it because they called
 * detectFileType() directly with a hand-made buffer instead of going through
 * multer. These tests post real multipart bodies through the real middleware.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';

process.env.NODE_ENV = 'test';

const { uploadMedia, uploadProfile, verifyFileSignature, ALLOWED_MIME_TYPES } =
    await import('../src/middlewares/fileUpload.js');

const PNG = Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
    '1f15c4890000000d49444154789c6360000002000100' +
    '05fe02fea7b2b8e10000000049454e44ae426082',
    'hex'
);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const SCRIPT = Buffer.from('#!/bin/sh\nrm -rf /\n', 'utf8');

let server;
let basePort;

before(async () => {
    const app = express();
    app.post('/media', uploadMedia.single('file'), verifyFileSignature(), (req, res) => {
        res.json({ ok: true, size: req.file.size, mimetype: req.file.mimetype });
    });
    app.post('/profile', uploadProfile.single('profileImage'), verifyFileSignature(ALLOWED_MIME_TYPES.PROFILE), (req, res) => {
        res.json({ ok: true, size: req.file.size });
    });
    app.post('/optional', uploadMedia.single('file'), verifyFileSignature(), (req, res) => {
        res.json({ ok: true, hasFile: Boolean(req.file) });
    });
    app.use((err, req, res, next) => res.status(400).json({ error: err.message }));

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    basePort = server.address().port;
});

after(() => new Promise((resolve) => server.close(resolve)));

/** Build a real multipart/form-data body. */
function multipart({ field = 'file', filename, contentType, content }) {
    const boundary = `----opencode${Math.random().toString(16).slice(2)}`;
    const head = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`,
        'utf8'
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    return {
        boundary,
        body: Buffer.concat([head, content, tail])
    };
}

function post(path, { field = 'file', filename, contentType, content }) {
    const { boundary, body } = multipart({ field, filename, contentType, content });
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                host: '127.0.0.1',
                port: basePort,
                method: 'POST',
                path,
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

// ---------- the regression itself ----------

test('a valid PNG upload succeeds (this 100% failed while the check sat in fileFilter)', async () => {
    const res = await post('/media', { filename: 'pixel.png', contentType: 'image/png', content: PNG });
    assert.equal(res.status, 200, `expected 200, got ${res.status} ${res.body}`);
    assert.equal(JSON.parse(res.body).ok, true);
});

test('a valid JPEG upload succeeds on the media route', async () => {
    const res = await post('/media', { filename: 'photo.jpg', contentType: 'image/jpeg', content: JPEG });
    assert.equal(res.status, 200, `expected 200, got ${res.status} ${res.body}`);
});

test('a valid PNG upload succeeds on the profile route', async () => {
    const res = await post('/profile', { field: 'profileImage', filename: 'avatar.png', contentType: 'image/png', content: PNG });
    assert.equal(res.status, 200, `expected 200, got ${res.status} ${res.body}`);
});

test('fileFilter never reads file.buffer', async () => {
    // Guards the exact mistake: if the filter is reinstated with a buffer check,
    // every upload breaks again.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = fs.readFileSync(
        path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/middlewares/fileUpload.js'),
        'utf8'
    );
    const filterBodies = [...src.matchAll(/fileFilter:?\s*\(?[^)]*\)?\s*=>\s*\{[\s\S]*?\n    \};/g)].map((m) => m[0]);
    for (const body of filterBodies) {
        assert.doesNotMatch(body, /file\.buffer/, 'multer fileFilter runs before the buffer exists');
    }
});

// ---------- the protection still works ----------

test('a script renamed .png is rejected by content, not by extension', async () => {
    const res = await post('/media', { filename: 'evil.png', contentType: 'image/png', content: SCRIPT });
    assert.equal(res.status, 400);
    assert.match(JSON.parse(res.body).error, /does not match/i);
});

test('a video is rejected by the profile route', async () => {
    const mp4 = Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(16)]);
    const res = await post('/profile', { field: 'profileImage', filename: 'clip.mp4', contentType: 'image/png', content: mp4 });
    assert.equal(res.status, 400, 'a video must not pass an image-only route');
});

test('an undeclared mime type is rejected by the filter', async () => {
    const res = await post('/media', { filename: 'x.txt', contentType: 'text/plain', content: PNG });
    assert.equal(res.status, 400);
});

test('an optional upload with no file passes through', async () => {
    const res = await new Promise((resolve, reject) => {
        const req = http.request(
            { host: '127.0.0.1', port: basePort, method: 'POST', path: '/optional',
              headers: { 'Content-Type': 'application/json' } },
            (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => resolve({ status: r.statusCode, body: d })); }
        );
        req.on('error', reject);
        req.end('{}');
    });
    assert.equal(res.status, 200);
    assert.equal(JSON.parse(res.body).hasFile, false);
});