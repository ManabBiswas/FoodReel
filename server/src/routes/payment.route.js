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
import { validateBody, isObjectId, isNonEmptyString, optional } from '../utils/validate.js';

const router = express.Router();

router.post('/create-order', isLoggedin, rateLimiter, validateBody({
  // A malformed orderId used to reach orderModel.findOne as a CastError -> 500
  orderId: { check: isObjectId, message: 'orderId must be a valid id' }
}), createPaymentOrder);
router.post('/verify', isLoggedin, rateLimiter, validateBody({
  razorpay_order_id: { check: (v) => isNonEmptyString(v, 256), message: 'razorpay_order_id is required' },
  razorpay_payment_id: { check: (v) => isNonEmptyString(v, 256), message: 'razorpay_payment_id is required' },
  razorpay_signature: { check: (v) => isNonEmptyString(v, 512), message: 'razorpay_signature is required' },
  orderId: { check: optional(isObjectId), message: 'orderId must be a valid id' }
}), verifyPayment);
router.post('/failure', isLoggedin, handlePaymentFailure);
router.post('/refund', isLoggedin,rateLimiter, initiateRefund);
router.post('/webhook', razorpayWebhook);

export default router;