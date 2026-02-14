import { emailLayout } from './layout.js';

export const orderConfirmationTemplate = (userName, orderDetails) => {
    const { orderId, items, total, deliveryAddress, estimatedTime } = orderDetails;
    
    const itemsList = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.name} x${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${item.price}</td>
        </tr>
    `).join('');

    const content = `
        <h2>Order Confirmed! 🎉</h2>
        <p>Hi ${userName},</p>
        
        <p>Your order has been successfully placed and is being prepared.</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Order ID:</strong> #${orderId}</p>
            <p style="margin: 10px 0 0 0;"><strong>Estimated Delivery:</strong> ${estimatedTime}</p>
        </div>

        <h3>Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
            ${itemsList}
            <tr>
                <td style="padding: 15px 10px; font-weight: bold; font-size: 16px;">Total</td>
                <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 16px;">₹${total}</td>
            </tr>
        </table>

        <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-radius: 5px;">
            <p style="margin: 0;"><strong>📍 Delivery Address:</strong></p>
            <p style="margin: 5px 0 0 0;">${deliveryAddress}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/orders/${orderId}" class="button">
                Track Your Order
            </a>
        </div>

        <p style="margin-top: 30px;">Thank you for choosing FoodReel!</p>
    `;

    return {
        subject: `Order Confirmed - #${orderId}`,
        html: emailLayout(content, 'Order Confirmation'),
        text: `Your order #${orderId} has been confirmed. Total: ₹${total}. Track at ${process.env.FRONTEND_URL}/orders/${orderId}`
    };
};