import contactMessageModel from "../models/contactMessage.model.js";

// Public contact form endpoint (Contact.jsx posts { name, email, message })
export const submitContactMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body || {};

        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return res.status(400).json({ error: "Name, email, and message are required" });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({ error: "Please provide a valid email address" });
        }

        await contactMessageModel.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim()
        });

        res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
        console.error("Submit contact message error:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
};
