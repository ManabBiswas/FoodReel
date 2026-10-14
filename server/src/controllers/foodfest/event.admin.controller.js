import FoodFestEvent from "../../models/FoodFestEvent.model.js";
import { serverFail } from "../../utils/apiError.js";
import FoodFestZone from "../../models/FoodFestZone.model.js";
import FoodFestTier from "../../models/FoodFestTier.model.js";
import FoodFestTicket from "../../models/FoodFestTicket.model.js";
import FoodFestCheckIn from "../../models/FoodFestCheckIn.model.js";

const EVENT_UPDATABLE = ['name', 'description', 'venue', 'startTime', 'endTime', 'salesStart', 'salesEnd', 'bannerImage'];
const ZONE_UPDATABLE = ['name', 'capacity', 'warningThreshold', 'criticalThreshold', 'tracksExit'];
const TIER_UPDATABLE = ['name', 'price', 'currency', 'quantity', 'active', 'salesStart', 'salesEnd'];

const pickFields = (body, allowed) => { //pick fields means only the ones that are allowed
    const out = {}; //out means 
    for (const key of allowed) {
        if (body[key] !== undefined) out[key] = body[key];
    }
    return out;
};

// Ticket states that represent real buyers
const LIVE_TICKET_STATUSES = ['pending_payment', 'valid', 'used'];

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
        serverFail(res, error);
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
        serverFail(res, error);
    }
};

export const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const updates = pickFields(req.body, EVENT_UPDATABLE);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No updatable fields provided" });
        }

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
        serverFail(res, error);
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const liveTickets = await FoodFestTicket.countDocuments({
            eventId,
            status: { $in: LIVE_TICKET_STATUSES }
        });
        if (liveTickets > 0) {
            return res.status(409).json({   //409 for conflict
                success: false,
                message: `Cannot delete: ${liveTickets} ticket(s) are outstanding. Cancel and refund them first.`
            });
        }

        const event = await FoodFestEvent.findByIdAndDelete(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }
        // Cascade delete zones and tiers
        await FoodFestZone.deleteMany({ eventId });
        await FoodFestTier.deleteMany({ eventId });

        res.status(200).json({ success: true, message: "Event and associated zones/tiers deleted successfully" });
    } catch (error) {
        serverFail(res, error);
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
        serverFail(res, error);
    }
};

export const updateZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const updates = pickFields(req.body, ZONE_UPDATABLE);
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No updatable fields provided" });
        }
        const zone = await FoodFestZone.findByIdAndUpdate(zoneId, { $set: updates }, { new: true, runValidators: true });
        if (!zone) return res.status(404).json({ success: false, message: "Zone not found" });
        res.status(200).json({ success: true, zone });
    } catch (error) {
        serverFail(res, error);
    }
};

export const deleteZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
 // Guard: check-ins reference the zone; deleting it orphans the entry audit trail for people physically inside the venue.
        const checkIns = await FoodFestCheckIn.countDocuments({ zoneId });
        if (checkIns > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete: ${checkIns} check-in(s) reference this zone.`
            });
        }

        const zone = await FoodFestZone.findByIdAndDelete(zoneId);
        if (!zone) return res.status(404).json({ success: false, message: "Zone not found" });
        res.status(200).json({ success: true, message: "Zone deleted successfully" });
    } catch (error) {
        serverFail(res, error);
    }
};

export const createTier = async (req, res) => {
    try {
        const { eventId } = req.params;
//  Whitelist (no spread of req.body): sold/reserved start at their schema defaults and can only be moved by the ticket flows.
        const tier = await FoodFestTier.create({
            eventId,
            ...pickFields(req.body, TIER_UPDATABLE)
        });
        res.status(201).json({ success: true, tier });
    } catch (error) {
        serverFail(res, error);
    }
};

export const updateTier = async (req, res) => {
    try {
        const { tierId } = req.params;
        const updates = pickFields(req.body, TIER_UPDATABLE);
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No updatable fields provided" });
        }
        const tier = await FoodFestTier.findByIdAndUpdate(tierId, { $set: updates }, { new: true, runValidators: true });
        if (!tier) return res.status(404).json({ success: false, message: "Tier not found" });
        res.status(200).json({ success: true, tier });
    } catch (error) {
        serverFail(res, error);
    }
};

export const deleteTier = async (req, res) => {
    try {
        const { tierId } = req.params;
// Guard: deleting a tier with sales strands its buyers (and would silently zero the availability check for tickets already held).
        const liveTickets = await FoodFestTicket.countDocuments({
            tierId,
            status: { $in: LIVE_TICKET_STATUSES }
        });
        if (liveTickets > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete: ${liveTickets} ticket(s) were sold on this tier.`
            });
        }

        const tier = await FoodFestTier.findByIdAndDelete(tierId);
        if (!tier) return res.status(404).json({ success: false, message: "Tier not found" });
        res.status(200).json({ success: true, message: "Tier deleted successfully" });
    } catch (error) {
        serverFail(res, error);
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
        serverFail(res, error);
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
        serverFail(res, error);
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
        serverFail(res, error);
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
        serverFail(res, error);
    }
};
