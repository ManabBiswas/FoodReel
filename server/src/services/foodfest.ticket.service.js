import FoodFestTicket from "../models/FoodFestTicket.model.js";
import FoodFestTier from "../models/FoodFestTier.model.js";
import FoodFestEvent from "../models/FoodFestEvent.model.js";
import qrService from "../services/foodfest.qr.service.js";
import emailService from "../services/email.service.js";

export const finalizeTicketPayment = async (razorpayOrderId, paymentId, signature) => {
    try {
        // 1. Find ticket by razorpayOrderId
        const ticket = await FoodFestTicket.findOne({ "paymentDetails.razorpayOrderId": razorpayOrderId });
        
        if (!ticket) {
            console.log(`No FoodFestTicket found for razorpayOrderId: ${razorpayOrderId}`);
            return { success: false, message: "Ticket not found" };
        }

        if (ticket.status === 'valid') {
            return { success: true, message: "Ticket already valid" };
        }

        // 2. Update ticket status and payment details
        ticket.status = 'valid';
        ticket.paymentDetails.razorpayPaymentId = paymentId;
        ticket.paymentDetails.razorpaySignature = signature;
        ticket.paymentDetails.paidAt = new Date();

        // 3. Update Tier inventory: decremented reserved, increment sold
        const tier = await FoodFestTier.findByIdAndUpdate(
            ticket.tierId,
            { $inc: { reserved: -1, sold: 1 } },
            { new: true }
        );

        // 4. Generate QR Token and Image
        const event = await FoodFestEvent.findById(ticket.eventId);
        const qrToken = qrService.generateQRToken(ticket._id, event._id, event.endTime);
        const qrImageUrl = await qrService.createQRImage(qrToken);

        ticket.qrToken = qrToken;
        ticket.qrImageUrl = qrImageUrl;

        await ticket.save();

        // 5. Send Confirmation Email (Non-blocking)
        try {
            await emailService.sendEmail(
                ticket.user.email, // Note: needs populate or fetch user
                "Your FoodFest Ticket is Ready!",
                `Your ticket for ${event.name} has been verified. You can access your QR ticket here: ${qrImageUrl}`
            );
        } catch (e) {
            console.error("Confirmation email failed:", e);
        }

        return { success: true, ticket };
    } catch (error) {
        console.error("Finalize ticket payment error:", error);
        throw error;
    }
};
