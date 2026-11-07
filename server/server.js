// Load env FIRST — every other module (app.js CORS, route registration
// decisions) reads process.env at import time.
import 'dotenv/config';
import { createServer } from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import connectDB from './src/db/db.js';
import { syncIndexes } from './src/services/indexSync.service.js';
import { initSocketIO } from './src/services/foodfest.socket.service.js';
import { startTicketSweeper, stopTicketSweeper } from './src/services/foodfest.sweeper.js';

const port = process.env.PORT || 3000;

// Validate required environment variables at startup
const requiredEnvVars = [
    'MONGODB_URL',
    'JWT_SECRET',
    'FRONTEND_URL', // CORS allowlist + email links — empty allowlist breaks every browser request
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASS',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
    'IMAGEKIT_URL_ENDPOINT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env file and restart the server.');
    process.exit(1);
}

// Non-fatal warnings for optional-but-important config
if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('⚠️  RAZORPAY_WEBHOOK_SECRET is not set — Razorpay webhooks will be rejected.');
}
if (!process.env.NODE_ENV) {
    console.warn('⚠️  NODE_ENV is not set — set NODE_ENV=production on the host for production error handling.');
}
if (!(process.env.FRONTEND_URL || '').startsWith('https://')) {
    console.warn(`⚠️  FRONTEND_URL (${process.env.FRONTEND_URL}) is not an https URL — auth cookies will use SameSite=Lax (fine for local dev, breaks cross-site production).`);
}

console.log('✅ All environment variables validated');

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

const httpServer = createServer(app);

// Initialize Socket.io
const io = initSocketIO(httpServer);
console.log('🔌 Socket.io initialized');

// Start Ticket Expiry Sweeper
startTicketSweeper();
console.log('🧹 Ticket expiry sweeper started');

httpServer.listen(port, () => {
    console.log(`\n🚀 FoodReel Server running on port ${port}`);
    // Connect to database with error handling
    connectDB().then(async () => {
        if (process.env.NODE_ENV === 'production') {
            try {
                const summary = await syncIndexes({
                    apply: true,
                    log: (line) => console.log(`[indexes]${line}`),
                });
                console.log(
                    `[indexes] ${summary.ok} ok, ${summary.created} created, ` +
                    `${summary.rebuilt} rebuilt${summary.failed ? `, ${summary.failed} FAILED` : ''}`
                );
            } catch (err) {
                console.error('[indexes] sync failed (continuing):', err.message);
            }
        }
    }).catch(err => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

// Graceful shutdown. Render sends SIGTERM on every deploy; without this the
// process is killed mid-request and in-flight checkouts/orders are dropped.
let shuttingDown = false;
const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} received — shutting down gracefully...`);

    stopTicketSweeper(); // Stop the ticket expiry sweeper for graceful shutdown

    // Hard deadline: open keep-alive/websocket sockets can otherwise hold the process open indefinitely.
    const forceExit = setTimeout(() => {
        console.error('Forced shutdown after 10s');
        process.exit(1);
    }, 10000);
    forceExit.unref();

    // Terminates live socket.io connections so httpServer.close can finish.
    try { io.close(); } catch { /* already closed */ }

    httpServer.close(async (err) => {
        try {
            await mongoose.connection.close();
        } catch (dbErr) {
            console.error('Error closing Mongo connection:', dbErr.message);
        }
        if (err) {
            console.error('Error closing HTTP server:', err.message);
            process.exit(1);
        }
        console.log('Shutdown complete');
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));