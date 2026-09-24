import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

let io = null;
const eventRooms = new Map(); // eventId -> Set of socketIds

export const initSocketIO = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true
        }
    });

    io.use((socket, next) => {
        // Auth via cookie
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const token = cookies.token;
        if (!token) return next(new Error("Authentication required"));
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // { id, email }
            next();
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