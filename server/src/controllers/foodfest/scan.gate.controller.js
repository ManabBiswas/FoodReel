import FoodFestTicket from "../models/FoodFestTicket.model.js";
import FoodFestZone from "../models/FoodFestZone.model.js";
import FoodFestEvent from "../models/FoodFestEvent.model.js";
import FoodFestCheckIn from "../models/FoodFestCheckIn.model.js";
import qrService from "../services/foodfest.qr.service.js";
import { emitZoneUpdate, emitZoneAlert } from "../services/foodfest.socket.service.js";
import mongoose from "mongoose";

export const scanTicket = async (req, res) => {
    try {
        const { qrToken, zoneId } = req.body;
        const staffId = req.admin._id;

        if (!qrToken || !zoneId) {
            return res.status(400).json({ success: false, message: "qrToken and zoneId are required" });
        }

        // 1. Verify QR Token (Signature & Expiry)
        const payload = qrService.verifyQRToken(qrToken);
        if (!payload) {
            // Log reject
            await FoodFestCheckIn.create({
                ticketId: null, zoneId, eventId: null,
                gateStaffId: staffId, gateStaffModel: 'Admin',
                action: 'reject', rejectReason: 'invalid_token', timestamp: new Date()
            });
            return res.status(400).json({ 
                success: false, admitted: false, reason: 'invalid_token', 
                message: "Invalid or expired QR code" 
            });
        }

        const { ticketId, eventId } = payload;

        // 2. Validate Event Status
        const event = await FoodFestEvent.findById(eventId);
        if (!event || event.status !== 'live') {
            await FoodFestCheckIn.create({
                ticketId, zoneId, eventId,
                gateStaffId: staffId, gateStaffModel: 'Admin',
                action: 'reject', rejectReason: 'event_not_live', timestamp: new Date()
            });
            return res.status(409).json({ 
                success: false, admitted: false, reason: 'event_not_live', 
                message: "Event is not currently live" 
            });
        }

        // 3. Check Zone Belongs to Event
        const zone = await FoodFestZone.findOne({ _id: zoneId, eventId });
        if (!zone) {
            await FoodFestCheckIn.create({
                ticketId, zoneId, eventId,
                gateStaffId: staffId, gateStaffModel: 'Admin',
                action: 'reject', rejectReason: 'wrong_event_zone', timestamp: new Date()
            });
            return res.status(409).json({ 
                success: false, admitted: false, reason: 'wrong_event_zone', 
                message: "This gate does not belong to the ticket's event" 
            });
        }

        // 4. Atomic Admission Transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Check Ticket: valid and not used
            const ticket = await FoodFestTicket.findOneAndUpdate(
                { _id: ticketId, status: 'valid' },
                { 
                    status: 'used', 
                    checkedInAt: new Date(), 
                    checkedInZoneId: zoneId,
                    checkedInBy: staffId,
                    checkedInByModel: 'Admin'
                },
                { session, new: true }
            );

            if (!ticket) {
                // Fetch to determine specific reason
                const existingTicket = await FoodFestTicket.findById(ticketId).session(session);
                let reason = 'invalid_token';
                if (existingTicket) {
                    if (existingTicket.status === 'used') reason = 'already_used';
                    else if (existingTicket.status === 'pending_payment') reason = 'payment_pending';
                    else if (existingTicket.status === 'expired' || existingTicket.status === 'cancelled' || existingTicket.status === 'refunded') reason = 'invalid_token';
                }
                await session.abortTransaction();
                
                await FoodFestCheckIn.create([{
                    ticketId, zoneId, eventId,
                    gateStaffId: staffId, gateStaffModel: 'Admin',
                    action: 'reject', rejectReason: reason, timestamp: new Date()
                }], { session: null }); // separate write for log

                return res.status(409).json({ 
                    success: false, admitted: false, reason, 
                    message: reason === 'already_used' ? "Ticket already used" : "Ticket is not valid for entry" 
                });
            }

            // Check Zone Capacity
            const updatedZone = await FoodFestZone.findOneAndUpdate(
                { 
                    _id: zoneId, 
                    eventId,
                    $expr: { $lt: ['$currentCount', '$capacity'] } 
                },
                { $inc: { currentCount: 1, totalAdmitted: 1 } },
                { session, new: true }
            );

            if (!updatedZone) {
                await session.abortTransaction();
                
                // Revert ticket status (since zone is full)
                await FoodFestTicket.findByIdAndUpdate(ticketId, { status: 'valid', $unset: { checkedInAt: "", checkedInZoneId: "", checkedInBy: "", checkedInByModel: "" } });
                
                await FoodFestCheckIn.create([{
                    ticketId, zoneId, eventId,
                    gateStaffId: staffId, gateStaffModel: 'Admin',
                    action: 'reject', rejectReason: 'zone_full', timestamp: new Date()
                }], { session: null });

                return res.status(409).json({ 
                    success: false, admitted: false, reason: 'zone_full', 
                    message: "Zone is at full capacity",
                    zone: { currentCount: zone.currentCount, capacity: zone.capacity }
                });
            }

            // Log successful admission
            await FoodFestCheckIn.create([{
                ticketId, zoneId, eventId,
                gateStaffId: staffId, gateStaffModel: 'Admin',
                action: 'admit', timestamp: new Date()
            }], { session });

            await session.commitTransaction();

            // Emit Real-time Updates (Non-blocking)
            const newCount = updatedZone.currentCount;
            const capacity = updatedZone.capacity;
            
            emitZoneUpdate(eventId, { zoneId, currentCount: newCount, totalAdmitted: updatedZone.totalAdmitted });
            
            // Check Thresholds
            const warningThreshold = Math.ceil(capacity * (zone.warningThreshold / 100));
            const criticalThreshold = Math.ceil(capacity * (zone.criticalThreshold / 100));

            if (newCount >= criticalThreshold && newCount - 1 < criticalThreshold) {
                emitZoneAlert(eventId, { zoneId, level: 'critical', currentCount: newCount, capacity });
            } else if (newCount >= warningThreshold && newCount - 1 < warningThreshold) {
                emitZoneAlert(eventId, { zoneId, level: 'warning', currentCount: newCount, capacity });
            }

            res.status(200).json({
                success: true,
                admitted: true,
                ticket: { 
                    _id: ticket._id, 
                    tierId: ticket.tierId,
                    user: ticket.user 
                },
                zone: { 
                    currentCount: newCount, 
                    capacity: updatedZone.capacity 
                }
            });

        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error("Scan ticket error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkoutTicket = async (req, res) => {
    try {
        const { qrToken, zoneId } = req.body;
        const staffId = req.admin._id;

        if (!qrToken || !zoneId) {
            return res.status(400).json({ success: false, message: "qrToken and zoneId are required" });
        }

        const payload = qrService.verifyQRToken(qrToken);
        if (!payload) {
            return res.status(400).json({ success: false, message: "Invalid or expired QR code" });
        }

        const { ticketId, eventId } = payload;

        const zone = await FoodFestZone.findOne({ _id: zoneId, eventId });
        if (!zone || !zone.tracksExit) {
            return res.status(400).json({ success: false, message: "Zone does not support checkout" });
        }

        // Atomic Release
        const ticket = await FoodFestTicket.findOneAndUpdate(
            { _id: ticketId, status: 'used', checkedInZoneId: zoneId },
            { 
                $unset: { checkedInZoneId: "" }, // Keep status 'used' but clear zone
                checkedOutAt: new Date(),
                checkedOutZoneId: zoneId
            },
            { new: true }
        );

        if (!ticket) {
            return res.status(409).json({ success: false, message: "Ticket not found or not checked into this zone" });
        }

        // Decrement zone count
        const updatedZone = await FoodFestZone.findByIdAndUpdate(
            zoneId,
            { $inc: { currentCount: -1 } },
            { new: true }
        );

        // Log checkout
        await FoodFestCheckIn.create({
            ticketId, zoneId, eventId,
            gateStaffId: staffId, gateStaffModel: 'Admin',
            action: 'release', timestamp: new Date()
        });

        // Emit Update
        emitZoneUpdate(eventId, { zoneId, currentCount: updatedZone.currentCount, totalAdmitted: updatedZone.totalAdmitted });

        res.status(200).json({ 
            success: true, 
            message: "Checkout successful", 
            zone: { currentCount: updatedZone.currentCount, capacity: updatedZone.capacity }
        });

    } catch (error) {
        console.error("Checkout ticket error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};