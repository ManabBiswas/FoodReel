import EventProposal from "../../models/EventProposal.model.js";
import FoodFestEvent from "../../models/FoodFestEvent.model.js";
import "../../models/user.Model.js";
import { serverFail } from "../../utils/apiError.js";
import { validateEventWindow } from "../../utils/eventDates.js";
import mongoose from "mongoose";

//POST /api/foodfest/user/proposals - Regular user submits an event proposal for admin review.

export const createUserProposal = async (req, res) => {
    try {
        const {
            name,
            description,
            venue,
            startTime,
            endTime,
            salesStart,
            salesEnd,
            bannerImage,
            otherInfo
        } = req.body;

        if (!name || !venue?.address || !venue?.city || !venue?.gpsLoc || !startTime || !endTime || !salesStart || !salesEnd) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, venue(address, city, gpsLoc), startTime, endTime, salesStart, salesEnd"
            });
        }

        const dateError = validateEventWindow({ startTime, endTime, salesStart, salesEnd });
        if (dateError) {
            return res.status(400).json({ success: false, message: dateError });
        }

        const proposal = await EventProposal.create({
            user: req.user._id,
            name,
            description,
            venue: {
                address: venue.address,
                city: venue.city,
                gpsLoc: venue.gpsLoc,
                maxCapacity: venue.maxCapacity
            },
            startTime,
            endTime,
            salesStart,
            salesEnd,
            bannerImage,
            otherInfo
        });

        res.status(201).json({
            success: true,
            message: "Event proposal submitted successfully. Awaiting admin review.",
            proposal
        });
    } catch (error) {
        console.error("Create proposal error:", error);
        serverFail(res, error);
    }
};

// GET /api/foodfest/user/my-proposals - A logged-in user retrieves their own proposals with status.
export const getMyProposals = async (req, res) => {
    try {
        const proposals = await EventProposal.find({ user: req.user._id })
            .select('name venue startTime endTime status eventId createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            proposals
        });
    } catch (error) {
        console.error("Get my proposals error:", error);
        serverFail(res, error);
    }
};

// GET /api/foodfest/admin/proposals - Admin retrieves all pending proposals.
export const getPendingProposals = async (req, res) => {
    try {
        const proposals = await EventProposal.find({ status: 'pending' })
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            proposals
        });
    } catch (error) {
        console.error("Get proposals error:", error);
        serverFail(res, error);
    }
};

// PATCH /api/foodfest/admin/proposals/:proposalId/approve. Admin approves a proposal and converts it into a draft FoodFest event owned by the submitting user.
export const approveProposal = async (req, res) => {
    try {
        const { proposalId } = req.params;

        if (!mongoose.isValidObjectId(proposalId)) {
            return res.status(404).json({ success: false, message: "Proposal not found" });
        }

        // Claim the proposal atomically so two admins cannot both approve it and create two events from the same submission.
        const proposal = await EventProposal.findOneAndUpdate(
            { _id: proposalId, status: 'pending' },
            { $set: { status: 'approved' } },
            { new: true }
        );

        if (!proposal) {
            const exists = await EventProposal.exists({ _id: proposalId });
            if (!exists) {
                return res.status(404).json({ success: false, message: "Proposal not found" });
            }
            return res.status(409).json({
                success: false,
                message: "This proposal has already been processed"
            });
        }

        let event;
        try {
            event = await FoodFestEvent.create({
                name: proposal.name,
                description: proposal.description,
                venue: {
                    address: proposal.venue.address,
                    city: proposal.venue.city,
                    gpsLoc: proposal.venue.gpsLoc,
                    maxCapacity: proposal.venue.maxCapacity
                },
                startTime: proposal.startTime,
                endTime: proposal.endTime,
                salesStart: proposal.salesStart,
                salesEnd: proposal.salesEnd,
                bannerImage: proposal.bannerImage,
                organizer: proposal.user,
                organizerType: 'user',
                organizerNotes: proposal.otherInfo,
                // Approval is the grant of organizing power: the user can now manage this event, its tiers, zones, and ticket sales.
                // TODO: multiple organizers
                organizerAccess: true,
                organizerAccessGrantedAt: new Date(),
                organizerAccessGrantedBy: req.admin._id,
                status: 'draft'
            });
        } catch (eventError) {
            // Roll the claim back so the proposal stays reviewable.
            await EventProposal.updateOne(
                { _id: proposal._id, status: 'approved' },
                { $set: { status: 'pending' } }
            );
            throw eventError;
        }

        proposal.eventId = event._id;
        proposal.reviewedBy = req.admin._id;
        proposal.reviewedAt = new Date();
        await proposal.save();

        res.status(201).json({
            success: true,
            message: "Proposal approved. Draft event created and organizer access granted.",
            event
        });
    } catch (error) {
        console.error("Approve proposal error:", error);
        serverFail(res, error);
    }
};

// PATCH /api/foodfest/admin/proposals/:proposalId/reject - Admin rejects a proposal.
export const rejectProposal = async (req, res) => {
    try {
        const { proposalId } = req.params;

        if (!mongoose.isValidObjectId(proposalId)) {
            return res.status(404).json({ success: false, message: "Proposal not found" });
        }

        const proposal = await EventProposal.findOneAndUpdate(
            { _id: proposalId, status: 'pending' },
            {
                $set: {
                    status: 'rejected',
                    reviewedBy: req.admin._id,
                    reviewedAt: new Date()
                }
            },
            { new: true }
        );

        if (!proposal) {
            const exists = await EventProposal.exists({ _id: proposalId });
            if (!exists) {
                return res.status(404).json({ success: false, message: "Proposal not found" });
            }
            return res.status(409).json({
                success: false,
                message: "This proposal has already been processed"
            });
        }

        res.status(200).json({
            success: true,
            message: "Proposal rejected"
        });
    } catch (error) {
        console.error("Reject proposal error:", error);
        serverFail(res, error);
    }
};