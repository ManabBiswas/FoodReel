import { emailLayout } from './layout.js';

export const contactResponseTemplate = (visitorName, subject, message) => {
    const content = `
        <h2>We Received Your Message! 📨</h2>
        <p>Hi ${visitorName},</p>
        
        <p>Thank you for reaching out to FoodReel. We've received your message and our team will review it shortly.</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 10px 0 0 0;"><strong>Message:</strong></p>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Our support team typically responds within 24-48 hours. If your matter is urgent, please mention it in your message.
        </p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/contact" class="button">
                Send Another Message
            </a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            You can also track your support ticket and view responses in your account dashboard.
        </p>
    `;

    return {
        subject: `We Received Your Message - ${subject}`,
        html: emailLayout(content, 'Contact Confirmation'),
        text: `Thank you for contacting FoodReel. We've received your message and will respond soon.`
    };
};
