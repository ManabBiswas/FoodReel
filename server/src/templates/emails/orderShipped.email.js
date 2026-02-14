import { emailLayout } from './layout.js';

export const orderShippedTemplate = (userName, orderDetails) => {
    const { orderId, partnerId, partnerName, estimatedDelivery, trackingUrl } = orderDetails;
    
    const content = `
        <h2>Order Shipped 🚚</h2>
        <p>Hi ${userName},</p>
        
        <p>Good news! Your order is now on its way to you.</p>

        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0056b3;">
            <p style="margin: 0;"><strong>Order ID:</strong> #${orderId}</p>
            <p style="margin: 10px 0 0 0;"><strong>Partner:</strong> ${partnerName}</p>
            <p style="margin: 10px 0 0 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${trackingUrl || process.env.FRONTEND_URL + '/orders/' + orderId}" class="button">
                Track Your Order
            </a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            You'll receive a notification once your order is delivered. Thank you for choosing FoodReel!
        </p>
    `;

    return {
        subject: `Order Shipped - #${orderId}`,
        html: emailLayout(content, 'Order Shipped'),
        text: `Your order #${orderId} has been shipped! Estimated delivery: ${estimatedDelivery}. Track at ${process.env.FRONTEND_URL}/orders/${orderId}`
    };
};
