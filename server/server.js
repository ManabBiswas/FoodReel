import app from './src/app.js';
import connectDB from './src/db/db.js';
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

// Connect to database with error handling
connectDB().catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

app.get('/', (req, res) => {
    res.send('Hi');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.listen(port, () => {
    console.log(`\n🚀 FoodReel Server running on port ${port}`);
    // console.log(`📝 Test email: http://localhost:${port}/api/test-email`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});