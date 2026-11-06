import mongoose from "mongoose";
import FoodFestEvent from "../../models/FoodFestEvent.model.js";
import FoodFestTier from "../../models/FoodFestTier.model.js";
import FoodFestZone from "../../models/FoodFestZone.model.js";
import FoodFestTicket from "../../models/FoodFestTicket.model.js";
import FoodFestCheckIn from "../../models/FoodFestCheckIn.model.js";
import "../../models/user.Model.js";
import { serverFail } from "../../utils/apiError.js";
import { validateEventWindow } from "../../utils/eventDates.js";

const EVENT_UPDATABLE = [
    'name',
    'description',
    'venue',
    'startTime',
    'endTime',
    'salesStart',
    'salesEnd',
    'bannerImage'
];
const ZONE_UPDATABLE = ['name', 'capacity', 'warningThreshold', 'criticalThreshold', 'tracksExit'];
const TIER_UPDATABLE = ['name', 'price', 'currency', 'quantity', 'active', 'salesStart', 'salesEnd'];

// Ticket states that represent real buyers.
const LIVE_TICKET_STATUSES = ['pending_payment', 'valid', 'used'];
const LOCKED_EVENT_STATUSES = ['completed', 'cancelled'];

const pickFields = (body, allowed) => {
    const out = {};
    for (const key of allowed) {
        if (body[key] !== undefined) out[key] = body[key];
    }
    return out;
};

const fail = (status, message) => ({ status, message });

/**
 * Resolve an event that belongs to this user and has been granted organizer
 * access by an admin. A missing/foreign event is reported as 404 so the API
 * does not reveal other organizers' events.
 */
const findOwnedEvent = async (userId, eventId) => {
    if (!mongoose.isValidObjectId(eventId)) return fail(404, "Event not found");

    const event = await FoodFestEvent.findOne({
        _id: eventId,
        organizer: userId,
        organizerType: 'user'
    });
    if (!event) return fail(404, "Event not found");
    if (!event.organizerAccess) {
        return fail(403, "Organizer access has not been granted for this event");
    }
    return { event };
};

const findOwnedTier = async (userId, tierId) => {
    if (!mongoose.isValidObjectId(tierId)) return fail(404, "Ticket tier not found");

    const tier = await FoodFestTier.findById(tierId);
    if (!tier) return fail(404, "Ticket tier not found");

    const access = await findOwnedEvent(userId, tier.eventId);
    if (access.status) return access;
    return { tier, event: access.event };
};

const findOwnedZone = async (userId, zoneId) => {
    if (!mongoose.isValidObjectId(zoneId)) return fail(404, "Zone not found");

    const zone = await FoodFestZone.findById(zoneId);
    if (!zone) return fail(404, "Zone not found");

    const access = await findOwnedEvent(userId, zone.eventId);
    if (access.status) return access;
    return { zone, event: access.event };
};

const summarizeEvent = async (eventId) => {
    const [rows, tiers] = await Promise.all([
        FoodFestTicket.aggregate([
            { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: { $sum: '$priceAtPurchase' }
                }
            }
        ]),
        FoodFestTier.find({ eventId }).select('quantity sold reserved')
    ]);

    const byStatus = {};
    let totalTickets = 0;
    let revenue = 0;

    for (const row of rows) {
        byStatus[row._id] = row.count;
        totalTickets += row.count;
        // Only paid tickets count as revenue; pending/refunded/cancelled do not.
        if (row._id === 'valid' || row._id === 'used') revenue += row.revenue || 0;
    }

    return {
        totalTickets,
        byStatus,
        revenue,
        checkedIn: byStatus.used || 0,
        capacity: tiers.reduce((sum, tier) => sum + tier.quantity, 0),
        sold: tiers.reduce((sum, tier) => sum + tier.sold, 0),
        reserved: tiers.reduce((sum, tier) => sum + tier.reserved, 0)
    };
};

const capacityWarnings = (zones, tiers, venueCapacity) => {
    const zoneCapacity = zones.reduce((sum, zone) => sum + zone.capacity, 0);
    const tierCapacity = tiers.reduce((sum, tier) => sum + tier.quantity, 0);
    // Zones are the live capacity source. Before any zone exists, fall back to
    // the venue's declared max capacity so publishing a small event does not
    // warn against a meaningless zero.
    const effectiveCapacity = zones.length > 0
        ? zoneCapacity
        : Number(venueCapacity) || 0;
    const warnings = [];

    if (effectiveCapacity > 0 && tierCapacity > effectiveCapacity) {
        warnings.push(
            `Total ticket quantity (${tierCapacity}) exceeds venue capacity (${effectiveCapacity})`
        );
    }
    return warnings;
};

