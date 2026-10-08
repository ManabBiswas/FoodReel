/**
 * Refund execution with an atomic claim.
 *
 * The race this prevents: two requests (a double-click, a retried mobile request, a customer cancel landing while they press the refund button) both read the order, both see "not yet refunded", and both call the gateway. Two refunds for one order means the customer gets their money back twice.
 */

import orderModel from '../models/order.model.js';
import paymentService from './payment.service.js';

/** States in which a refund must not be started again. */
const IN_FLIGHT = ['processing', 'completed', 'pending_approval'];

/**
 * Try to claim the right to refund an order.
 * @returns the claimed order document, or null if someone else holds the claim
 */
export const claimRefund = async ({ orderId, amount, initiatedBy = 'system', reason, fromApproval = false }) => {
    const claimed = await orderModel.findOneAndUpdate(
        {
            _id: orderId,
            'paymentDetails.status': 'completed',
            'paymentDetails.razorpayPaymentId': { $exists: true, $ne: null },
            'cancellation.refundStatus': fromApproval
                ? { $eq: 'pending_approval' }
                : { $nin: IN_FLIGHT },
        },
        {
            $set: {
                'cancellation.refundStatus': 'processing',
                'cancellation.refundAmount': amount,
                'cancellation.refundInitiatedAt': new Date(),
                'cancellation.refundInitiatedBy': initiatedBy,
            },
            $push: {
                orderNotes: {
                    note: `Refund claimed by ${initiatedBy}${reason ? `: ${reason}` : ''}`,
                    addedBy: 'system',
                },
            },
        },
        { new: true }
    );

    return claimed;
};

/** Release a claim after a gateway failure so the refund can be retried. */
export const releaseRefundClaim = async (orderId, message) => {
    await orderModel
        .updateOne(
            { _id: orderId, 'cancellation.refundStatus': 'processing' },
            {
                $set: { 'cancellation.refundStatus': 'failed' },
                $push: {
                    orderNotes: {
                        note: `Refund could not be initiated: ${message}`,
                        addedBy: 'system',
                    },
                },
            }
        )
        .catch((err) => console.error('Failed to release refund claim:', err.message));
};

/**
 * Claim the refund and call the gateway. Exactly one concurrent caller reaches the gateway; the rest are told a refund is already in flight.
 *
 * @returns {{ok: true, refund: object}|{ok: false, code: string, message: string, status: number}}
 */
export const initiateClaimedRefund = async ({ orderId, amount, initiatedBy = 'system', reason, fromApproval = false }) => {
    const order = await claimRefund({ orderId, amount, initiatedBy, reason, fromApproval });

    if (!order) {
        // Either already refunded, in flight, or simply not refundable. Report it
        // as a conflict rather than guessing which.
        const current = await orderModel.findById(orderId).select('cancellation.refundStatus').lean();
        const status = current?.cancellation?.refundStatus;
        if (status === 'completed') {
            return { ok: false, code: 'ALREADY_REFUNDED', message: 'Refund already processed for this order', status: 400 };
        }
        if (status === 'processing') {
            return { ok: false, code: 'REFUND_IN_FLIGHT', message: 'A refund is already in progress', status: 409 };
        }
        if (status === 'pending_approval') {
            return { ok: false, code: 'REFUND_AWAITING_APPROVAL', message: 'This refund is awaiting approval', status: 409 };
        }
        return { ok: false, code: 'NOT_REFUNDABLE', message: 'This order cannot be refunded', status: 400 };
    }

    try {
        const result = await paymentService.refundPayment(
            order.paymentDetails.razorpayPaymentId,
            amount,
            { orderId: String(order._id), reason: reason || 'Order cancelled' }
        );

        if (!result?.success || !result.refund) {
            await releaseRefundClaim(order._id, result?.error || 'gateway declined');
            return { ok: false, code: 'GATEWAY_FAILED', message: 'Failed to initiate refund with payment gateway', status: 502, error: result?.error };
        }

        // Record the refund id. Status stays 'processing' until the gateway's
        // refund.processed webhook confirms the money actually moved.
        await orderModel.updateOne(
            { _id: order._id },
            {
                $set: { 'cancellation.refundId': result.refund.id },
                $push: { orderNotes: { note: `Refund initiated: ₹${amount}. Refund ID: ${result.refund.id}`, addedBy: 'system' } },
            }
        );

        return {
            ok: true,
            refund: {
                orderId: order._id,
                refundAmount: amount,
                refundId: result.refund.id,
                status: result.refund.status,
                expectedProcessingTime: '5-7 business days',
            },
        };
    } catch (error) {
        await releaseRefundClaim(order._id, error.message);
        return { ok: false, code: 'GATEWAY_FAILED', message: 'Failed to initiate refund with payment gateway', status: 502, error: error.message };
    }
};
