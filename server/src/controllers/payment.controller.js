import paymentService from '../services/payment.service.js';
import orderModel from '../models/order.model.js';
import emailService from '../services/email.service.js';
import { finalizeTicketPayment } from '../services/foodfest.ticket.service.js';

export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

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

    if (!razorpayOrder.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create Razorpay order',
        error: razorpayOrder.error
      });
    }

    // Update order with Razorpay order ID (note: service returns order_id in snake_case)
    order.paymentDetails.razorpayOrderId = razorpayOrder.order_id;
    order.paymentDetails.status = 'processing';
    await order.save();

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.order_id,
      amount: razorpayOrder.amount / 100, // Convert from paise to rupees
      currency: razorpayOrder.currency,
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

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

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
    
    // FoodFest Ticket Integration: If this is a ticket payment, finalize the ticket
    if (razorpay_order_id && razorpay_order_id.startsWith('ticket_')) {
        try {
            await finalizeTicketPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        } catch (ticketErr) {
            console.error("FoodFest ticket finalization failed:", ticketErr);
        }
    }

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
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

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

// Initiate refund for an order
export const initiateRefund = async (req, res) => {
  try {
    const { orderId, reason, amount } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const userId = req.user._id;

    // Find the order
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

    // Check if order is eligible for refund
    if (order.paymentDetails.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order payment not completed. Cannot process refund.'
      });
    }

    if (order.cancellation.refundStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Refund already processed for this order'
      });
    }

    if (!order.paymentDetails.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment ID found for refund'
      });
    }

    // Calculate refund amount (default to full order amount)
    const refundAmount = amount || order.pricing.totalAmount;

    if (refundAmount > order.pricing.totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order total'
      });
    }

    // Initiate refund with Razorpay
    const refundResult = await paymentService.refundPayment(
      order.paymentDetails.razorpayPaymentId,
      refundAmount,
      {
        orderId: orderId.toString(),
        reason: reason || 'Order cancelled by user'
      }
    );

    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate refund with payment gateway',
        error: refundResult.error
      });
    }

    // Update order with refund details
    order.cancellation.isCancelled = true;
    order.cancellation.cancelledBy = 'user';
    order.cancellation.cancelledAt = new Date();
    order.cancellation.reason = reason || 'Order cancelled by user';
    order.cancellation.refundStatus = 'processing';
    order.cancellation.refundAmount = refundAmount;
    order.status = 'cancelled';

    order.orderNotes.push({
      note: `Refund initiated: ₹${refundAmount}. Reason: ${reason || 'User cancellation'}`,
      addedBy: 'system'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refund: {
        orderId: order._id,
        refundAmount,
        refundId: refundResult.refund.id,
        status: refundResult.refund.status,
        expectedProcessingTime: '5-7 business days'
      }
    });

  } catch (error) {
    console.error('Refund initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund request'
    });
  }
};

// Handle Razorpay webhooks
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = req.body;

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(webhookBody, webhookSignature);

    if (!isValid) {
      console.error('Invalid webhook signature received');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = webhookBody.event;
    const payload = webhookBody.payload;

    console.log(`Razorpay webhook received: ${event}`);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailedWebhook(payload);
        break;

      case 'refund.processed':
        await handleRefundProcessed(payload);
        break;

      case 'refund.failed':
        await handleRefundFailed(payload);
        break;

      case 'order.paid':
        await handleOrderPaid(payload);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always respond with 200 to acknowledge webhook receipt
    res.status(200).json({ 
      success: true,
      message: 'Webhook processed'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Razorpay retries for processing errors
    res.status(200).json({ 
      success: false,
      message: 'Webhook received but processing failed'
    });
  }
};

// Helper: Handle payment captured event
const handlePaymentCaptured = async (payload) => {
  try {
    const payment = payload.payment.entity;
    const orderId = payment.notes?.orderId;

    if (!orderId) {
      console.error('Order ID not found in payment notes');
      return;
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    // Update order if payment not already marked as completed
    if (order.paymentDetails.status !== 'completed') {
      order.paymentDetails.razorpayPaymentId = payment.id;
      order.paymentDetails.status = 'completed';
      order.paymentDetails.paidAt = new Date(payment.created_at * 1000);
      order.status = 'confirmed';
      
      order.orderNotes.push({
        note: 'Payment captured via webhook',
        addedBy: 'system'
      });

      await order.save();
      console.log(`Order ${orderId} updated via payment.captured webhook`);
    }
  } catch (error) {
    console.error('Error handling payment.captured:', error);
  }
};

// Helper: Handle payment failed event from webhook
const handlePaymentFailedWebhook = async (payload) => {
  try {
    const payment = payload.payment.entity;
    const orderId = payment.notes?.orderId;

    if (!orderId) {
      console.error('Order ID not found in payment notes');
      return;
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    order.paymentDetails.status = 'failed';
    order.status = 'cancelled';
    
    order.orderNotes.push({
      note: `Payment failed via webhook: ${payment.error_description || 'Unknown error'}`,
      addedBy: 'system'
    });

    await order.save();
    console.log(`Order ${orderId} marked as failed via webhook`);
  } catch (error) {
    console.error('Error handling payment.failed webhook:', error);
  }
};

// Helper: Handle refund processed event
const handleRefundProcessed = async (payload) => {
  try {
    const refund = payload.refund.entity;
    const paymentId = refund.payment_id;

    // Find order by payment ID
    const order = await orderModel.findOne({
      'paymentDetails.razorpayPaymentId': paymentId
    });

    if (!order) {
      console.error(`Order not found for payment ID: ${paymentId}`);
      return;
    }

    order.cancellation.refundStatus = 'completed';
    order.cancellation.refundAmount = refund.amount / 100; // Convert paise to rupees
    
    order.orderNotes.push({
      note: `Refund completed: ₹${refund.amount / 100}. Refund ID: ${refund.id}`,
      addedBy: 'system'
    });

    await order.save();
    console.log(`Refund processed for order ${order._id}`);
  } catch (error) {
    console.error('Error handling refund.processed webhook:', error);
  }
};

// Helper: Handle refund failed event
const handleRefundFailed = async (payload) => {
  try {
    const refund = payload.refund.entity;
    const paymentId = refund.payment_id;

    const order = await orderModel.findOne({
      'paymentDetails.razorpayPaymentId': paymentId
    });

    if (!order) {
      console.error(`Order not found for payment ID: ${paymentId}`);
      return;
    }

    order.cancellation.refundStatus = 'failed';
    
    order.orderNotes.push({
      note: `Refund failed: ${refund.error_description || 'Unknown error'}`,
      addedBy: 'system'
    });

    await order.save();
    console.log(`Refund failed for order ${order._id}`);
  } catch (error) {
    console.error('Error handling refund.failed webhook:', error);
  }
};

// Helper: Handle order paid event
const handleOrderPaid = async (payload) => {
  try {
    const order = payload.order.entity;
    const orderId = order.notes?.orderId;

    if (!orderId) {
      console.error('Order ID not found in order notes');
      return;
    }

    const dbOrder = await orderModel.findById(orderId);
    if (!dbOrder) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    if (dbOrder.paymentDetails.status !== 'completed') {
      dbOrder.paymentDetails.status = 'completed';
      dbOrder.status = 'confirmed';
      
      dbOrder.orderNotes.push({
        note: 'Order marked as paid via webhook',
        addedBy: 'system'
      });

      await dbOrder.save();
      console.log(`Order ${orderId} marked as paid via webhook`);
    }
  } catch (error) {
    console.error('Error handling order.paid webhook:', error);
  }
};
