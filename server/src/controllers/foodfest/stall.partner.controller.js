import FoodFestEvent from "../models/FoodFestEvent.model.js";
import FoodFestStallApplication from "../models/FoodFestStallApplication.model.js";
import foodModel from "../models/food.model.js";
import emailService from "../../services/email.service.js";

export const getAvailableEvents = async (req, res) => {
    try {
        const partnerId = req.foodPartner._id;
        
        // Find events that are published and not applied to by this partner
        const appliedEventIds = await FoodFestStallApplication.find({ foodPartner: partnerId }).distinct('eventId');
        
        const events = await FoodFestEvent.find({ 
            status: 'published',
            _id: { $nin: appliedEventIds }
        }).select('name description venue startTime endTime');

        res.status(200).json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const applyForStall = async (req, res) => {
    try {
        const { eventId, proposedItems } = req.body;
        const partnerId = req.foodPartner._id;

        if (!eventId || !proposedItems || !Array.isArray(proposedItems)) {
            return res.status(400).json({ success: false, message: "eventId and proposedItems (array) are required" });
        }

        // Validate that all proposed items belong to the partner and are actual food items
        const items = await foodModel.find({ _id: { $in: proposedItems } });
        if (items.length !== proposedItems.length) {
            return res.status(400).json({ success: false, message: "Some proposed food items were not found" });
        }

        const invalidItems = items.filter(item => item.foodPartner.toString() !== partnerId.toString() || item.postType !== 'food');
        if (invalidItems.length > 0) {
            return res.status(400).json({ success: false, message: "You can only apply with your own food posts" });
        }

        const application = await FoodFestStallApplication.create({
            eventId,
            foodPartner: partnerId,
            proposedItems,
            status: 'pending'
        });

        res.status(201).json({ success: true, message: "Application submitted successfully", application });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "You have already applied for a stall at this event" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleStallOpen = async (req, res) => {
    try {
        const { stallId } = req.params;
        const partnerId = req.foodPartner._id;

        const application = await FoodFestStallApplication.findOne({ _id: stallId, foodPartner: partnerId });
        if (!application) return res.status(404).json({ success: false, message: "Stall application not found" });
        if (application.status !== 'approved') {
            return res.status(400).json({ success: false, message: "Only approved stalls can be toggled open" });
        }

        application.isOpen = !application.isOpen;
        await application.save();

        res.status(200).json({ success: true, isOpen: application.isOpen });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyApplications = async (req, res) => {
    try {
        const partnerId = req.foodPartner._id;
        const applications = await FoodFestStallApplication.find({ foodPartner: partnerId })
            .populate('eventId', 'name startTime endTime status');
        
        res.status(200).json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
