import express from 'express'
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import foodRoutes from './routes/food.route.js';
const app = express()

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth',authRoutes);
app.use('/api/food',foodRoutes);


export default app;