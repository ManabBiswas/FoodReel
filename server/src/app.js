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
import foodfestAdminRoutes from './routes/foodfest/admin.routes.js';
import foodfestPartnerRoutes from './routes/foodfest/partner.routes.js';
import foodfestUserRoutes from './routes/foodfest/user.routes.js';
import foodfestGateRoutes from './routes/foodfest/gate.routes.js';
import cartRoutes from './routes/cart.route.js';
import emailRoutes from './routes/email.route.js';
import contactRoutes from './routes/contact.route.js';
import cors from 'cors';
import helmet from "helmet";
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import { sanitizeInput } from './middlewares/sanitization.js';

const app = express() 

// Behind Render's reverse proxy — without this, req.ip resolves to the proxy
// IP for every client and the rate limiter shares ONE bucket for the whole site.
app.set('trust proxy', 1);

// CORS configuration for production and development.
const allowedOrigins = [
  (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin.replace(/\/$/, '')) !== -1) {
      callback(null, true);
    } else {
      // Do not throw: a thrown error surfaces as a 500 from the error
      // handler instead of a clean CORS rejection.
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
}))
 
app.use(globalRateLimiter);  // Global rate limiter

// Razorpay signs the RAW request bytes — capture the body as a Buffer for the
// webhook route BEFORE express.json() consumes the stream. body-parser sets
// req._body after parsing, so express.json() below skips this route.
app.use('/api/payment/webhook', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '10mb' })); // 10mb max because of food images
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(sanitizeInput);

// Clamp pagination query params (M12): controllers pass req.query.limit/skip
// straight into .limit()/.skip() — a huge limit from the client becomes an
// unbounded DB query. Express 5's req.query is a getter, but sanitizeInput
// replaced it with a plain object we can safely mutate.
app.use((req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    if (req.query.limit !== undefined) {
      const n = parseInt(req.query.limit, 10);
      req.query.limit = (Number.isFinite(n) && n > 0) ? Math.min(n, 100) : 10;
    }
    if (req.query.skip !== undefined) {
      const n = parseInt(req.query.skip, 10);
      req.query.skip = (Number.isFinite(n) && n > 0) ? n : 0;
    }
    if (req.query.page !== undefined) {
      const n = parseInt(req.query.page, 10);
      req.query.page = (Number.isFinite(n) && n > 0) ? n : 1;
    }
  }
  next();
});
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
app.use('/api/foodfest/admin', foodfestAdminRoutes);
app.use('/api/foodfest/partner', foodfestPartnerRoutes);
app.use('/api/foodfest/user', foodfestUserRoutes);
app.use('/api/foodfest/gate', foodfestGateRoutes);
app.use('/api/emails',emailRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hi!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer errors are client errors — must not surface as 500
  if (err && err.name === 'MulterError') {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      error: tooLarge
        ? `File too large. Maximum size allowed: ${((err.limit || 0) / (1024 * 1024))}MB`
        : (err.message || 'Invalid file upload')
    });
  }

  const status = err.status || 500;
  // M15: never leak internal error messages for unhandled (500) errors in
  // production — they can expose stack/db details. Explicit err.status (4xx
  // set by our code) is safe to relay.
  const isProd = process.env.NODE_ENV === 'production';
  const message = (status < 500 || !isProd) && err.message
    ? err.message
    : 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;