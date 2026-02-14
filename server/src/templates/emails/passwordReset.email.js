import { emailLayout } from './layout.js';

export const passwordResetTemplate = (userName, resetLink) => {
    const content = `
        <h2>Reset Your Password 🔑</h2>
        <p>Hi ${userName},</p>
        
        <p>We received a request to reset your FoodReel password. Click the button below to set a new password.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button">
                Reset Password
            </a>
        </div>

        <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">
            ${resetLink}
        </p>

        <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px;"><strong>⏰ Important:</strong> This link expires in 1 hour.</p>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If you didn't request a password reset, you can safely ignore this email. Your account is secure.
        </p>
    `;

    return {
        subject: 'Reset Your FoodReel Password',
        html: emailLayout(content, 'Password Reset'),
        text: `Click here to reset your password: ${resetLink}. This link expires in 1 hour.`
    };
};
