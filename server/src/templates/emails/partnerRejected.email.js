import { emailLayout } from './layout.js';

export const partnerRejectedTemplate = (partnerName, businessName, reason) => {
    const content = `
        <h2>Application Status Update</h2>
        <p>Hi ${partnerName},</p>
        
        <p>Thank you for submitting your application for <strong>${businessName}</strong> to FoodReel. After careful review, we're unable to approve your application at this time.</p>

        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0;"><strong>Reason for Rejection:</strong></p>
            <p style="margin: 10px 0 0 0;">${reason || 'Please refer to the detailed feedback in the application portal.'}</p>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This decision is not final. You can reapply with the necessary improvements. We recommend reviewing the feedback carefully and addressing the concerns mentioned.
        </p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/partner/reapply" class="button">
                Reapply with Improvements
            </a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If you have questions about the decision, please contact our support team at support@foodreel.com
        </p>
    `;

    return {
        subject: `Application Status for ${businessName}`,
        html: emailLayout(content, 'Application Update'),
        text: `Your application for ${businessName} has been reviewed. Please check your application portal for detailed feedback.`
    };
};
