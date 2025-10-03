import express from 'express'
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import foodRoutes from './routes/food.route.js';
import orderRoutes from './routes/order.route.js';
import advertisementRoutes from './routes/advertisement.route.js';
import cors from 'cors';
const app = express() 

app.use(cors({
  origin: 'http://localhost:5173' || process.env.FRONTEND_URL, // Your frontend URL
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


export default app;