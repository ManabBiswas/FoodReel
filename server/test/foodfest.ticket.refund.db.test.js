/**
 * DB-backed regression: a ticket that expired before its payment was confirmed
 * must be refunded, not reported as successfully finalised.
 *
 * The 15-minute sweeper can expire a pending_payment ticket while the customer
 * is still in Razorpay checkout. When payment.captured then arrives (verify
 * endpoint or webhook), the claim misses because the ticket is no longer
 * pending_payment. Previously the finaliser treated "a ticket exists" as
 * success, so the buyer got a 200 "already verified" with an expired ticket
 * and the captured money stayed with the gateway.
 *
 * The first test also runs verifyTicketPaymentBinding, because the verify
 * controller calls it BEFORE the finaliser — a binding that rejects terminal
 * statuses would make the refund path unreachable in production even though
 * this service works when called directly.
 *
 * Uses MongoMemoryReplSet like db.integration.test.js. If the binary cannot
 * start the file skips cleanly, so an offline CI run stays green.
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
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[foodfest.ticket.refund.db] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const paymentService = (await import('../src/services/payment.service.js')).default;
const { finalizeTicketPayment } = await import('../src/services/foodfest.ticket.service.js');
const { verifyTicketPaymentBinding } = await import('../src/services/payment.verification.js');
const FoodFestTicket = (await import('../src/models/FoodFestTicket.model.js')).default;

// Transactions use mongod's 5ms lock timeout. On a fresh database, the model's
// async index builds hold a catalog lock and every transactional claim fails
// with LockTimeout/WriteConflict. Wait for them once before any test runs.
if (connected) {
    await FoodFestTicket.init();
}

const originalRefund = paymentService.refundPayment;
let refundCalls = [];
let refundImpl = async (paymentId, amount) => ({
    success: true,
    refund: { id: `rfnd_${paymentId}`, amount }
});

beforeEach(async () => {
    if (!connected) return;
    await FoodFestTicket.deleteMany({});
    refundCalls = [];
    refundImpl = async (paymentId, amount) => ({
        success: true,
        refund: { id: `rfnd_${paymentId}`, amount }
    });
    paymentService.refundPayment = async (...args) => {
        refundCalls.push(args);
        return refundImpl(...args);
    };
});

after(() => {
    paymentService.refundPayment = originalRefund;
});

const makeTicket = (over = {}) => FoodFestTicket.create({
    eventId: new mongoose.Types.ObjectId(),
    tierId: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    status: 'expired',
    priceAtPurchase: 500,
    currency: 'INR',
    // An expired ticket never had its payment id recorded: that only happened
    // on a successful finalisation, which is exactly what never ran.
    paymentDetails: {
        razorpayOrderId: `order_${new mongoose.Types.ObjectId()}`,
        razorpayAmount: 50000
    },
    ...over
});

const orderIdOf = (ticket) => ticket.paymentDetails.razorpayOrderId;
const paymentIdFor = (ticket) => `pay_${ticket._id}`;

test('expired ticket: binding passes, finalisation refunds exactly once, payment id is kept', needsDb, async () => {
    const ticket = await makeTicket();
    const orderId = orderIdOf(ticket);
    const paymentId = paymentIdFor(ticket);

    // The verify controller runs this before the finaliser. Terminal states
    // must not be rejected here or the refund path is unreachable.
    const binding = verifyTicketPaymentBinding({
        ticket,
        razorpayOrderId: orderId,
        gatewayPayment: {
            id: paymentId,
            order_id: orderId,
            amount: 50000,
            currency: 'INR',
            status: 'captured'
        }
    });
    assert.equal(binding.ok, true, binding.message);

    const first = await finalizeTicketPayment(orderId, paymentId, 'sig');

    assert.equal(first.success, false, 'a paid-but-expired ticket is not a success');
    assert.equal(first.code, 'TICKET_EXPIRED');
    assert.equal(first.refunded, true);
    assert.equal(first.refundId, `rfnd_${paymentId}`);
    assert.equal(refundCalls.length, 1);
    assert.equal(refundCalls[0][0], paymentId);
    assert.equal(refundCalls[0][1], 500, 'the captured amount is refunded in rupees');

    const stored = await FoodFestTicket.findById(ticket._id).lean();
    assert.equal(stored.status, 'refunded');
    assert.equal(stored.refundId, `rfnd_${paymentId}`);
    assert.ok(stored.refundedAt instanceof Date);
    assert.equal(
        stored.paymentDetails.razorpayPaymentId,
        paymentId,
        'the payment id must survive for retries and support'
    );
    assert.equal(stored.refundClaimedAt, undefined, 'the claim lock is released');

    const second = await finalizeTicketPayment(orderId, paymentId, 'sig');
    assert.equal(second.success, false);
    assert.equal(second.code, 'TICKET_REFUNDED');
    assert.equal(second.refunded, true);
    assert.equal(second.refundId, `rfnd_${paymentId}`);
    assert.equal(refundCalls.length, 1, 'a retry must never refund twice');
});

test('expired ticket: a gateway failure stays retryable and keeps the payment id', needsDb, async () => {
    const ticket = await makeTicket();
    const orderId = orderIdOf(ticket);
    const paymentId = paymentIdFor(ticket);

    refundImpl = async () => { throw new Error('gateway down'); };
    const failed = await finalizeTicketPayment(orderId, paymentId, 'sig');

    assert.equal(failed.success, false);
    assert.equal(failed.code, 'TICKET_EXPIRED');
    assert.equal(failed.refunded, false);

    const afterFailure = await FoodFestTicket.findById(ticket._id).lean();
    assert.equal(afterFailure.status, 'expired', 'a failed refund must stay retryable');
    assert.equal(afterFailure.refundedAt, undefined);
    assert.equal(afterFailure.refundClaimedAt, undefined, 'the lock is released for a retry');
    assert.equal(
        afterFailure.paymentDetails.razorpayPaymentId,
        paymentId,
        'the payment id is needed to retry the refund'
    );

    refundImpl = async (pid, amount) => ({ success: true, refund: { id: `rfnd_retry_${pid}`, amount } });
    const retried = await finalizeTicketPayment(orderId, paymentId, 'sig');

    assert.equal(retried.refunded, true);
    assert.equal(refundCalls.length, 2);
    assert.equal((await FoodFestTicket.findById(ticket._id).lean()).status, 'refunded');
});

test('expired ticket: a stale claim from a crashed process can be taken over', needsDb, async () => {
    const ticket = await makeTicket({
        refundClaimedAt: new Date(Date.now() - 11 * 60 * 1000)
    });

    const result = await finalizeTicketPayment(orderIdOf(ticket), paymentIdFor(ticket), 'sig');

    assert.equal(result.refunded, true, 'a claim older than the TTL must not block the refund');
    assert.equal(refundCalls.length, 1);
    assert.equal((await FoodFestTicket.findById(ticket._id).lean()).status, 'refunded');
});

test('already valid ticket: idempotent success, no refund call', needsDb, async () => {
    const ticket = await makeTicket({ status: 'valid' });

    const result = await finalizeTicketPayment(orderIdOf(ticket), paymentIdFor(ticket), 'sig');

    assert.equal(result.success, true);
    assert.equal(result.alreadyFinalised, true);
    assert.equal(refundCalls.length, 0, 'money already settled must not be refunded');
});

test('concurrent verify + webhook reaches the gateway exactly once', needsDb, async () => {
    const ticket = await makeTicket();
    const orderId = orderIdOf(ticket);
    const paymentId = paymentIdFor(ticket);

    refundImpl = async (pid, amount) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { success: true, refund: { id: `rfnd_${pid}`, amount } };
    };

    const [a, b] = await Promise.all([
        finalizeTicketPayment(orderId, paymentId, 'sig'),
        finalizeTicketPayment(orderId, paymentId, 'sig')
    ]);

    assert.equal(a.success, false);
    assert.equal(b.success, false);
    assert.equal(refundCalls.length, 1, 'the refund claim must serialise both callers');

    const stored = await FoodFestTicket.findById(ticket._id).lean();
    assert.equal(stored.status, 'refunded');
    assert.equal(stored.refundId, `rfnd_${paymentId}`);
});
