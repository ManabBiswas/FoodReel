/**
 * Concurrency proof for the refund claim.
 *
 * The claim this replaces was a read-then-write: "is it already refunded?" then
 * refund. Two requests both read before either writes, so both refund. The fix
 * is a conditional findOneAndUpdate, where MongoDB guarantees a single winner.
 *
 * This fires 4 simultaneous refunds at one order and asserts exactly one reaches
 * the gateway. It runs against a THROWAWAY database so dev data is untouched.
 *
 * Usage: node scripts/refund-race.mjs
 */
import mongoose from 'mongoose';
import 'dotenv/config';
import orderModel from '../src/models/order.model.js';
import paymentService from '../src/services/payment.service.js';
import { initiateClaimedRefund } from '../src/services/refund.service.js';

const base = process.env.MONGODB_URL || 'mongodb://localhost:27017/FoodReel';
// Swap the database name for an isolated one
const testUrl = base.replace(/\/([^/?]+)(\?|$)/, '/FoodReel_refundtest$2');

// Count gateway calls instead of calling the real gateway
let gatewayCalls = 0;
paymentService.refundPayment = async () => {
    gatewayCalls++;
    await new Promise((r) => setTimeout(r, 50)); // widen the race window
    return { success: true, refund: { id: `rfnd_test_${gatewayCalls}`, status: 'processed' } };
};

const run = async () => {
    await mongoose.connect(testUrl, { serverSelectionTimeoutMS: 8000 });
    console.log(`isolated test db: ${mongoose.connection.name}`);

    const order = await orderModel.create({
        user: new mongoose.Types.ObjectId(),
        items: [{
            foodItem: new mongoose.Types.ObjectId(),
            quantity: 1,
            priceAtOrder: 500,
            foodPartner: new mongoose.Types.ObjectId(),
        }],
        currency: 'INR',
        status: 'cancelled',
        orderSource: 'cart',
        paymentDetails: {
            method: 'razorpay',
            status: 'completed',
            razorpayOrderId: 'order_race',
            razorpayPaymentId: 'pay_race',
            razorpayAmount: 50000,
        },
        pricing: { itemPrice: 500, totalAmount: 500 },
        deliveryAddress: {
            fullName: 'Race Test', phone: '9876543210', addressLine1: 'x',
            city: 'x', state: 'x', pincode: '000000',
        },
        cancellation: { isCancelled: true, cancelledBy: 'user' },
    });
    console.log(`order ${order._id} total Rs 500, payment completed\n`);

    console.log('firing 4 concurrent refunds...');
    const results = await Promise.all(
        Array.from({ length: 4 }, () =>
            initiateClaimedRefund({
                orderId: order._id,
                amount: 500,
                initiatedBy: 'user',
                reason: 'concurrency test',
            })
        )
    );

    results.forEach((r, i) => {
        console.log(`  request ${i + 1}: ${r.ok ? `OK refundId=${r.refund.refundId}` : `${r.status} ${r.code}`}`);
    });

    const succeeded = results.filter((r) => r.ok).length;
    const inFlight = results.filter((r) => !r.ok && r.code === 'REFUND_IN_FLIGHT').length;

    const after = await orderModel.findById(order._id).lean();
    const claimNotes = after.orderNotes.filter((n) => n.note.startsWith('Refund claimed'));

    console.log(`\n  gateway calls made     : ${gatewayCalls}`);
    console.log(`  requests that succeeded: ${succeeded}`);
    console.log(`  rejected as in-flight  : ${inFlight}`);
    console.log(`  refundStatus now       : ${after.cancellation.refundStatus}`);
    console.log(`  "Refund claimed" notes : ${claimNotes.length}`);

    const pass = gatewayCalls === 1 && succeeded === 1 && inFlight === 3 && claimNotes.length === 1;
    console.log(`\n  ${pass ? 'PASS — exactly one refund for four concurrent requests' : 'FAIL'}`);

    // Drop the throwaway database
    await mongoose.connection.dropDatabase();
    console.log('  test database dropped');
    await mongoose.disconnect();
    process.exitCode = pass ? 0 : 1;
};

run().catch((e) => {
    console.error('race test error:', e.message);
    process.exitCode = 1;
});
