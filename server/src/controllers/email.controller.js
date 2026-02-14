import emailService from "../services/email.service.js";

const sendEmailController = async (req, res) => {
    const { to, subject, message, html } = req.body;
    try {
        await emailService.sendEmail(to, subject, message, html);
        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to send email" });
    }
};

const sendWelcomeEmailController = async (req, res) => {
    const { email, name } = req.body;
    try {
        await emailService.sendWelcomeEmail(email, name);
        res.status(200).json({ success: true, message: 'Welcome email sent successfully' });
    } catch (error) {
        console.error('Send welcome email error:', error);
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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