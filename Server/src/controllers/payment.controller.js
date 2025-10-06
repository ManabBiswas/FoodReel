import paymentService from '../services/paymentService.js';
import orderModel from '../models/Order.js';

export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user._id;

    const order = await orderModel.findOne({ 
      _id: orderId, 
      user: userId 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if payment method is COD
    if (order.paymentDetails.method === 'cod') {
      return res.status(400).json({
        success: false,
        message: 'This order is set for Cash on Delivery. No online payment required.'
      });
    }

    // Check if already paid
    if (order.paymentDetails.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    // Create Razorpay order
    const razorpayOrder = await paymentService.createOrder(
      order.pricing.totalAmount,
      order.currency,
      `order_${order._id}`,
      {
        orderId: order._id.toString(),
        userId: userId.toString()
      }
    );

    // Update order
    order.paymentDetails.razorpayOrderId = razorpayOrder.orderId;
    order.paymentDetails.status = 'processing';
    await order.save();

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.orderId,
      amount: order.pricing.totalAmount,
      currency: order.currency,
      keyId: paymentService.getKeyId(),
      order: {
        id: order._id,
        totalAmount: order.pricing.totalAmount
      }
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    const userId = req.user._id;

    // Validate inputs
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment parameters'
      });
    }

    // Verify signature
    const isValid = paymentService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const order = await orderModel.findOne({ 
      _id: orderId, 
      user: userId 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Fetch payment details
    const paymentDetails = await paymentService.getPaymentDetails(razorpay_payment_id);

    // Update order
    order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    order.paymentDetails.razorpaySignature = razorpay_signature;
    order.paymentDetails.status = 'completed';
    order.paymentDetails.paidAt = new Date();
    order.paymentDetails.transactionId = razorpay_payment_id;
    order.status = 'confirmed';
    
    order.orderNotes.push({
      note: `Payment successful via ${paymentDetails.payment.method}`,
      addedBy: 'system'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        id: order._id,
        status: order.status,
        paymentStatus: order.paymentDetails.status
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
};

export const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, error } = req.body;
    const userId = req.user._id;

    const order = await orderModel.findOne({ 
      _id: orderId, 
      user: userId 
    });

    if (order) {
      order.paymentDetails.status = 'failed';
      order.orderNotes.push({
        note: `Payment failed: ${error?.description || 'Unknown error'}`,
        addedBy: 'system'
      });
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded'
    });

  } catch (error) {
    console.error('Payment failure handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle payment failure'
    });
  }
};