// GET /api/foodfest/organizer/events
export const listMyEvents = async (req, res) => {
    try {
        const events = await FoodFestEvent.find({
            organizer: req.user._id,
            organizerType: 'user'
        }).sort({ startTime: 1, createdAt: -1 });

        res.status(200).json({ success: true, events });
    } catch (error) {
        serverFail(res, error);
    }
};

// GET /api/foodfest/organizer/events/:eventId
export const getMyEvent = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const { event } = access;
        const [tiers, zones, summary] = await Promise.all([
            FoodFestTier.find({ eventId: event._id }).sort({ price: 1 }),
            FoodFestZone.find({ eventId: event._id }).sort({ name: 1 }),
            summarizeEvent(event._id)
        ]);

        res.status(200).json({ success: true, event, tiers, zones, summary });
    } catch (error) {
        serverFail(res, error);
    }
};

// PUT /api/foodfest/organizer/events/:eventId
export const updateMyEvent = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const { event } = access;
        if (LOCKED_EVENT_STATUSES.includes(event.status) || event.status === 'live') {
            return res.status(409).json({
                success: false,
                message: "Event details can only be changed before the event goes live"
            });
        }

        const updates = pickFields(req.body, EVENT_UPDATABLE);
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No updatable fields provided" });
        }

        if (updates.venue) {
            const currentVenue = event.venue?.toObject ? event.venue.toObject() : { ...event.venue };
            updates.venue = { ...currentVenue, ...updates.venue };
            if (!updates.venue.address || !updates.venue.city) {
                return res.status(400).json({
                    success: false,
                    message: "Venue address and city are required"
                });
            }
        }

        const dateError = validateEventWindow({
            startTime: updates.startTime ?? event.startTime,
            endTime: updates.endTime ?? event.endTime,
            salesStart: updates.salesStart ?? event.salesStart,
            salesEnd: updates.salesEnd ?? event.salesEnd
        });
        if (dateError) {
            return res.status(400).json({ success: false, message: dateError });
        }

        event.set(updates);
        await event.save();

        res.status(200).json({ success: true, message: "Event updated successfully", event });
    } catch (error) {
        serverFail(res, error);
    }
};

// GET /api/foodfest/organizer/events/:eventId/tiers
export const listMyTiers = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const tiers = await FoodFestTier.find({ eventId: access.event._id }).sort({ price: 1 });
        res.status(200).json({ success: true, tiers });
    } catch (error) {
        serverFail(res, error);
    }
};

// POST /api/foodfest/organizer/events/:eventId/tiers
export const createMyTier = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        if (LOCKED_EVENT_STATUSES.includes(access.event.status)) {
            return res.status(409).json({
                success: false,
                message: "Cannot add ticket tiers to a completed or cancelled event"
            });
        }

        const fields = pickFields(req.body, TIER_UPDATABLE);
        if (!fields.name || fields.price === undefined || fields.quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "name, price and quantity are required"
            });
        }

        const tier = await FoodFestTier.create({
            eventId: access.event._id,
            ...fields
        });

        res.status(201).json({ success: true, tier });
    } catch (error) {
        serverFail(res, error);
    }
};

// PUT /api/foodfest/organizer/tiers/:tierId
export const updateMyTier = async (req, res) => {
    try {
        const access = await findOwnedTier(req.user._id, req.params.tierId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        if (LOCKED_EVENT_STATUSES.includes(access.event.status)) {
            return res.status(409).json({
                success: false,
                message: "Cannot edit ticket tiers on a completed or cancelled event"
            });
        }

        const updates = pickFields(req.body, TIER_UPDATABLE);
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No updatable fields provided" });
        }

        // A tier can never shrink below tickets already sold or reserved.
        const capacityGuard = updates.quantity !== undefined
            ? { $expr: { $gte: [Number(updates.quantity), { $add: ['$sold', '$reserved'] }] } }
            : {};

        const tier = await FoodFestTier.findOneAndUpdate(
            { _id: access.tier._id, ...capacityGuard },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!tier) {
            return res.status(409).json({
                success: false,
                message: "quantity cannot be lower than sold + reserved"
            });
        }

        res.status(200).json({ success: true, tier });
    } catch (error) {
        serverFail(res, error);
    }
};

