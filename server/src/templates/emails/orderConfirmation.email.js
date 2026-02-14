import { emailLayout } from './layout.js';

export const orderConfirmationTemplate = (userName, orderDetails) => {
    const { orderId, items = [], itemTotal = 0, deliveryFee = 0, platformFee = 0, gst = 0, grandTotal = 0, deliveryAddress, estimatedTime } = orderDetails;
    
    const itemsList = items.map(item => {
        const itemTotalPrice = (item.price && item.quantity) ? (item.price * item.quantity).toFixed(2) : 'N/A';
        return `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.name || 'Item'} x${item.quantity || 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${itemTotalPrice}</td>
        </tr>
    `;
    }).join('');

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
            <thead>
                <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e0e0e0;">Item</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e0e0e0;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${itemsList}
            </tbody>
        </table>

        <div style="margin-top: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <table style="width: 100%;">
                <tr>
                    <td style="padding: 8px 0;"><strong>Item Total:</strong></td>
                    <td style="text-align: right; padding: 8px 0;">₹${typeof itemTotal === 'number' ? itemTotal.toFixed(2) : itemTotal}</td>
                </tr>
                ${deliveryFee > 0 ? `
                <tr>
                    <td style="padding: 8px 0;">Delivery Fee:</td>
                    <td style="text-align: right; padding: 8px 0;">₹${typeof deliveryFee === 'number' ? deliveryFee.toFixed(2) : deliveryFee}</td>
                </tr>
                ` : ''}
                ${platformFee > 0 ? `
                <tr>
                    <td style="padding: 8px 0;">Platform Fee:</td>
                    <td style="text-align: right; padding: 8px 0;">₹${typeof platformFee === 'number' ? platformFee.toFixed(2) : platformFee}</td>
                </tr>
                ` : ''}
                ${gst > 0 ? `
                <tr>
                    <td style="padding: 8px 0;">GST (5%):</td>
                    <td style="text-align: right; padding: 8px 0;">₹${typeof gst === 'number' ? gst.toFixed(2) : gst}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e0e0e0;">
                    <td style="padding: 12px 0;"><strong style="font-size: 16px;">Grand Total:</strong></td>
                    <td style="text-align: right; padding: 12px 0;"><strong style="font-size: 16px; color: #667eea;">₹${typeof grandTotal === 'number' ? grandTotal.toFixed(2) : grandTotal}</strong></td>
                </tr>
            </table>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-radius: 5px;">
            <p style="margin: 0;"><strong>📍 Delivery Address:</strong></p>
            <p style="margin: 5px 0 0 0;\">${deliveryAddress}</p>
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
        text: `Your order #${orderId} has been confirmed. Item Total: ₹${itemTotal}, Delivery: ₹${deliveryFee}, Platform Fee: ₹${platformFee}, GST: ₹${gst}, Grand Total: ₹${grandTotal}. Track at ${process.env.FRONTEND_URL}/orders/${orderId}`
    };
};