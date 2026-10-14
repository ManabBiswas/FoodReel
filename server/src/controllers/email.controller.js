import emailService from "../services/email.service.js";
import userModel from "../models/user.Model.js";
import foodPartnerModel from "../models/foodPartner.Model.js";
import { serverError } from "../utils/apiError.js";

// Arbitrary mail relay guard.
async function isKnownRecipient(address) {
    const normalized = String(address || '').trim().toLowerCase();
    if (!normalized) return false;
    const [user, partner] = await Promise.all([
        userModel.exists({ email: normalized }),
        foodPartnerModel.exists({ email: normalized })
    ]);
    return Boolean(user || partner);
}

const sendEmailController = async (req, res) => {
    const { to, subject, message, html } = req.body;
    try {
        if (!to || !subject || !message) {
            return res.status(400).json({ error: 'to, subject and message are required' });
        }

        // to may be a comma-separated list; every recipient must be known.
        const recipients = String(to).split(',').map((a) => a.trim()).filter(Boolean);
        const unknown = [];
        for (const address of recipients) {
            if (!(await isKnownRecipient(address))) unknown.push(address);
        }
        if (unknown.length > 0) {
            return res.status(400).json({
                error: 'Recipient must be an existing user or food partner',
                unknownRecipients: unknown
            });
        }

        await emailService.sendEmail(to, subject, message, html);
        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error('Send email error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

const sendWelcomeEmailController = async (req, res) => {
    const { email, name } = req.body;
    try {
        await emailService.sendWelcomeEmail(email, name);
        res.status(200).json({ success: true, message: 'Welcome email sent successfully' });
    } catch (error) {
        console.error('Send welcome email error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

const sendOrderConfirmationController = async (req, res) => {
    const { email, userName, orderDetails } = req.body;
    try {
        if (!email || !userName || !orderDetails) {
            return res.status(400).json({ error: 'Missing required fields: email, userName, orderDetails' });
        }
        await emailService.sendOrderConfirmationEmail(email, userName, orderDetails);
        res.status(200).json({ success: true, message: 'Order confirmation email sent successfully' });
    } catch (error) {
        console.error('Send order confirmation error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

const sendOrderCancelledController = async (req, res) => {
    const { email, userName, orderDetails } = req.body;
    try {
        if (!email || !userName || !orderDetails) {
            return res.status(400).json({ error: 'Missing required fields: email, userName, orderDetails' });
        }
        await emailService.sendOrderCancelledEmail(email, userName, orderDetails);
        res.status(200).json({ success: true, message: 'Order cancelled email sent successfully' });
    } catch (error) {
        console.error('Send order cancelled error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

const sendOrderShippedController = async (req, res) => {
    const { email, userName, orderDetails } = req.body;
    try {
        if (!email || !userName || !orderDetails) {
            return res.status(400).json({ error: 'Missing required fields: email, userName, orderDetails' });
        }
        await emailService.sendOrderShippedEmail(email, userName, orderDetails);
        res.status(200).json({ success: true, message: 'Order shipped email sent successfully' });
    } catch (error) {
        console.error('Send order shipped error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

const sendPasswordResetController = async (req, res) => {
    const { email, userName, resetLink } = req.body;
    try {
        if (!email || !userName || !resetLink) {
            return res.status(400).json({ error: 'Missing required fields: email, userName, resetLink' });
        }
        await emailService.sendPasswordResetEmail(email, userName, resetLink);
        res.status(200).json({ success: true, message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Send password reset error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

const sendPartnerApprovedController = async (req, res) => {
    const { email, partnerName, businessName } = req.body;
    try {
        if (!email || !partnerName || !businessName) {
            return res.status(400).json({ error: 'Missing required fields: email, partnerName, businessName' });
        }
        await emailService.sendPartnerApprovedEmail(email, partnerName, businessName);
        res.status(200).json({ success: true, message: 'Partner approved email sent successfully' });
    } catch (error) {
        console.error('Send partner approved error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

const sendPartnerRejectedController = async (req, res) => {
    const { email, partnerName, businessName, reason } = req.body;
    try {
        if (!email || !partnerName || !businessName) {
            return res.status(400).json({ error: 'Missing required fields: email, partnerName, businessName' });
        }
        await emailService.sendPartnerRejectedEmail(email, partnerName, businessName, reason);
        res.status(200).json({ success: true, message: 'Partner rejected email sent successfully' });
    } catch (error) {
        console.error('Send partner rejected error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

const sendContactResponseController = async (req, res) => {
    const { email, visitorName, subject, message } = req.body;
    try {
        if (!email || !visitorName || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields: email, visitorName, subject, message' });
        }
        await emailService.sendContactResponseEmail(email, visitorName, subject, message);
        res.status(200).json({ success: true, message: 'Contact response email sent successfully' });
    } catch (error) {
        console.error('Send contact response error:', error);
        serverError(res, error, 'Failed to send email');
    }
};

export default {
    sendEmailController,
    sendWelcomeEmailController,
    sendOrderConfirmationController,
    sendOrderCancelledController,
    sendOrderShippedController,
    sendPasswordResetController,
    sendPartnerApprovedController,
    sendPartnerRejectedController,
    sendContactResponseController,
};