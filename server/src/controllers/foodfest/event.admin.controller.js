import FoodFestEvent from "../models/FoodFestEvent.model.js";
import FoodFestZone from "../models/FoodFestZone.model.js";
import FoodFestTier from "../models/FoodFestTier.model.js";

export const createEvent = async (req, res) => {
    try {
        const { name, description, venue, startTime, endTime, salesStart, salesEnd, bannerImage } = req.body;

        if (!name || !venue?.address || !venue?.city || !startTime || !endTime || !salesStart || !salesEnd) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, venue(address, city), startTime, endTime, salesStart, salesEnd"
            });
        }

        const event = await FoodFestEvent.create({
            name,
            description,
            venue,
            startTime,
            endTime,
            salesStart,
            salesEnd,
            bannerImage,
            organizer: req.admin._id,
            status: 'draft'
        });

        res.status(201).json({
            success: true,
            message: "FoodFest event created successfully in draft status",
            event
        });
    } catch (error) {
        console.error("Create event error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await FoodFestEvent.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }
        res.status(200).json({ success: true, event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const updates = req.body;

        const event = await FoodFestEvent.findByIdAndUpdate(
            eventId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        res.status(200).json({ success: true, message: "Event updated successfully", event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await FoodFestEvent.findByIdAndDelete(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }
        // Cascade delete zones and tiers
        await FoodFestZone.deleteMany({ eventId });
        await FoodFestTier.deleteMany({ eventId });

        res.status(200).json({ success: true, message: "Event and associated zones/tiers deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createZone = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { name, capacity, warningThreshold, criticalThreshold, tracksExit } = req.body;

        const zone = await FoodFestZone.create({
            eventId,
            name,
            capacity,
            warningThreshold,
            criticalThreshold,
            tracksExit
        });

        res.status(201).json({ success: true, zone });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const zone = await FoodFestZone.findByIdAndUpdate(zoneId, req.body, { new: true });
        if (!zone) return res.status(404).json({ success: false, message: "Zone not found" });
        res.status(200).json({ success: true, zone });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const zone = await FoodFestZone.findByIdAndDelete(zoneId);
        if (!zone) return res.status(404).json({ success: false, message: "Zone not found" });
        res.status(200).json({ success: true, message: "Zone deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTier = async (req, res) => {
    try {
        const { eventId } = req.params;
        const tier = await FoodFestTier.create({
            eventId,
            ...req.body
        });
        res.status(201).json({ success: true, tier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTier = async (req, res) => {
    try {
        const { tierId } = req.params;
        const tier = await FoodFestTier.findByIdAndUpdate(tierId, req.body, { new: true });
        if (!tier) return res.status(404).json({ success: false, message: "Tier not found" });
        res.status(200).json({ success: true, tier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTier = async (req, res) => {
    try {
        const { tierId } = req.params;
        const tier = await FoodFestTier.findByIdAndDelete(tierId);
        if (!tier) return res.status(404).json({ success: false, message: "Tier not found" });
        res.status(200).json({ success: true, message: "Tier deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkCapacity = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const zones = await FoodFestZone.find({ eventId });
        const tiers = await FoodFestTier.find({ eventId });

        const totalZoneCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
        const totalTicketQuantity = tiers.reduce((sum, t) => sum + t.quantity, 0);

        const overshootBy = totalTicketQuantity - totalZoneCapacity;
        
        res.status(200).json({
            success: true,
            oversold: overshootBy > 0,
            totalZoneCapacity,
            totalTicketQuantity,
            overshootBy: Math.max(0, overshootBy)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const publishEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await FoodFestEvent.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        if (event.status !== 'draft') {
            return res.status(400).json({ success: false, message: "Only draft events can be published" });
        }

        event.status = 'published';
        await event.save();

        // Run capacity check as a guardrail
        const zones = await FoodFestZone.find({ eventId });
        const tiers = await FoodFestTier.find({ eventId });
        const totalZoneCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
        const totalTicketQuantity = tiers.reduce((sum, t) => sum + t.quantity, 0);
        
        const warnings = [];
        if (totalTicketQuantity > totalZoneCapacity) {
            warnings.push(`Warning: Total ticket quantity (${totalTicketQuantity}) exceeds venue capacity (${totalZoneCapacity})`);
        }

        res.status(200).json({ 
            success: true, 
            message: "Event published successfully", 
            event,
            warnings 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const goLiveEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await FoodFestEvent.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        if (event.status !== 'published') {
            return res.status(400).json({ success: false, message: "Event must be published before going live" });
        }

        const now = new Date();
        if (now < event.startTime || now > event.endTime) {
            return res.status(400).json({ success: false, message: "Cannot go live outside event date range" });
        }

        event.status = 'live';
        await event.save();

        res.status(200).json({ success: true, message: "Event is now LIVE", event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const completeEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await FoodFestEvent.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        event.status = 'completed';
        await event.save();

        res.status(200).json({ success: true, message: "Event marked as completed", event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
