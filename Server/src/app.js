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
import adminRoutes from './routes/admin.route.js';
import cors from 'cors';
const app = express() 

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
 
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth',authRoutes);
app.use('/api/food',foodRoutes);
app.use('/api/food', userPostRoutes);
app.use('/api/posts', userPostRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/advertisement',advertisementRoutes);
app.use('/api/user',userRoutes);
app.use('/api/payment',paymentRoutes);
app.use('/api/admin',adminRoutes);


export default app;