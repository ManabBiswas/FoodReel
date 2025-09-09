import express from 'express'
import cookieParser from 'cookie-parser';
import authController from './controllers/auth.controller';
const app = express()

app.use(express.json());
app.use(cookieParser());


export default app;