import { emailLayout } from './layout.js';

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export const orderCancelledTemplate = (userName, orderDetails) => {
    const { orderId, reason, refundAmount, cancelledAt, refundStatus, cancelledBy } = orderDetails;

    // A refund only exists for online payments that were actually captured.
    const hasRefund = refundStatus && refundStatus !== 'not_applicable' && Number(refundAmount) > 0;
    const cancelledOn = cancelledAt ? new Date(cancelledAt).toLocaleDateString('en-IN') : '—';
    const whoLabel = cancelledBy === 'partner' ? 'the restaurant' : 'you';

    const refundBlock = hasRefund
        ? `
        <p><strong>Refund Details:</strong></p>
        <p>Amount: <strong style="color: #28a745;">₹${escapeHtml(refundAmount)}</strong></p>
        <p style="font-size: 14px; color: #666;">The refund will be processed to your original payment method within 5-7 business days.</p>`
        : `
        <p style="font-size: 14px; color: #666;">No payment was captured for this order, so there is nothing to refund.</p>`;

    const content = `
        <h2>Order Cancelled ❌</h2>
        <p>Hi ${escapeHtml(userName)},</p>

        <p>Unfortunately, your order #${escapeHtml(orderId)} has been cancelled by ${whoLabel}.</p>

        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>Cancellation Reason:</strong></p>
            <p style="margin: 5px 0 0 0;">${escapeHtml(reason || 'Not specified')}</p>
        </div>
        ${refundBlock}

        <p style="font-size: 14px; margin-top: 20px;">Cancelled on: ${escapeHtml(cancelledOn)}</p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/orders" class="button">
                View All Orders
            </a>
        </div>

        <p style="margin-top: 30px;">We apologize for any inconvenience. If you have any questions, please contact our support team.</p>
    `;

    const refundLine = hasRefund
        ? `A refund of ₹${refundAmount} will be processed within 5-7 business days.`
        : 'No refund was required for this order.';

    return {
        subject: `Order Cancelled - #${orderId}`,
        html: emailLayout(content, 'Order Cancelled'),
        text: `Your order #${orderId} has been cancelled. Reason: ${reason || 'Not specified'}. ${refundLine}`
    };
};
