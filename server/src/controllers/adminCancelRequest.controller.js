import orderModel from '../models/order.model.js';
import emailService from '../services/email.service.js';
import { decideCancelRequestDecision, RESUME_STATUS } from '../services/cancelRequest.policy.js';
import { decideRefundOnCancellation, OUTCOME } from '../services/refund.policy.js';
import { initiateClaimedRefund } from '../services/refund.service.js';

/**
 * The queue of partner cancellation requests waiting for an admin decision.
 */
export const getPendingCancelRequests = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

        const filter = { status: 'cancel_requested', 'cancelRequest.status': 'pending' };

        const [orders, total] = await Promise.all([
            orderModel
                .find(filter)
                .select('status cancelRequest cancellation pricing.totalAmount items user createdAt')
                .populate('user', 'firstName lastName email mobile')
                .populate('items.foodItem', 'name price')
                .populate('items.foodPartner', 'companyName email')
                .sort({ 'cancelRequest.requestedAt': 1 }) // oldest first
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            orderModel.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            requests: orders.map((o) => ({
                orderId: o._id,
                status: o.status,
                reason: o.cancelRequest?.reason,
                details: o.cancelRequest?.details,
                requestedAt: o.cancelRequest?.requestedAt,
                amount: o.pricing?.totalAmount ?? 0,
                customer: o.user
                    ? {
                        name: `${o.user.firstName || ''} ${o.user.lastName || ''}`.trim(),
                        email: o.user.email,
                        mobile: o.user.mobile,
                    }
                    : null,
                items: (o.items || []).map((i) => ({
                    name: i.foodItem?.name || 'Item',
                    quantity: i.quantity,
                })),
                partner: (o.items || []).map((i) => i.foodPartner?.companyName).filter(Boolean).join(', '),
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error(`[req:${req.id}] getPendingCancelRequests error:`, error);
        res.status(500).json({ success: false, message: 'Failed to load cancellation requests' });
    }
};

/**
 * Approve or reject a pending partner cancellation request.
 */
export const decideCancelRequest = async (req, res) => {
    try {
        const { orderId } = req.params;

        const decision = req.body?.decision;
        if (decision !== 'approve' && decision !== 'reject') {
            return res.status(400).json({
                success: false,
                message: 'Decision must be either approve or reject',
                code: 'INVALID_DECISION'
            });
        }

        const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : '';

        const order = await orderModel.findById(orderId)
            .populate('user', 'firstName lastName email mobile')
            .populate('items.foodItem', 'name price')
            .populate('items.foodPartner', 'companyName email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const verdict = decideCancelRequestDecision({ order, decision });
        if (!verdict.allowed) {
            return res.status(verdict.status).json({
                success: false,
                message: verdict.message,
                code: verdict.code,
            });
        }

        const adminId = req.admin?._id?.toString();

        // Claim the request atomically. Two admins clicking Approve at the same
        // moment must not both cancel the order and both refund it.
        const claimed = await orderModel.findOneAndUpdate(
            { _id: orderId, status: 'cancel_requested', 'cancelRequest.status': 'pending' },
            {
                $set: {
                    'cancelRequest.status': verdict.rejection ? 'rejected' : 'approved',
                    'cancelRequest.decidedAt': new Date(),
                    'cancelRequest.decidedBy': 'admin',
                    'cancelRequest.decisionNote': note
                        || (verdict.rejection
                            ? 'Request rejected — please proceed with the order'
                            : order.cancelRequest.reason)
                }
            },
            { new: true }
        );

        if (!claimed) {
            return res.status(409).json({
                success: false,
                message: 'This request was already decided by another admin',
                code: 'REQUEST_ALREADY_DECIDED'
            });
        }

        // Work from the claimed document so the write below cannot clobber a
        // concurrent decision.
        order.cancelRequest.status = claimed.cancelRequest.status;
        order.cancelRequest.decidedAt = claimed.cancelRequest.decidedAt;
        order.cancelRequest.decidedBy = 'admin';
        order.cancelRequest.decisionNote = claimed.cancelRequest.decisionNote;

        if (verdict.rejection) {
            // The order goes back to being prepared. Nothing is cancelled and
            // no money moves.
            order.status = order.cancelRequest.previousStatus || RESUME_STATUS;
            order.statusTimestamps = order.statusTimestamps || {};
            order.statusTimestamps.cancelRequestedAt = undefined;

            order.orderNotes.push({
                note: `Cancellation request rejected by admin${note ? `: ${note}` : ''}. The order must be prepared and delivered.`,
                addedBy: 'system'
            });

            await order.save();

            return res.status(200).json({
                success: true,
                message: 'Cancellation request rejected. The order is back in preparation.',
                order,
            });
        }

        // Approving cancels the order. The admin is the one authorising it, so
        // the refund is released automatically rather than parked for a second
        // approval.
        const refundDecision = decideRefundOnCancellation({ order, actor: 'admin' });

        order.cancellation = {
            isCancelled: true,
            // The restaurant is the one that cannot serve the food, so this is
            // what the customer is told. The admin's approval is recorded on
            // cancelRequest.decidedBy and in the order notes.
            cancelledBy: 'partner',
            cancelledAt: new Date(),
            reason: order.cancelRequest.reason || 'Cancelled by food partner (approved by admin)',
            refundStatus: refundDecision.refundStatus,
            refundAmount: refundDecision.amount
        };
        order.status = 'cancelled';
        order.statusTimestamps = order.statusTimestamps || {};
        order.statusTimestamps.cancelledAt = new Date();

        order.orderNotes.push({
            note: `Cancellation request approved by admin${note ? `: ${note}` : ''}. Reason: ${order.cancelRequest.reason || 'Not specified'}`,
            addedBy: 'system'
        });

        await order.save();

        // The admin's approval is the approval the refund was waiting for, so
        // it is claimed through the same atomic path as every other refund.
        // fromApproval is false: this order's refundStatus is 'pending' (the
        // admin path auto-refunds), not the 'pending_approval' that a direct
        // partner cancellation parks it in.
        let refundResult = null;
        if (refundDecision.outcome === OUTCOME.AUTO_REFUND) {
            const initiated = await initiateClaimedRefund({
                orderId: order._id,
                amount: refundDecision.amount,
                initiatedBy: 'admin',
                reason: order.cancellation.reason
            });
            if (initiated.ok) {
                refundResult = initiated.refund;
            } else {
                console.error(`[req:${req.id}] Refund failed for approved cancel request ${order._id}: ${initiated.code} ${initiated.message}`);
            }
        }

        // Tell the customer their order was cancelled and their money is on
        // the way back.
        if (order.user?.email) {
            const orderDetails = {
                orderId: order._id,
                items: order.items.map(item => ({
                    name: item.foodItem?.name || 'Food Item',
                    quantity: item.quantity,
                    price: item.priceAtOrder
                })),
                totalAmount: order.pricing?.grandTotal || order.pricing?.totalAmount,
                reason: order.cancellation.reason,
                cancelledBy: 'partner',
                cancelledAt: order.cancellation.cancelledAt,
                refundStatus: order.cancellation.refundStatus,
                refundAmount: order.cancellation.refundAmount
            };
            emailService.sendOrderCancelledEmail(
                order.user.email,
                order.user.firstName,
                orderDetails
            ).catch(err => console.error('Failed to send order cancelled email:', err.message));
        }

        return res.status(200).json({
            success: true,
            message: refundResult
                ? 'Cancellation approved and refund initiated'
                : 'Cancellation approved',
            order,
            refundInfo: order.cancellation.refundStatus !== 'not_applicable'
                ? { status: order.cancellation.refundStatus, amount: order.cancellation.refundAmount }
                : null
        });
    } catch (error) {
        console.error(`[req:${req.id}] decideCancelRequest error:`, error);
        res.status(500).json({ success: false, message: 'Failed to process cancellation decision' });
    }
};

export default { getPendingCancelRequests, decideCancelRequest };
