import express from 'express'
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import foodRoutes from './routes/food.route.js';
import orderRoutes from './routes/order.route.js';
import advertisementRoutes from './routes/advertisement.route.js';
import userRoutes from './routes/user.route.js';
import paymentRoutes from './routes/payment.route.js';
import userPostRoutes from './routes/userPost.route.js';
import cors from 'cors';
const app = express() 

app.use(cors({
  origin: 'http://localhost:5173' || process.env.FRONTEND_URL, // Support both dev ports
  credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
}))
 
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth',authRoutes);
app.use('/api/food',foodRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/advertisement',advertisementRoutes);
app.use('/api/user',userRoutes);
app.use('/api/payment',paymentRoutes);
app.use('/api/food', userPostRoutes);


export default app;