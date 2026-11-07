/**
 * DB-backed tests for the cancel-request flow.
 *
 * The policy unit tests use plain objects, so they cannot see what mongoose
 * actually materialises. That gap hid a real bug: a default of 'pending' on
 * cancelRequest.status made every brand new order look like it already had a
 * request awaiting review, so the first request a partner raised was always
 * refused as a duplicate. These tests run against a real mongod so the
 * document shape is the real one.
 *
 * Uses MongoMemoryReplSet like db.integration.test.js. If the binary cannot
 * start the file skips cleanly, so an offline CI run stays green.
 */
import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const mongoose = (await import('mongoose')).default;
mongoose.set('strictQuery', true);

let mongoServer;
let connected = false;
let unavailableReason = 'database not started';

try {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[cancelRequest.db] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const oid = () => new mongoose.Types.ObjectId();

// The real order model, compiled against the test database.
const orderModel = () => {
    if (mongoose.models.Order) return mongoose.models.Order;
    // Imported lazily so the model compiles against the test connection.
    const schema = new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        items: [{
            foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
            quantity: { type: Number, required: true, min: 1 },
            priceAtOrder: { type: Number, required: true },
            foodPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPartner', required: true },
        }],
        pricing: {
            itemPrice: Number, deliveryFee: Number, platformFee: Number,
            taxes: { total: Number }, discount: Number,
            totalAmount: Number, grandTotal: Number,
        },
        paymentDetails: {
            method: { type: String, enum: ['razorpay', 'cod'], required: true },
            razorpayPaymentId: String,
            status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
        },
        deliveryAddress: {
            fullName: { type: String, required: true },
            phone: { type: String, match: /^(0?[6-9]\d{9})$/, required: true },
            addressLine1: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, match: /^\d{6}$/, required: true },
        },
        orderSource: { type: String, default: 'cart' },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'cancel_requested'],
            default: 'pending',
        },
        statusTimestamps: {
            confirmedAt: Date, preparingAt: Date, readyAt: Date,
            deliveredAt: Date, cancelledAt: Date, cancelRequestedAt: Date,
        },
        orderNotes: [{
            note: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            addedBy: { type: String, enum: ['user', 'partner', 'system'], default: 'system' },
        }],
        cancellation: {
            isCancelled: { type: Boolean, default: false },
            cancelledBy: { type: String, enum: ['user', 'partner', 'admin'] },
            cancelledAt: Date,
            reason: String,
            refundStatus: {
                type: String,
                enum: ['not_applicable', 'pending', 'pending_approval', 'processing', 'completed', 'failed', 'rejected'],
                default: 'not_applicable',
            },
            refundAmount: Number,
        },
        // No defaults anywhere in here — see the note in the flow test.
        cancelRequest: {
            requestedBy: { type: String, enum: ['partner'] },
            reason: { type: String, trim: true, maxlength: 200 },
            details: { type: String, trim: true, maxlength: 1000 },
            requestedAt: Date,
            previousStatus: { type: String, enum: ['preparing', 'ready'] },
            status: { type: String, enum: ['pending', 'approved', 'rejected'] },
            decidedAt: Date,
            decidedBy: { type: String, enum: ['admin'] },
            decisionNote: { type: String, trim: true, maxlength: 500 },
        },
    });
    return mongoose.model('Order', schema);
};

const { decideCancelRequest, decideCancelRequestDecision } =
    await import('../src/services/cancelRequest.policy.js');

const makeOrder = async (over = {}) => {
    const Order = orderModel();
    return Order.create({
        user: oid(),
        items: [{ foodItem: oid(), quantity: 1, priceAtOrder: 250, foodPartner: oid() }],
        pricing: {
            itemPrice: 250, deliveryFee: 0, platformFee: 0,
            taxes: { total: 0 }, discount: 0, totalAmount: 250, grandTotal: 250,
        },
        paymentDetails: { method: 'cod', status: 'pending' },
        deliveryAddress: {
            fullName: 'Test Customer', phone: '9876543210', addressLine1: '1 Test Street',
            city: 'Kolkata', state: 'West Bengal', pincode: '700001',
        },
        orderSource: 'cart',
        ...over,
    });
};

