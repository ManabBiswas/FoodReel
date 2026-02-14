import nodemailer from "nodemailer";
import emailTemplates from "../templates/emails/index.js";

let transporter = null;

const getEmailConfig = () => {
    const service = process.env.EMAIL_SERVICE || "gmail";
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new Error("Email credentials are missing. Set EMAIL_USER and EMAIL_PASS.");
    }

    return { service, user, pass };
};

const createTransporter = () => {
    const { service, user, pass } = getEmailConfig();
    transporter = nodemailer.createTransport({
        service,
        auth: { user, pass },
    });
    return transporter;
};

// Initialize transporter on startup
if (!transporter) {
    try {
        createTransporter();
    } catch (error) {
        console.error('Failed to initialize email transporter:', error.message);
    }
}

export const sendEmail = async (email, subject, message, html) => {
    try {
        const transporter = createTransporter();
        const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

        const mailOptions = {
            from,
            to: email,
            subject,
            text: message,
            ...(html ? { html } : {}),
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        throw new Error(`Email failed: ${error.message}`);
    }
};

export const sendWelcomeEmail = async (userEmail, userName) => {
    const { subject, html, text } = emailTemplates.welcomeEmail(userName, userEmail);
    await sendEmail(userEmail, subject, text, html);
};

const sendPasswordResetEmail = async (userEmail, userName, resetLink) => {
    const { subject, html, text } = emailTemplates.passwordResetTemplate(userName, resetLink);
    await sendEmail(userEmail, subject, text, html);
};

const sendOrderConfirmationEmail = async (userEmail, userName, orderDetails) => {
    const { subject, html, text } = emailTemplates.orderConfirmationTemplate(userName, orderDetails);
    await sendEmail(userEmail, subject, text, html);
};

const sendOrderCancelledEmail = async (userEmail, userName, orderDetails) => {
    const { subject, html, text } = emailTemplates.orderCancelledTemplate(userName, orderDetails);
    await sendEmail(userEmail, subject, text, html);
};

const sendOrderShippedEmail = async (userEmail, userName, orderDetails) => {
    const { subject, html, text } = emailTemplates.orderShippedTemplate(userName, orderDetails);
    await sendEmail(userEmail, subject, text, html);
};

const sendPartnerApprovedEmail = async (partnerEmail, partnerName, businessName) => {
    const { subject, html, text } = emailTemplates.partnerApprovedTemplate(partnerName, businessName);
    await sendEmail(partnerEmail, subject, text, html);
};

const sendPartnerRejectedEmail = async (partnerEmail, partnerName, businessName, reason) => {
    const { subject, html, text } = emailTemplates.partnerRejectedTemplate(partnerName, businessName, reason);
    await sendEmail(partnerEmail, subject, text, html);
};

const sendContactResponseEmail = async (visitorEmail, visitorName, subject, message) => {
    const { subject: emailSubject, html, text } = emailTemplates.contactResponseTemplate(visitorName, subject, message);
    await sendEmail(visitorEmail, emailSubject, text, html);
};

// Export all email service functions as an object for easy extension
export default {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendOrderCancelledEmail,
    sendOrderShippedEmail,
    sendPartnerApprovedEmail,
    sendPartnerRejectedEmail,
    sendContactResponseEmail,
};