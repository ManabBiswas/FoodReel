import { emailLayout } from './layout.js';

export const partnerApprovedTemplate = (partnerName, businessName) => {
    const content = `
        <h2>Welcome to FoodReel Partner! 🎉</h2>
        <p>Hi ${partnerName},</p>
        
        <p>Great news! Your application for <strong>${businessName}</strong> has been approved. You're now a verified FoodReel Partner!</p>

        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;"><strong>✓ Your account is now active and ready to start selling</strong></p>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Set up your restaurant menu and food items</li>
            <li>Configure your delivery options and pricing</li>
            <li>Upload high-quality photos of your dishes</li>
            <li>Set your business hours and availability</li>
        </ul>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/partner/dashboard" class="button">
                Go to Partner Dashboard
            </a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Our support team is here to help. If you have any questions, visit our <a href="${process.env.FRONTEND_URL}/partner/help" style="color: #667eea;">Help Center</a>.
        </p>
    `;

    return {
        subject: `${businessName} is Now Approved on FoodReel! 🎉`,
        html: emailLayout(content, 'Partner Approved'),
        text: `Congratulations! ${businessName} has been approved. Start selling on FoodReel at ${process.env.FRONTEND_URL}/partner/dashboard`
    };
};
