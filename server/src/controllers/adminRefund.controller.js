import orderModel from '../models/order.model.js';
import { decideRefundApproval } from '../services/refund.policy.js';
import { initiateClaimedRefund } from '../services/refund.service.js';

/**
 * Refunds that a partner cancellation left in pending_approval.
 */
export const getPendingRefunds = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

        const filter = { 'cancellation.refundStatus': 'pending_approval' };

        const [orders, total] = await Promise.all([
            orderModel
                .find(filter)
                .select('status pricing.totalAmount cancellation items user')
                .populate('user', 'firstName lastName email mobile')
                .populate('items.foodItem', 'name price')
                .populate('items.foodPartner', 'companyName email')
                .sort({ 'cancellation.cancelledAt': 1 }) // oldest first
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            orderModel.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            refunds: orders.map((o) => ({
                orderId: o._id,
                amount: o.cancellation.refundAmount,
                cancelledBy: o.cancellation.cancelledBy,
                cancelledAt: o.cancellation.cancelledAt,
                reason: o.cancellation.reason,
                orderStatus: o.status,
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
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error(`[req:${req.id}] getPendingRefunds error:`, error);
        res.status(500).json({ success: false, message: 'Failed to load pending refunds' });
    }
};

/**
 * Approve or reject a pending_approval refund.
 *
 * Approve claims the refund through the same atomic path as every other refund,
 * so a double-click still produces exactly one gateway call.
 */
export const decidePendingRefund = async (req, res) => {
    try {
        const { orderId } = req.params;
        const decision = req.body?.decision === 'reject' ? 'reject' : 'approve';
        const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const verdict = decideRefundApproval({ order, decision });
        if (!verdict.allowed) {
            return res.status(verdict.status).json({
                success: false,
                message: verdict.message,
                code: verdict.code,
            });
        }

        if (verdict.rejection) {
            // Declining is a deliberate outcome, not a processing error: the order
            // stays cancelled and the customer is told the refund was declined.
            order.cancellation.refundStatus = 'rejected';
            order.cancellation.refundInitiatedBy = 'admin';
            order.orderNotes.push({
                note: `Refund declined by admin${note ? `: ${note}` : ''}`,
                addedBy: 'system',
            });
            await order.save();

            return res.status(200).json({
                success: true,
                message: 'Refund declined',
                refund: { orderId: order._id, status: 'rejected' },
            });
        }

        const result = await initiateClaimedRefund({
            orderId: order._id,
            amount: verdict.amount,
            initiatedBy: 'admin',
            reason: note || 'Refund approved by admin',
            fromApproval: true,
        });

        if (!result.ok) {
            return res.status(result.status).json({
                success: false,
                message: result.message,
                code: result.code,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Refund approved and initiated',
            refund: result.refund,
        });
    } catch (error) {
        console.error(`[req:${req.id}] decidePendingRefund error:`, error);
        res.status(500).json({ success: false, message: 'Failed to process refund decision' });
    }
};

export default { getPendingRefunds, decidePendingRefund };
