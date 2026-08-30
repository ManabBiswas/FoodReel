import FoodFestStallApplication from "../models/FoodFestStallApplication.model.js";
import emailService from "../../services/email.service.js";

export const getApplicationsByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const applications = await FoodFestStallApplication.find({ eventId })
            .populate('foodPartner', 'companyName email mobile');
        
        res.status(200).json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const approveApplication = async (req, res) => {
    try {
        const { appId } = req.params;
        const application = await FoodFestStallApplication.findByIdAndUpdate(
            appId,
            { 
                status: 'approved', 
                reviewedAt: new Date(), 
                reviewedBy: req.admin._id 
            },
            { new: true }
        ).populate('foodPartner', 'email companyName');

        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        // Send notification email
        try {
            await emailService.sendEmail(
                application.foodPartner.email,
                "Your FoodFest Stall Application was Approved!",
                `Congratulations ${application.foodPartner.companyName}, your application for the food festival has been approved. You can now toggle your stall to 'open' once you are set up on the event day.`
            );
        } catch (emailErr) {
            console.error("Notification email failed:", emailErr);
        }

        res.status(200).json({ success: true, message: "Application approved successfully", application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectApplication = async (req, res) => {
    try {
        const { appId } = req.params;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ success: false, message: "Rejection reason is required" });

        const application = await FoodFestStallApplication.findByIdAndUpdate(
            appId,
            { 
                status: 'rejected', 
                reviewedAt: new Date(), 
                reviewedBy: req.admin._id,
                rejectionReason: reason
            },
            { new: true }
        ).populate('foodPartner', 'email companyName');

        if (!application) return res.status(404).json({ success: false, message: "Application not found" });

        // Send notification email
        try {
            await emailService.sendEmail(
                application.foodPartner.email,
                "Update on your FoodFest Stall Application",
                `Hello ${application.foodPartner.companyName}, unfortunately, your application was not approved at this time. Reason: ${reason}`
            );
        } catch (emailErr) {
            console.error("Notification email failed:", emailErr);
        }

        res.status(200).json({ success: true, message: "Application rejected successfully", application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
