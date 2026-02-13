import nodemailer from "nodemailer";
import { welcomeEmail } from "../templates/emails/welcome.email.js";

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

    return nodemailer.createTransport({
        service,
        auth: { user, pass },
    });
};

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
    const { subject, html, text } = welcomeEmail(userName, userEmail);
    await sendEmail(userEmail, subject, text, html);
};