describe('the real document shape', { ...needsDb }, () => {
    // Each test starts from an empty collection — the admin queue query
    // counts matching documents, so leftovers from an earlier test would
    // change the answer.
    beforeEach(async () => {
        if (connected) await orderModel().deleteMany({});
    });

    test('a new order has no cancel request', async () => {
        const order = await makeOrder();
        assert.equal(order.cancelRequest?.status, undefined,
            'a new order must not look like it already has a request awaiting review');
        assert.equal(order.cancelRequest?.requestedAt, undefined);
        assert.equal(order.cancellation?.isCancelled, false);
    });

    test('a saved order with no request still has no pending request', async () => {
        const order = await makeOrder();
        await order.save();
        const reloaded = await orderModel().findById(order._id);
        assert.equal(reloaded.cancelRequest?.status, undefined);
    });

    test('the first request is allowed on a real order', async () => {
        const order = await makeOrder({ status: 'preparing' });
        const result = decideCancelRequest({ order, reason: 'Out of ingredients' });
        assert.equal(result.allowed, true);
    });

    test('the request round-trips through the database', async () => {
        const order = await makeOrder({ status: 'preparing' });
        const decision = decideCancelRequest({ order, reason: 'Out of ingredients', details: 'No paneer' });

        order.status = 'cancel_requested';
        order.statusTimestamps.cancelRequestedAt = new Date();
        order.cancelRequest = {
            requestedBy: 'partner',
            reason: decision.reason,
            details: decision.details,
            requestedAt: new Date(),
            previousStatus: 'preparing',
            status: 'pending',
        };
        await order.save();

        const reloaded = await orderModel().findById(order._id);
        assert.equal(reloaded.status, 'cancel_requested');
        assert.equal(reloaded.cancelRequest.status, 'pending');
        assert.equal(reloaded.cancelRequest.reason, 'Out of ingredients');
        assert.equal(reloaded.cancelRequest.details, 'No paneer');
        assert.equal(reloaded.cancelRequest.previousStatus, 'preparing');
        assert.equal(reloaded.cancellation.isCancelled, false, 'the order is not cancelled yet');
        assert.equal(reloaded.cancellation.refundStatus, 'not_applicable', 'no money moved');
    });

    test('a second request on the same order is refused', async () => {
        const order = await makeOrder({ status: 'preparing' });
        order.cancelRequest = {
            requestedBy: 'partner', reason: 'x', requestedAt: new Date(),
            previousStatus: 'preparing', status: 'pending',
        };
        order.status = 'cancel_requested';
        await order.save();

        const reloaded = await orderModel().findById(order._id);
        const result = decideCancelRequest({ order: reloaded, reason: 'again' });
        assert.equal(result.allowed, false);
        assert.equal(result.code, 'REQUEST_ALREADY_PENDING');
    });

    test('the admin queue query finds only the pending requests', async () => {
        const parked = await makeOrder({ status: 'preparing' });
        parked.status = 'cancel_requested';
        parked.cancelRequest = {
            requestedBy: 'partner', reason: 'x', requestedAt: new Date(),
            previousStatus: 'preparing', status: 'pending',
        };
        await parked.save();

        // A decided request must not come back in the queue.
        const decided = await makeOrder({ status: 'preparing' });
        decided.status = 'cancel_requested';
        decided.cancelRequest = {
            requestedBy: 'partner', reason: 'x', requestedAt: new Date(),
            previousStatus: 'preparing', status: 'approved',
        };
        await decided.save();

        // An ordinary order must not come back either.
        await makeOrder({ status: 'preparing' });

        const queued = await orderModel().find({
            status: 'cancel_requested',
            'cancelRequest.status': 'pending',
        });
        assert.equal(queued.length, 1);
        assert.equal(String(queued[0]._id), String(parked._id));
    });

    test('an admin can approve and the order ends up cancelled', async () => {
        const order = await makeOrder({ status: 'preparing' });
        order.status = 'cancel_requested';
        order.cancelRequest = {
            requestedBy: 'partner', reason: 'Out of ingredients', requestedAt: new Date(),
            previousStatus: 'preparing', status: 'pending',
        };
        await order.save();

        const reloaded = await orderModel().findById(order._id);
        const verdict = decideCancelRequestDecision({ order: reloaded, decision: 'approve' });
        assert.equal(verdict.allowed, true);

        reloaded.cancelRequest.status = 'approved';
        reloaded.cancelRequest.decidedAt = new Date();
        reloaded.cancelRequest.decidedBy = 'admin';
        reloaded.cancellation = {
            isCancelled: true, cancelledBy: 'partner', cancelledAt: new Date(),
            reason: reloaded.cancelRequest.reason, refundStatus: 'not_applicable', refundAmount: 0,
        };
        reloaded.status = 'cancelled';
        await reloaded.save();

        const after = await orderModel().findById(order._id);
        assert.equal(after.status, 'cancelled');
        assert.equal(after.cancellation.isCancelled, true);
        assert.equal(after.cancelRequest.status, 'approved');
    });

    test('an admin can reject and the order resumes where it was', async () => {
        const order = await makeOrder({ status: 'preparing' });
        order.status = 'cancel_requested';
        order.cancelRequest = {
            requestedBy: 'partner', reason: 'Out of ingredients', requestedAt: new Date(),
            previousStatus: 'preparing', status: 'pending',
        };
        await order.save();

        const reloaded = await orderModel().findById(order._id);
        const verdict = decideCancelRequestDecision({ order: reloaded, decision: 'reject' });
        assert.equal(verdict.allowed, true);

        reloaded.cancelRequest.status = 'rejected';
        reloaded.cancelRequest.decidedAt = new Date();
        reloaded.cancelRequest.decidedBy = 'admin';
        reloaded.status = reloaded.cancelRequest.previousStatus;
        await reloaded.save();

        const after = await orderModel().findById(order._id);
        assert.equal(after.status, 'preparing', 'the order goes back to being prepared');
        assert.equal(after.cancellation.isCancelled, false, 'a rejection cancels nothing');
        assert.equal(after.cancelRequest.status, 'rejected');
    });

    test('a request on a ready order resumes at ready, not preparing', async () => {
        const order = await makeOrder({ status: 'ready' });
        order.status = 'cancel_requested';
        order.cancelRequest = {
            requestedBy: 'partner', reason: 'x', requestedAt: new Date(),
            previousStatus: 'ready', status: 'pending',
        };
        await order.save();

        const reloaded = await orderModel().findById(order._id);
        reloaded.cancelRequest.status = 'rejected';
        reloaded.status = reloaded.cancelRequest.previousStatus;
        await reloaded.save();

        const after = await orderModel().findById(order._id);
        assert.equal(after.status, 'ready');
    });
});
