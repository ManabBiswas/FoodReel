/**
 * Verifies the three gaps that were left open are now closed:
 *   1. a pending_approval refund can be approved or rejected by an admin
 *   2. a retried POST /api/orders creates ONE order, not two
 *   3. a partner cannot fulfil an unpaid online order
 *
 * Runs against a throwaway database (start the server with MONGODB_URL pointing
 * at it) so no dev data is touched.
 *
 * Usage:
 *   set MONGODB_URL=mongodb://localhost:27017/FoodReel_gaptest&& node server.js
 *   node scripts/gap-closure.mjs
 */
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import orderModel from '../src/models/order.model.js';
import userModel from '../src/models/user.Model.js';
import foodPartnerModel from '../src/models/foodPartner.Model.js';
import adminModel from '../src/models/admin.model.js';
import idempotencyKeyModel from '../src/models/idempotencyKey.model.js';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SECRET = process.env.JWT_SECRET;

let failures = 0;
const check = (label, pass, detail = '') => {
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
    if (!pass) failures++;
};

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 8000 });
    console.log(`test db: ${mongoose.connection.name}\n`);

    const user = await userModel.create({
        firstName: 'Gap', lastName: 'Tester', email: 'gap.tester@test.local',
        mobile: '9876500009', password: 'x', isBlocked: false,
    });
    const partner = await foodPartnerModel.create({
        companyName: 'Gap Kitchen', email: 'gap.partner@test.local', mobile: '9876500008',
        password: 'x', username: 'gapkitchen', isVerified: true, isActive: true,
        address: '1 Test Street',
    });
    const admin = await adminModel.create({
        firstName: 'Gap', lastName: 'Admin', email: 'gap.admin@test.local', code: '1234',
    });

    const userToken = jwt.sign({ id: String(user._id) }, SECRET, { expiresIn: '15m' });
    const partnerToken = jwt.sign({ id: String(partner._id) }, SECRET, { expiresIn: '15m' });
    const adminToken = jwt.sign({ id: String(admin._id) }, SECRET, { expiresIn: '15m' });

    const food = await mongoose.connection.db.collection('foods').insertOne({
        name: 'Gap Food', price: 100, foodPartner: partner._id, user: partner._id, isActive: true,
    });

    const baseOrder = (over = {}) => ({
        user: user._id,
        items: [{ foodItem: food.insertedId, quantity: 1, priceAtOrder: 100, foodPartner: partner._id }],
        currency: 'INR',
        status: 'cancelled',
        orderSource: 'cart',
        paymentDetails: {
            method: 'razorpay', status: 'completed',
            razorpayOrderId: `order_g${Date.now()}`, razorpayPaymentId: `pay_g${Date.now()}`,
            razorpayAmount: 10000,
        },
        pricing: { itemPrice: 100, totalAmount: 100 },
        deliveryAddress: { fullName: 'T', phone: '9876500009', addressLine1: 'x', city: 'x', state: 'x', pincode: '000000' },
        ...over,
    });

    // ---------------------------------------------------------------- GAP 1
    console.log('GAP 1 — a pending_approval refund can be released by an admin');
    const o1 = await orderModel.create(baseOrder({
        cancellation: { isCancelled: true, cancelledBy: 'partner', refundStatus: 'pending_approval', refundAmount: 100 },
    }));

    const asCustomer = await fetch(`${BASE}/api/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `token=${userToken}` },
        body: JSON.stringify({ orderId: String(o1._id) }),
    });
    const cj = await asCustomer.json().catch(() => ({}));
    console.log(`   customer tries to self-approve: ${asCustomer.status} ${cj.code ?? ''}`);
    check('customer CANNOT release their own pending_approval refund', asCustomer.status === 409, `got ${asCustomer.status}`);

    const queue = await fetch(`${BASE}/api/admin/refunds/pending`, { headers: { Cookie: `token=${adminToken}` } });
    const qj = await queue.json().catch(() => ({}));
    console.log(`   admin queue: ${queue.status}, ${qj.refunds?.length ?? 0} awaiting`);
    check('admin queue lists the awaiting refund', queue.status === 200 && (qj.refunds?.length ?? 0) >= 1);
    check('queue entry carries the amount and customer', qj.refunds?.[0]?.amount === 100 && !!qj.refunds?.[0]?.customer?.email);

    const noAuth = await fetch(`${BASE}/api/admin/refunds/pending`);
    check('admin queue requires admin auth', noAuth.status === 401, `got ${noAuth.status}`);

    // Reject it: the gateway is unreachable, so approval will not move money,
    // but rejection must work purely on state.
    const rejected = await fetch(`${BASE}/api/admin/orders/${o1._id}/refund/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `token=${adminToken}` },
        body: JSON.stringify({ decision: 'reject', note: 'item was already prepared' }),
    });
    const rj = await rejected.json().catch(() => ({}));
    const a1 = await orderModel.findById(o1._id).lean();
    console.log(`   admin decision (reject): ${rejected.status} ${rj.message ?? ''} -> refundStatus=${a1.cancellation.refundStatus}`);
    check('admin can reject, clearing the dead-end state', rejected.status === 200 && a1.cancellation.refundStatus === 'rejected');

    // And approve a different one
    const o1b = await orderModel.create(baseOrder({
        cancellation: { isCancelled: true, cancelledBy: 'partner', refundStatus: 'pending_approval', refundAmount: 100 },
    }));
    const approved = await fetch(`${BASE}/api/admin/orders/${o1b._id}/refund/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `token=${adminToken}` },
        body: JSON.stringify({ decision: 'approve' }),
    });
    const a1b = await orderModel.findById(o1b._id).lean();
    console.log(`   admin decision (approve): ${approved.status} -> refundStatus=${a1b.cancellation.refundStatus}`);
    check('admin approval claims the refund (moves past pending_approval)', a1b.cancellation.refundStatus !== 'pending_approval', a1b.cancellation.refundStatus);

    const twice = await fetch(`${BASE}/api/admin/orders/${o1b._id}/refund/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `token=${adminToken}` },
        body: JSON.stringify({ decision: 'approve' }),
    });
    check('a second approval is refused, not double-refunded', twice.status >= 400, `got ${twice.status}`);

    // ---------------------------------------------------------------- GAP 2
    console.log('\nGAP 2 — a retried checkout creates ONE order');
    const key = `gap-key-${Date.now()}`;
    const payload = {
        items: [{ foodItemId: String(food.insertedId), quantity: 1 }],
        paymentMethod: 'cod',
        orderSource: 'cart',
        deliveryAddress: { fullName: 'T', phone: '9876500009', addressLine1: 'x', city: 'x', state: 'x', pincode: '000000' },
    };
    const post = () =>
        fetch(`${BASE}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: `token=${userToken}`, 'Idempotency-Key': key },
            body: JSON.stringify(payload),
        });
    const before = await orderModel.countDocuments({ user: user._id });
    const r_a = await post();
    const j_a = await r_a.json().catch(() => ({}));
    const r_b = await post();
    const j_b = await r_b.json().catch(() => ({}));
    const created = (await orderModel.countDocuments({ user: user._id })) - before;
    console.log(`   first: ${r_a.status} order=${j_a.order?._id ?? '?'}`);
    console.log(`   retry: ${r_b.status} replayed=${j_b.replayed} order=${j_b.order?._id ?? '?'}`);
    check('first request created an order', r_a.status < 400 && created >= 1, `status=${r_a.status} created=${created}`);
    check('the retry created NO second order', created === 1, `created=${created}`);
    check('the retry replayed the stored response', j_b.replayed === true);
    check('both responses name the same order', (j_a.order?._id) === (j_b.order?._id));

    const noKey = await fetch(`${BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `token=${userToken}` },
        body: JSON.stringify(payload),
    });
    check('requests without the header still work (backwards compatible)', noKey.status < 500, `got ${noKey.status}`);

    // A failed attempt must not burn the key
    const burnKey = `gap-burn-${Date.now()}`;
    const bad = await fetch(`${BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `token=${userToken}`, 'Idempotency-Key': burnKey },
        body: JSON.stringify({ items: [] }),
    });
    const burned = await idempotencyKeyModel.countDocuments({ key: burnKey });
    check('a failed request does not burn its key', bad.status >= 400 && burned === 0, `status=${bad.status} keysLeft=${burned}`);

    // ---------------------------------------------------------------- GAP 3
    console.log('\nGAP 3 — a partner cannot fulfil an unpaid online order');
    const unpaid = await orderModel.create(baseOrder({
        status: 'pending',
        paymentDetails: { method: 'razorpay', status: 'processing', razorpayOrderId: 'order_unpaid', razorpayAmount: 10000 },
        cancellation: { isCancelled: false },
    }));
    const gated = await fetch(`${BASE}/api/orders/partner/${unpaid._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: `token=${partnerToken}` },
        body: JSON.stringify({ status: 'confirmed' }),
    });
    const gj = await gated.json().catch(() => ({}));
    const afterGated = await orderModel.findById(unpaid._id).lean();
    console.log(`   partner confirms an unpaid order: ${gated.status} ${gj.code ?? gj.error ?? ''}`);
    check('unpaid fulfilment is refused', gated.status === 409, `got ${gated.status}`);
    check('the order status did not change', afterGated.status === 'pending', afterGated.status);

    const codOrder = await orderModel.create(baseOrder({
        status: 'pending',
        paymentDetails: { method: 'cod', status: 'pending' },
        cancellation: { isCancelled: false },
    }));
    const codOk = await fetch(`${BASE}/api/orders/partner/${codOrder._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: `token=${partnerToken}` },
        body: JSON.stringify({ status: 'confirmed' }),
    });
    const afterCod = await orderModel.findById(codOrder._id).lean();
    console.log(`   partner confirms a COD order: ${codOk.status} -> ${afterCod.status}`);
    check('COD fulfilment is still allowed', codOk.status === 200 && afterCod.status === 'confirmed', `got ${codOk.status}`);

    console.log(`\n${failures === 0 ? 'ALL GAPS CLOSED' : `${failures} CHECK(S) FAILED`}`);
    await mongoose.connection.dropDatabase();
    console.log('test database dropped');
    await mongoose.disconnect();
    process.exitCode = failures === 0 ? 0 : 1;
};

run().catch(async (e) => {
    console.error('gap test error:', e.message);
    try {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    } catch {
        /* already disconnected */
    }
    process.exitCode = 1;
});
