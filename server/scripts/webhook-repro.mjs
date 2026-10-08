/**
 * End-to-end check of the webhook guards against the running server.
 *
 * Signs payloads with the real local webhook secret, so signature verification
 * passes and the event reaches the guard logic. Proves:
 *   1. a stale payment.failed can no longer cancel a PAID order
 *   2. a captured payment for a foreign gateway order is rejected, not applied
 *   3. the same event id twice is applied only once (idempotency)
 *
 * Usage: node scripts/webhook-repro.mjs   (server must be running)
 */
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import 'dotenv/config';

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/FoodReel';
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!SECRET) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not set — cannot sign test webhooks.');
    process.exit(1);
}

const sign = (raw) => crypto.createHmac('sha256', SECRET).update(raw).digest('hex');

const post = async (eventId, body) => {
    const raw = JSON.stringify(body);
    const res = await fetch(`${BASE}/api/payment/webhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': sign(raw),
            'x-razorpay-event-id': eventId,
        },
        body: raw,
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
};

const run = async () => {
    await mongoose.connect(url, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const orders = db.collection('orders');

    // A genuinely paid order — the one the stale failure must not touch
    const paid = await orders.findOne({ 'paymentDetails.status': 'completed' });
    if (!paid) {
        console.log('No paid order in the local DB to test against.');
        await mongoose.disconnect();
        return;
    }
    console.log(`target order ${paid._id}  status=${paid.status}  payment=${paid.paymentDetails.status}`);

    let failures = 0;
    const check = (label, pass, detail = '') => {
        console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
        if (!pass) failures++;
    };

    // 1. stale payment.failed against a paid order
    console.log('\n1. stale payment.failed against an ALREADY PAID order');
    const r1 = await post(`evt_stale_${Date.now()}`, {
        event: 'payment.failed',
        payload: {
            payment: {
                entity: {
                    id: paid.paymentDetails.razorpayPaymentId || 'pay_unknown',
                    order_id: paid.paymentDetails.razorpayOrderId || 'order_unknown',
                    status: 'failed',
                    error_description: 'stale retry',
                },
            },
        },
    });
    const after1 = await orders.findOne({ _id: paid._id });
    console.log(`   response ${r1.status} ${JSON.stringify(r1.json)}`);
    console.log(`   order now: status=${after1.status} payment=${after1.paymentDetails.status}`);
    check('paid order was NOT cancelled', after1.status !== 'cancelled' && after1.paymentDetails.status === 'completed');
    check('controller acknowledged with 200', r1.status === 200);

    // 2. payment.captured for a foreign gateway order.
    //    Use an UNSETTLED order, otherwise the already-paid guard fires first and
    //    the order-binding guard is never reached.
    console.log('\n2. payment.captured for a FOREIGN gateway order (unsettled order)');
    const unpaid = await orders.findOne({
        'paymentDetails.method': 'razorpay',
        'paymentDetails.status': { $in: ['pending', 'processing'] },
    });
    if (!unpaid) {
        console.log('   SKIPPED — no unsettled razorpay order to test against');
    } else {
        console.log(`   using order ${unpaid._id} status=${unpaid.status} payment=${unpaid.paymentDetails.status}`);
        const r2 = await post(`evt_foreign_${Date.now()}`, {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_foreign',
                        order_id: 'order_SOMEONE_ELSE',
                        amount: 1,
                        currency: 'INR',
                        status: 'captured',
                        notes: { orderId: String(unpaid._id) },
                    },
                },
            },
        });
        const after2 = await orders.findOne({ _id: unpaid._id });
        console.log(`   response ${r2.status} ${JSON.stringify(r2.json)}`);
        console.log(`   order now: status=${after2.status} payment=${after2.paymentDetails.status}`);
        check('foreign capture did NOT settle the order', after2.paymentDetails.status !== 'completed');
        check('acknowledged with 200 (retrying cannot fix bad data)', r2.status === 200);
    }

    // 3. idempotency — same event id twice
    console.log('\n3. same event id delivered twice');
    const dupId = `evt_dup_${Date.now()}`;
    const body = {
        event: 'payment.failed',
        payload: { payment: { entity: { id: 'pay_x', order_id: 'order_x', status: 'failed' } } },
    };
    const a = await post(dupId, body);
    const b = await post(dupId, body);
    console.log(`   first  -> ${a.status} ${JSON.stringify(a.json)}`);
    console.log(`   second -> ${b.status} ${JSON.stringify(b.json)}`);
    check('duplicate was recognised, not reprocessed', b.json.message === 'Duplicate event ignored', b.json.message);

    // 4. invalid signature must be rejected and not recorded
    console.log('\n4. invalid signature');
    const res = await fetch(`${BASE}/api/payment/webhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': 'deadbeef'.repeat(8),
            'x-razorpay-event-id': `evt_badsig_${Date.now()}`,
        },
        body: JSON.stringify({ event: 'payment.captured', payload: {} }),
    });
    console.log(`   response ${res.status}`);
    check('forged signature rejected with 400', res.status === 400);

    console.log(`\n${failures === 0 ? 'ALL WEBHOOK GUARDS HOLD' : `${failures} CHECK(S) FAILED`}`);
    await mongoose.disconnect();
    process.exitCode = failures === 0 ? 0 : 1;
};

run().catch((e) => {
    console.error('repro error:', e.message);
    process.exitCode = 1;
});
