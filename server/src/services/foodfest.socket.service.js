import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { parseCookie } from "cookie";
import userModel from "../models/user.Model.js";
import foodPartnerModel from "../models/foodPartner.Model.js";
import adminModel from "../models/admin.model.js";
import FoodFestEvent from "../models/FoodFestEvent.model.js";
import FoodFestTicket from "../models/FoodFestTicket.model.js";

let io = null;

/** Only the event's organizer, an admin, or a ticket holder may listen in. */
export const canJoinEventRoom = async ({ user, eventId }) => {
    if (!user || !mongoose.isValidObjectId(eventId)) return false;
    const event = await FoodFestEvent.findById(eventId).select('organizer organizerType');
    if (!event) return false;
    if (user.type === 'admin') return true;
    if (user.type !== 'user') return false;
    if (event.organizerType === 'user' && String(event.organizer) === String(user.id)) return true;
    return Boolean(await FoodFestTicket.exists({
        eventId,
        user: user.id,
        status: { $in: ['valid', 'used'] }
    }));
};

export const initSocketIO = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            // Auth via cookie
            const cookies = parseCookie(socket.handshake.headers.cookie || '');
            const token = cookies.userToken || cookies.partnerToken || cookies.adminToken;
            if (!token) return next(new Error("Authentication required"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded?.id) return next(new Error("Invalid token"));

            const user = await userModel.findById(decoded.id).select('isBlocked tokenVersion');
            if (user) {
                if (user.isBlocked) return next(new Error("Account blocked"));
         // Mirror isLoggedin: a token revoked by a password change must not keep a live socket.
                if ((decoded.tv ?? 0) !== (user.tokenVersion ?? 0)) return next(new Error("Session expired"));
                socket.user = { id: decoded.id, type: 'user' };
                return next();
            }
            const partner = await foodPartnerModel.findById(decoded.id).select('isBlocked tokenVersion');
            if (partner) {
                if (partner.isBlocked) return next(new Error("Account blocked"));
                if ((decoded.tv ?? 0) !== (partner.tokenVersion ?? 0)) return next(new Error("Session expired"));
                socket.user = { id: decoded.id, type: 'partner' };
                return next();
            }
            const admin = await adminModel.findById(decoded.id).select('isActive tokenVersion');
            if (admin) {
                // Mirror the HTTP plane: a deactivated admin keeps no live socket.
                if (admin.isActive === false) return next(new Error("Account deactivated"));
                if ((decoded.tv ?? 0) !== (admin.tokenVersion ?? 0)) return next(new Error("Session expired"));
                socket.user = { id: decoded.id, type: 'admin' };
                return next();
            }
            next(new Error("Account not found"));
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id} (User: ${socket.user.id})`);

        socket.on('joinEvent', async (eventId) => {
            try {
                if (!(await canJoinEventRoom({ user: socket.user, eventId }))) {
                    socket.emit('event:error', { message: 'You cannot join this event room' });
                    return;
                }
                socket.join(`event:${eventId}`);
                console.log(`Socket ${socket.id} joined event:${eventId}`);
            } catch (error) {
                console.error(`Socket ${socket.id} join failed:`, error.message);
                socket.emit('event:error', { message: 'Could not join this event room' });
            }
        });

        socket.on('leaveEvent', (eventId) => {
            socket.leave(`event:${eventId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};

// Emitters for controllers

// io.to(...).emit(...) → sends a message to all clients connected to the room event:<eventId>.
export const emitZoneUpdate = (eventId, data) => {
    if (io) io.to(`event:${eventId}`).emit('zone.update', data);
};

export const emitZoneAlert = (eventId, data) => {
    if (io) io.to(`event:${eventId}`).emit('zone.alert', data);
};

export const emitTicketSold = (eventId, data) => {
    if (io) io.to(`event:${eventId}`).emit('ticket.sold', data);
};

export const emitCheckIn = (eventId, data) => {
    if (io) io.to(`event:${eventId}`).emit('checkin.admitted', data);
};

export const emitOrderPlaced = (eventId, data) => {
    if (io) io.to(`event:${eventId}`).emit('order.placed', data);
};

// Each emitter represents a different domain event in your FoodFest system — zone management, ticketing, check‑ins, or food orders. They all broadcast to the same event room, but with distinct event names so clients can react appropriately.