import contactMessageModel from "../models/contactMessage.model.js";
import emailService from "../services/email.service.js";

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

// ============ ADMIN: CONTACT MESSAGE INBOX ============

/** GET /api/admin/contact-messages?status=new&page=1&limit=20 */
async function listContactMessages(req, res) {
    try {
        const { status } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

        const validStatuses = ['new', 'read', 'replied'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `status must be one of ${validStatuses.join(', ')}` });
        }

        const filter = status ? { status } : {};
        const [messages, total] = await Promise.all([
            contactMessageModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            contactMessageModel.countDocuments(filter)
        ]);

        res.status(200).json({ messages, pagination: { page, limit, total } });
    } catch (error) {
        console.error('List contact messages error:', error);
        res.status(500).json({ error: 'Failed to load contact messages' });
    }
}

/** PATCH /api/admin/contact-messages/:messageId/status */
async function updateContactMessageStatus(req, res) {
    try {
        const { messageId } = req.params;
        const { status } = req.body || {};

        if (!['new', 'read', 'replied'].includes(status)) {
            return res.status(400).json({ error: 'status must be one of new, read, replied' });
        }

        const contact = await contactMessageModel.findByIdAndUpdate(
            messageId,
            { status },
            { new: true }
        );
        if (!contact) {
            return res.status(404).json({ error: 'Contact message not found' });
        }

        res.status(200).json({ message: contact });
    } catch (error) {
        console.error('Update contact message status error:', error);
        res.status(500).json({ error: 'Failed to update contact message' });
    }
}

// POST /api/admin/contact-messages/:messageId/reply
async function replyToContactMessage(req, res) {
    try {
        const { messageId } = req.params;
        const { message } = req.body || {};

        if (!message?.trim()) {
            return res.status(400).json({ error: 'A reply message is required' });
        }

        const contact = await contactMessageModel.findById(messageId);
        if (!contact) {
            return res.status(404).json({ error: 'Contact message not found' });
        }

        await emailService.sendContactResponseEmail(
            contact.email,
            contact.name,
            'Re: your message to FoodReel',
            message.trim()
        );

        contact.status = 'replied';
        contact.repliedAt = new Date();
        await contact.save();

        res.status(200).json({ success: true, message: 'Reply sent', contact });
    } catch (error) {
        console.error('Reply to contact message error:', error);
        res.status(500).json({ error: 'Failed to send reply' });
    }
}

export { listContactMessages, updateContactMessageStatus, replyToContactMessage };