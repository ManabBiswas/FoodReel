/**
 * Regression for audit Must-fix #3: verifyPayment used to read the order,
 * mutate the document, then save() it. A webhook cancellation landing in that
 * window was overwritten with status: 'confirmed'.
 *
 * The write is now one conditional findOneAndUpdate whose filter repeats the
 * state that was read, so the stale copy can never land.
 */
import { test, after, beforeEach } from 'node:test';
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
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_verify_race_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[payment.verify.race] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const orderModel = (await import('../src/models/order.model.js')).default;
const paymentService = (await import('../src/services/payment.service.js')).default;
const { verifyPayment } = await import('../src/controllers/payment.controller.js');

const realVerifySignature = paymentService.verifyPaymentSignature;
const realGetPaymentDetails = paymentService.getPaymentDetails;

after(() => {
    paymentService.verifyPaymentSignature = realVerifySignature;
    paymentService.getPaymentDetails = realGetPaymentDetails;
});

const oid = () => new mongoose.Types.ObjectId();
const USER = oid();
const RZP_ORDER = 'order_test_race';
const RZP_PAYMENT = 'pay_test_race';
const AMOUNT_PAISE = 10000;

const gatewayPayment = () => ({
    id: RZP_PAYMENT,
    order_id: RZP_ORDER,
    amount: AMOUNT_PAISE,
    currency: 'INR',
    status: 'captured',
    method: 'card',
    created_at: Math.floor(Date.now() / 1000)
});

const makeOrder = (over = {}) => orderModel.create({
    user: USER,
    items: [{ foodItem: oid(), quantity: 1, priceAtOrder: 100, foodPartner: oid() }],
    orderSource: 'cart',
    status: 'pending',
    paymentDetails: {
        method: 'razorpay',
        status: 'pending',
        razorpayOrderId: RZP_ORDER,
        razorpayAmount: AMOUNT_PAISE
    },
    deliveryAddress: {
        fullName: 'Test User', phone: '9876543210', addressLine1: '1 Test St',
        city: 'Kolkata', state: 'West Bengal', pincode: '700001'
    },
    pricing: {
        itemPrice: 100, deliveryFee: 0, platformFee: 0,
        taxes: { gst: 0, total: 0 }, discount: 0, totalAmount: 100
    },
    ...over
});

const fakeRes = () => {
    const res = { statusCode: 200, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
};

const callVerify = (order) => {
    const res = fakeRes();
    const request = {
        id: 'test-request',
        user: { _id: USER },
        body: {
            razorpay_order_id: RZP_ORDER,
            razorpay_payment_id: RZP_PAYMENT,
            razorpay_signature: 'test-signature',
            orderId: String(order._id)
        }
    };
    return verifyPayment(request, res).then(() => res);
};

beforeEach(async () => {
    if (!connected) return;
    await orderModel.deleteMany({});
    paymentService.verifyPaymentSignature = () => true;
    paymentService.getPaymentDetails = async () => ({ payment: gatewayPayment() });
});

test('a cancellation during the gateway lookup is not overwritten', needsDb, async () => {
    const order = await makeOrder();

    // This is the race: the webhook cancels after verifyPayment's read and
    // before its write. The gateway stub is the window between the two.
    paymentService.getPaymentDetails = async () => {
        await orderModel.updateOne(
            { _id: order._id },
            { $set: { status: 'cancelled', 'cancellation.isCancelled': true } }
        );
        return { payment: gatewayPayment() };
    };

    const res = await callVerify(order);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, 'ORDER_STATE_CHANGED');

    const stored = await orderModel.findById(order._id).lean();
    assert.equal(stored.status, 'cancelled', 'cancelled order must stay cancelled');
    assert.equal(stored.paymentDetails.status, 'pending', 'payment must not be marked completed');
    assert.equal(stored.paymentDetails.razorpayPaymentId, undefined, 'no stale payment id');
});

test('the normal path still confirms the order and records the payment', needsDb, async () => {
    const order = await makeOrder();

    const res = await callVerify(order);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.order.status, 'confirmed');
    assert.equal(res.body.order.paymentStatus, 'completed');

    const stored = await orderModel.findById(order._id).lean();
    assert.equal(stored.status, 'confirmed');
    assert.equal(stored.paymentDetails.status, 'completed');
    assert.equal(stored.paymentDetails.razorpayPaymentId, RZP_PAYMENT);
    assert.ok(stored.statusTimestamps.confirmedAt);
    assert.equal(stored.orderNotes.filter((n) => /Payment successful/.test(n.note)).length, 1);
});

test('a webhook that already settled the same payment is an idempotent success', needsDb, async () => {
    const order = await makeOrder();

    // The webhook completes the order after verifyPayment's read.
    paymentService.getPaymentDetails = async () => {
        await orderModel.updateOne(
            { _id: order._id },
            {
                $set: {
                    status: 'confirmed',
                    'paymentDetails.status': 'completed',
                    'paymentDetails.razorpayPaymentId': RZP_PAYMENT
                }
            }
        );
        return { payment: gatewayPayment() };
    };

    const res = await callVerify(order);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Payment already verified');
    assert.equal(res.body.order.paymentStatus, 'completed');

    const stored = await orderModel.findById(order._id).lean();
    assert.equal(stored.paymentDetails.razorpayPaymentId, RZP_PAYMENT);
});
