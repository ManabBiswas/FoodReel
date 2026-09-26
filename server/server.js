// Load env FIRST — every other module (app.js CORS, route registration
// decisions) reads process.env at import time.
import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import connectDB from './src/db/db.js';
import { initSocketIO } from './src/services/foodfest.socket.service.js';
import { startTicketSweeper } from './src/services/foodfest.sweeper.js';

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

const httpServer = createServer(app);

// Initialize Socket.io
initSocketIO(httpServer);
console.log('🔌 Socket.io initialized');

// Start Ticket Expiry Sweeper
startTicketSweeper();
console.log('🧹 Ticket expiry sweeper started');

httpServer.listen(port, () => {
    console.log(`\n🚀 FoodReel Server running on port ${port}`);
    // Connect to database with error handling
    connectDB().catch(err => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});