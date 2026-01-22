import app from './src/app.js';
import connectDB from './src/db/db.js';
import 'dotenv/config';
const port = process.env.PORT || 3000

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
    console.log(`Server running on port ${port}`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});