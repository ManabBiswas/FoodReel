import express from 'express'
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import foodRoutes from './routes/food.route.js';
import orderRoutes from './routes/order.route.js';
import advertisementRoutes from './routes/advertisement.route.js';
import userRoutes from './routes/user.route.js';
import paymentRoutes from './routes/payment.route.js';
import userPostRoutes from './routes/userPost.route.js';
import followRoutes from './routes/follow.route.js';
import reviewRoutes from './routes/review.route.js';
import commentRoutes from './routes/comment.route.js';
import adminRoutes from './routes/admin.route.js';
import cartRoutes from './routes/cart.route.js';
import emailRoutes from './routes/email.route.js';
import cors from 'cors';
import helmet from "helmet";
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import { sanitizeInput } from './middlewares/sanitization.js';

const app = express() 

// CORS configuration for production and development
const allowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
}))
 
app.use(globalRateLimiter);  // Global rate limiter

app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(sanitizeInput);
app.use(cookieParser());
app.use('/api/auth',authRoutes);
app.use('/api/food',foodRoutes);
app.use('/api/food', userPostRoutes);
app.use('/api/posts', userPostRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/comment-likes', commentRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/cart',cartRoutes);
app.use('/api/advertisement',advertisementRoutes);
app.use('/api/user',userRoutes);
app.use('/api/payment',paymentRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api/emails',emailRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;