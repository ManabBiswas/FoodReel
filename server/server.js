import { createServer } from 'http';
import app from './src/app.js';
import connectDB from './src/db/db.js';
import { initSocketIO } from './src/services/foodfest.socket.service.js';
import { startTicketSweeper } from './src/services/foodfest.sweeper.js';
import 'dotenv/config';

const port = process.env.PORT || 3000;

// Validate required environment variables at startup
const requiredEnvVars = [
    'MONGODB_URL',
    'JWT_SECRET',
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