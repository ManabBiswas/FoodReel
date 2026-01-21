import express from 'express';
import { 
  createPaymentOrder, 
  verifyPayment, 
  handlePaymentFailure,
  initiateRefund,
  razorpayWebhook
} from '../controllers/payment.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/create-order', isLoggedin, rateLimiter, createPaymentOrder);
router.post('/verify', isLoggedin,rateLimiter, verifyPayment);
router.post('/failure', isLoggedin, handlePaymentFailure);
router.post('/refund', isLoggedin,rateLimiter, initiateRefund);
router.post('/webhook', razorpayWebhook);

export default router;