// DELETE /api/foodfest/organizer/tiers/:tierId
export const deleteMyTier = async (req, res) => {
    try {
        const access = await findOwnedTier(req.user._id, req.params.tierId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const liveTickets = await FoodFestTicket.countDocuments({
            tierId: access.tier._id,
            status: { $in: LIVE_TICKET_STATUSES }
        });
        if (liveTickets > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete: ${liveTickets} ticket(s) were sold on this tier.`
            });
        }

        await FoodFestTier.findByIdAndDelete(access.tier._id);
        res.status(200).json({ success: true, message: "Ticket tier deleted successfully" });
    } catch (error) {
        serverFail(res, error);
    }
};

// GET /api/foodfest/organizer/events/:eventId/zones
export const listMyZones = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const zones = await FoodFestZone.find({ eventId: access.event._id }).sort({ name: 1 });
        res.status(200).json({ success: true, zones });
    } catch (error) {
        serverFail(res, error);
    }
};

// POST /api/foodfest/organizer/events/:eventId/zones
export const createMyZone = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        if (LOCKED_EVENT_STATUSES.includes(access.event.status)) {
            return res.status(409).json({
                success: false,
                message: "Cannot add zones to a completed or cancelled event"
            });
        }

        const fields = pickFields(req.body, ZONE_UPDATABLE);
        if (!fields.name || fields.capacity === undefined) {
            return res.status(400).json({
                success: false,
                message: "name and capacity are required"
            });
        }

        const zone = await FoodFestZone.create({
            eventId: access.event._id,
            ...fields
        });

        res.status(201).json({ success: true, zone });
    } catch (error) {
        serverFail(res, error);
    }
};

// PUT /api/foodfest/organizer/zones/:zoneId
export const updateMyZone = async (req, res) => {
    try {
        const access = await findOwnedZone(req.user._id, req.params.zoneId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        if (LOCKED_EVENT_STATUSES.includes(access.event.status)) {
            return res.status(409).json({
                success: false,
                message: "Cannot edit zones on a completed or cancelled event"
            });
        }

        const updates = pickFields(req.body, ZONE_UPDATABLE);
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "No updatable fields provided" });
        }

        const zone = await FoodFestZone.findByIdAndUpdate(
            access.zone._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, zone });
    } catch (error) {
        serverFail(res, error);
    }
};

// DELETE /api/foodfest/organizer/zones/:zoneId
export const deleteMyZone = async (req, res) => {
    try {
        const access = await findOwnedZone(req.user._id, req.params.zoneId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        // Check-ins reference the zone; deleting it would orphan the audit trail.
        const checkIns = await FoodFestCheckIn.countDocuments({ zoneId: access.zone._id });
        if (checkIns > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete: ${checkIns} check-in(s) reference this zone.`
            });
        }

        await FoodFestZone.findByIdAndDelete(access.zone._id);
        res.status(200).json({ success: true, message: "Zone deleted successfully" });
    } catch (error) {
        serverFail(res, error);
    }
};

// GET /api/foodfest/organizer/events/:eventId/tickets
export const listMyEventTickets = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const filter = { eventId: access.event._id };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.tierId && mongoose.isValidObjectId(req.query.tierId)) {
            filter.tierId = req.query.tierId;
        }

        const tickets = await FoodFestTicket.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('tierId', 'name')
            .sort({ createdAt: -1 })
            .limit(200);

        res.status(200).json({ success: true, tickets });
    } catch (error) {
        serverFail(res, error);
    }
};

// GET /api/foodfest/organizer/events/:eventId/summary
export const getMyEventSummary = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const summary = await summarizeEvent(access.event._id);
        res.status(200).json({ success: true, summary });
    } catch (error) {
        serverFail(res, error);
    }
};

// PATCH /api/foodfest/organizer/events/:eventId/publish
export const publishMyEvent = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const { event } = access;
        if (event.status !== 'draft') {
            return res.status(400).json({ success: false, message: "Only draft events can be published" });
        }

        const tiers = await FoodFestTier.find({ eventId: event._id });
        if (tiers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Add at least one ticket tier before publishing"
            });
        }

        event.status = 'published';
        await event.save();

        const zones = await FoodFestZone.find({ eventId: event._id });
        res.status(200).json({
            success: true,
            message: "Event published successfully",
            event,
            warnings: capacityWarnings(zones, tiers, event.venue?.maxCapacity)
        });
    } catch (error) {
        serverFail(res, error);
    }
};

// PATCH /api/foodfest/organizer/events/:eventId/go-live
export const goLiveMyEvent = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const { event } = access;
        if (event.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: "Event must be published before going live"
            });
        }

        const now = new Date();
        if (now < event.startTime || now > event.endTime) {
            return res.status(400).json({
                success: false,
                message: "Cannot go live outside event date range"
            });
        }

        event.status = 'live';
        await event.save();

        res.status(200).json({ success: true, message: "Event is now LIVE", event });
    } catch (error) {
        serverFail(res, error);
    }
};

// PATCH /api/foodfest/organizer/events/:eventId/complete
export const completeMyEvent = async (req, res) => {
    try {
        const access = await findOwnedEvent(req.user._id, req.params.eventId);
        if (access.status) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const { event } = access;
        if (!['published', 'live'].includes(event.status)) {
            return res.status(400).json({
                success: false,
                message: "Only published or live events can be completed"
            });
        }

        event.status = 'completed';
        await event.save();

        res.status(200).json({ success: true, message: "Event marked as completed", event });
    } catch (error) {
        serverFail(res, error);
    }
};
