import FoodFestStallApplication from "../../models/FoodFestStallApplication.model.js";
import { serverFail } from "../../utils/apiError.js";
import emailService from "../../services/email.service.js";

/**
 * Shared approve/reject used by the admin and organizer endpoints.
 */
export const decideApplication = async ({ appId, decision, actorId, reason }) => {
    if (decision === 'rejected' && !reason) {
        return { status: 400, message: "Rejection reason is required" };
    }

    const application = await FoodFestStallApplication.findByIdAndUpdate(
        appId,
        {
            status: decision,
            reviewedAt: new Date(),
            reviewedBy: actorId,
            ...(decision === 'rejected' ? { rejectionReason: reason } : {})
        },
        { new: true }
    ).populate('foodPartner', 'email companyName');

    if (!application) return { status: 404, message: "Application not found" };

    try {
        if (decision === 'approved') {
            await emailService.sendEmail(
                application.foodPartner.email,
                "Your FoodFest Stall Application was Approved!",
                `Congratulations ${application.foodPartner.companyName}, your application for the food festival has been approved. You can now toggle your stall to 'open' once you are set up on the event day.`
            );
        } else {
            await emailService.sendEmail(
                application.foodPartner.email,
                "Update on your FoodFest Stall Application",
                `Hello ${application.foodPartner.companyName}, unfortunately, your application was not approved at this time. Reason: ${reason}`
            );
        }
    } catch (emailErr) {
        console.error("Notification email failed:", emailErr);
    }

    return {
        status: 200,
        message: decision === 'approved' ? "Application approved successfully" : "Application rejected successfully",
        application
    };
};

export const getApplicationsByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const applications = await FoodFestStallApplication.find({ eventId })
            .populate('foodPartner', 'companyName email mobile');

        res.status(200).json({ success: true, applications });
    } catch (error) {
        serverFail(res, error);
    }
};

export const approveApplication = async (req, res) => {
    try {
        const result = await decideApplication({
            appId: req.params.appId,
            decision: 'approved',
            actorId: req.admin._id
        });
        if (result.status !== 200) {
            return res.status(result.status).json({ success: false, message: result.message });
        }
        res.status(200).json({ success: true, message: result.message, application: result.application });
    } catch (error) {
        serverFail(res, error);
    }
};

export const rejectApplication = async (req, res) => {
    try {
        const result = await decideApplication({
            appId: req.params.appId,
            decision: 'rejected',
            actorId: req.admin._id,
            reason: req.body?.reason
        });
        if (result.status !== 200) {
            return res.status(result.status).json({ success: false, message: result.message });
        }
        res.status(200).json({ success: true, message: result.message, application: result.application });
    } catch (error) {
        serverFail(res, error);
    }
};
