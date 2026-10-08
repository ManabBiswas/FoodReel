/**
 * End-to-end check that a customer cancellation auto-refunds, and that a
 * FAILED auto-refund does not break the cancellation.
 *
 * Runs against a throwaway database (server must be started with
 * MONGODB_URL pointing at it) so no dev data is touched.
 *
 * The gateway call is expected to FAIL here, because the payment id is fake and
 * the credentials are test ones. That is deliberate: it proves the resilience
 * path — claim, attempt, release, still cancel the order.
 *
 * Usage:
 *   MONGODB_URL=mongodb://localhost:27017/FoodReel_canceltest node server.js
 *   node scripts/cancel-autorefund.mjs
 */
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import orderModel from '../src/models/order.model.js';
import userModel from '../src/models/user.Model.js';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URL, { serverSelectionTimeoutMS: 8000 });
    console.log(`test db: ${mongoose.connection.name}`);

    const user = await userModel.create({
        firstName: 'Refund', lastName: 'Tester', email: 'refund.tester@test.local',
        mobile: '9876500001', password: 'x', isBlocked: false,
    });

    const paidOrder = async (over = {}) =>
        orderModel.create({
            user: user._id,
            items: [{ foodItem: new mongoose.Types.ObjectId(), quantity: 1, priceAtOrder: 500, foodPartner: new mongoose.Types.ObjectId() }],
            currency: 'INR',
            status: 'confirmed',
            orderSource: 'cart',
            paymentDetails: {
                method: 'razorpay', status: 'completed',
                razorpayOrderId: `order_t${Date.now()}`, razorpayPaymentId: `pay_fake_${Date.now()}`,
                razorpayAmount: 50000,
            },
            pricing: { itemPrice: 500, totalAmount: 500 },
            deliveryAddress: { fullName: 'T', phone: '9876500001', addressLine1: 'x', city: 'x', state: 'x', pincode: '000000' },
            ...over,
        });

    const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const cancel = async (order) => {
        const res = await fetch(`${BASE}/api/orders/${order._id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
            body: JSON.stringify({ reason: 'changed my mind' }),
        });
        return { status: res.status, json: await res.json().catch(() => ({})) };
    };

    let failures = 0;
    const check = (label, pass, detail = '') => {
        console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
        if (!pass) failures++;
    };

    // 1. Paid order cancelled by the customer -> refund must be attempted
    console.log('\n1. customer cancels a PAID order');
    const o1 = await paidOrder();
    const r1 = await cancel(o1);
    const a1 = await orderModel.findById(o1._id).lean();
    const claimed = a1.orderNotes.some((n) => n.note.startsWith('Refund claimed'));
    console.log(`   response ${r1.status}: ${r1.json.message}`);
    console.log(`   refundStatus=${a1.cancellation.refundStatus} refundAmount=${a1.cancellation.refundAmount}`);
    check('order was cancelled', a1.status === 'cancelled' && a1.cancellation.isCancelled === true);
    check('refund was auto-claimed (no customer action needed)', claimed);
    check('refund amount is the full order total', a1.cancellation.refundAmount === 500, String(a1.cancellation.refundAmount));
    check(
        'gateway failure released the claim instead of stranding it',
        a1.cancellation.refundStatus === 'failed',
        a1.cancellation.refundStatus
    );
    check('cancellation still succeeded despite the refund failing', r1.status === 200);

    // 2. COD order -> nothing to refund, and no gateway call
    console.log('\n2. customer cancels a COD order');
    const o2 = await paidOrder({
        status: 'confirmed',
        paymentDetails: { method: 'cod', status: 'pending' },
    });
    const r2 = await cancel(o2);
    const a2 = await orderModel.findById(o2._id).lean();
    console.log(`   response ${r2.status}: ${r2.json.message}  refundInfo=${JSON.stringify(r2.json.refundInfo)}`);
    check('COD cancellation has no refund', a2.cancellation.refundStatus === 'not_applicable');
    check('no refund was claimed', !a2.orderNotes.some((n) => n.note.startsWith('Refund claimed')));
    check('cancellation succeeded', a2.status === 'cancelled' && r2.status === 200);

    console.log(`\n${failures === 0 ? 'AUTO-REFUND WIRING VERIFIED' : `${failures} CHECK(S) FAILED`}`);
    await mongoose.connection.dropDatabase();
    console.log('test database dropped');
    await mongoose.disconnect();
    process.exitCode = failures === 0 ? 0 : 1;
};

run().catch((e) => {
    console.error('cancel test error:', e.message);
    process.exitCode = 1;
});
