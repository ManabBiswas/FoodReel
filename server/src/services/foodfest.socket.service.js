import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { parseCookie } from "cookie";
import userModel from "../models/user.Model.js";
import foodPartnerModel from "../models/foodPartner.Model.js";
import adminModel from "../models/admin.model.js";

let io = null;
const eventRooms = new Map(); // eventId -> Set of socketIds

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
            const token = cookies.token;
            if (!token) return next(new Error("Authentication required"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded?.id) return next(new Error("Invalid token"));

            const user = await userModel.findById(decoded.id).select('isBlocked');
            if (user) {
                if (user.isBlocked) return next(new Error("Account blocked"));
                socket.user = { id: decoded.id, type: 'user' };
                return next();
            }
            const partner = await foodPartnerModel.findById(decoded.id).select('isBlocked');
            if (partner) {
                if (partner.isBlocked) return next(new Error("Account blocked"));
                socket.user = { id: decoded.id, type: 'partner' };
                return next();
            }
            const admin = await adminModel.findById(decoded.id).select('_id');
            if (admin) {
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

        socket.on('joinEvent', (eventId) => {
            socket.join(`event:${eventId}`);
            console.log(`Socket ${socket.id} joined event:${eventId}`);
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