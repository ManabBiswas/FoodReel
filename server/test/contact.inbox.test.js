/**
 * Contact-message inbox (audit item #9).
 *
 * The schema carried status ['new','read','replied'] and repliedAt from the
 * start, but nothing ever wrote them - replies went out through
 * /api/emails/contact-response and left no trace. These lock in that an admin
 * can now work the inbox and that a reply is recorded against the submission
 * it answers.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

const mongoose = (await import('mongoose')).default;
const contactMessageModel = (await import('../src/models/contactMessage.model.js')).default;
const contact = await import('../src/controllers/contact.controller.js');
const emailService = (await import('../src/services/email.service.js')).default;

let mongoServer;
let connected = false;
let unavailableReason = 'database not started';

try {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri(), { dbName: 'contact_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[contact.inbox] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const fakeRes = () => {
    const res = { statusCode: 200, body: null };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.body = b; return res; };
    return res;
};

const seed = (overrides = {}) =>
    contactMessageModel.create({
        name: 'Visitor',
        email: 'visitor@example.com',
        message: 'Your app is great',
        ...overrides
    });

// ---------- public submission still works ----------

test('a submitted contact message is stored with status new', needsDb, async () => {
    const res = fakeRes();
    await contact.submitContactMessage(
        { body: { name: 'Asha', email: 'Asha@Example.COM', message: 'Hello there' } },
        res
    );

    assert.equal(res.statusCode, 201);
    const stored = await contactMessageModel.findOne({ email: 'asha@example.com' });
    assert.ok(stored, 'the submission must be persisted');
    assert.equal(stored.status, 'new');
    assert.equal(stored.repliedAt, null);
});

test('submission still rejects incomplete or malformed input', needsDb, async () => {
    const res = fakeRes();
    await contact.submitContactMessage({ body: { name: 'x', email: 'not-an-email', message: '' } }, res);
    assert.equal(res.statusCode, 400);
});

// ---------- admin listing ----------

test('list returns messages newest first and reports the total', needsDb, async () => {
    await contactMessageModel.deleteMany({});
    await seed({ message: 'first' });
    await new Promise((r) => setTimeout(r, 5));
    await seed({ message: 'second' });

    const res = fakeRes();
    await contact.listContactMessages({ query: {} }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.messages.length, 2);
    assert.equal(res.body.messages[0].message, 'second', 'newest must come first');
    assert.equal(res.body.pagination.total, 2);
});

test('list filters by status', needsDb, async () => {
    await contactMessageModel.deleteMany({});
    await seed({ message: 'unread' });
    await seed({ message: 'answered', status: 'replied', repliedAt: new Date() });

    const res = fakeRes();
    await contact.listContactMessages({ query: { status: 'replied' } }, res);

    assert.equal(res.body.messages.length, 1);
    assert.equal(res.body.messages[0].message, 'answered');
});

test('list rejects an unknown status instead of silently returning nothing', needsDb, async () => {
    const res = fakeRes();
    await contact.listContactMessages({ query: { status: 'archived' } }, res);
    assert.equal(res.statusCode, 400);
});

// ---------- status transitions ----------

test('status can be moved to read', needsDb, async () => {
    await contactMessageModel.deleteMany({});
    const doc = await seed();

    const res = fakeRes();
    await contact.updateContactMessageStatus(
        { params: { messageId: doc._id.toString() }, body: { status: 'read' } },
        res
    );

    assert.equal(res.statusCode, 200);
    assert.equal((await contactMessageModel.findById(doc._id)).status, 'read');
});

test('status update rejects an invalid value and an unknown id', needsDb, async () => {
    const doc = await seed();

    const bad = fakeRes();
    await contact.updateContactMessageStatus(
        { params: { messageId: doc._id.toString() }, body: { status: 'spam' } },
        bad
    );
    assert.equal(bad.statusCode, 400);

    const missing = fakeRes();
    await contact.updateContactMessageStatus(
        { params: { messageId: new mongoose.Types.ObjectId().toString() }, body: { status: 'read' } },
        missing
    );
    assert.equal(missing.statusCode, 404);
});

// ---------- the reply actually records itself ----------

test('replying marks the submission replied and stamps repliedAt', needsDb, async () => {
    await contactMessageModel.deleteMany({});
    const doc = await seed({ message: 'Where is my order?' });

    // Stub the mailer - this test is about the record, not SMTP.
    const sent = [];
    const real = emailService.sendContactResponseEmail;
    emailService.sendContactResponseEmail = async (...args) => sent.push(args);

    try {
        const res = fakeRes();
        await contact.replyToContactMessage(
            { params: { messageId: doc._id.toString() }, body: { message: 'It shipped today.' } },
            res
        );

        assert.equal(res.statusCode, 200);
        assert.equal(sent.length, 1, 'the reply must actually be sent');
        assert.equal(sent[0][0], 'visitor@example.com', 'replies go to the submitter');

        const stored = await contactMessageModel.findById(doc._id);
        assert.equal(stored.status, 'replied');
        assert.ok(stored.repliedAt instanceof Date, 'repliedAt must be stamped');
    } finally {
        emailService.sendContactResponseEmail = real;
    }
});

test('a failed send leaves the message unanswered', needsDb, async () => {
    await contactMessageModel.deleteMany({});
    const doc = await seed({ message: 'Second question' });

    const real = emailService.sendContactResponseEmail;
    emailService.sendContactResponseEmail = async () => {
        throw new Error('SMTP down');
    };

    try {
        const res = fakeRes();
        await contact.replyToContactMessage(
            { params: { messageId: doc._id.toString() }, body: { message: 'try again' } },
            res
        );
        assert.equal(res.statusCode, 500);

        const stored = await contactMessageModel.findById(doc._id);
        assert.equal(stored.status, 'new', 'a failed send must not mark the message answered');
        assert.equal(stored.repliedAt, null);
    } finally {
        emailService.sendContactResponseEmail = real;
    }
});

test('reply rejects an empty body and an unknown message', needsDb, async () => {
    const doc = await seed();

    const empty = fakeRes();
    await contact.replyToContactMessage(
        { params: { messageId: doc._id.toString() }, body: { message: '   ' } },
        empty
    );
    assert.equal(empty.statusCode, 400);

    const missing = fakeRes();
    await contact.replyToContactMessage(
        { params: { messageId: new mongoose.Types.ObjectId().toString() }, body: { message: 'hi' } },
        missing
    );
    assert.equal(missing.statusCode, 404);
});

// ---------- routes are wired and admin-gated ----------

test('contact inbox routes exist and require an admin session', async () => {
    const http = await import('node:http');
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://foodreel.test';
    const { default: app } = await import('../src/app.js');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();

    const call = (method, path) =>
        new Promise((resolve) => {
            const req = http.request(
                { host: '127.0.0.1', port, method, path, headers: { 'Content-Type': 'application/json' } },
                (res) => {
                    let body = '';
                    res.on('data', (c) => (body += c));
                    res.on('end', () => resolve({ status: res.statusCode, body }));
                }
            );
            req.end();
        });

    try {
        const id = new mongoose.Types.ObjectId().toString();
        assert.equal((await call('GET', '/api/admin/contact-messages')).status, 401);
        assert.equal(
            (await call('PATCH', `/api/admin/contact-messages/${id}/status`)).status,
            401
        );
        assert.equal((await call('POST', `/api/admin/contact-messages/${id}/reply`)).status, 401);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});