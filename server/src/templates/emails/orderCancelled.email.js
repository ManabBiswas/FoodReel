import { emailLayout } from './layout.js';

export const orderCancelledTemplate = (userName, orderDetails) => {
    const { orderId, reason, refundAmount, cancelledAt } = orderDetails;
    
    const content = `
        <h2>Order Cancelled ❌</h2>
        <p>Hi ${userName},</p>
        
        <p>Unfortunately, your order #${orderId} has been cancelled.</p>

        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>Cancellation Reason:</strong></p>
            <p style="margin: 5px 0 0 0;">${reason || 'Not specified'}</p>
        </div>

        <p><strong>Refund Details:</strong></p>
        <p>Amount: <strong style="color: #28a745;">₹${refundAmount || 'N/A'}</strong></p>
        <p style="font-size: 14px; color: #666;">The refund will be processed to your original payment method within 5-7 business days.</p>

        <p style="font-size: 14px; margin-top: 20px;">Cancelled on: ${new Date(cancelledAt).toLocaleDateString()}</p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/orders" class="button">
                View All Orders
            </a>
        </div>

        <p style="margin-top: 30px;">We apologize for any inconvenience. If you have any questions, please contact our support team.</p>
    `;

    return {
        subject: `Order Cancelled - #${orderId}`,
        html: emailLayout(content, 'Order Cancelled'),
        text: `Your order #${orderId} has been cancelled. Refund of ₹${refundAmount} will be processed within 5-7 days.`
    };
};
