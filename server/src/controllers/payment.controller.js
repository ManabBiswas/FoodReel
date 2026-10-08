import paymentService from '../services/payment.service.js';
import orderModel from '../models/order.model.js';
import emailService from '../services/email.service.js';
import { finalizeTicketPayment } from '../services/foodfest.ticket.service.js';
import { verifyOrderBinding, verifyPaymentBinding, toPaise } from '../services/payment.verification.js';
import { decideWebhookAction, resolveOrderKey, ACTION } from '../services/webhook.handler.js';
import { decideRefundRequest } from '../services/refund.policy.js';
import { initiateClaimedRefund } from '../services/refund.service.js';
import { isGatewayOrderReusable } from '../services/gatewayOrderReuse.js';
import paymentWebhookEventModel from '../models/paymentWebhookEvent.model.js';

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

    if (isGatewayOrderReusable(order)) {
      console.log(`[req:${req.id}] Reusing existing gateway order for order ${order._id}`);
      return res.status(200).json({
        success: true,
        reused: true,
        razorpayOrderId: order.paymentDetails.razorpayOrderId,
        amount: (order.paymentDetails.razorpayAmount ?? toPaise(order.pricing.totalAmount)) / 100,
        currency: order.currency,
        keyId: paymentService.getKeyId(),
        order: {
          id: order._id,
          totalAmount: order.pricing.totalAmount
        }
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

    // Update order with Razorpay order ID (note: service returns order_id in snake_case).
   
    order.paymentDetails.razorpayOrderId = razorpayOrder.order_id;
    order.paymentDetails.razorpayAmount = Number.isInteger(razorpayOrder.amount)
      ? razorpayOrder.amount
      : toPaise(order.pricing.totalAmount);
    order.paymentDetails.razorpayOrderCreatedAt = new Date();
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

    // Bind the gateway order to THIS order before spending a gateway call.
    // A valid signature is not enough: without this, a cheap payment would
    // settle an expensive order.
    const local = verifyOrderBinding({ order, razorpayOrderId: razorpay_order_id });

    if (!local.ok) {
      console.error(
        `[req:${req.id}] Payment binding rejected for order ${order._id}: ${local.code}`
      );
      return res.status(local.status).json({
        success: false,
        message: local.message,
        code: local.code
      });
    }

    // Ask the gateway what was actually paid. This is the authoritative source:
    // the client-supplied amount cannot be trusted and is not used anywhere.
    let gatewayPayment = null;
    try {
      const fetched = await paymentService.getPaymentDetails(razorpay_payment_id);
      gatewayPayment = fetched?.payment ?? null;
    } catch (fetchErr) {
      console.error(`[req:${req.id}] Razorpay payment fetch failed for ${razorpay_payment_id}:`, fetchErr.message);
      return res.status(502).json({
        success: false,
        message: 'Could not confirm the payment with the payment gateway. Please retry.'
      });
    }

    // Full check now that the gateway payment is in hand: exact amount,
    // matching currency, and actually captured.
    const binding = verifyPaymentBinding({
      order,
      razorpayOrderId: razorpay_order_id,
      gatewayPayment
    });

    if (!binding.ok) {
      console.error(
        `[req:${req.id}] Payment binding rejected for order ${order._id}:`,
        JSON.stringify({
          code: binding.code,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          expectedAmount: binding.expectedAmount,
          receivedAmount: binding.receivedAmount
        })
      );
      return res.status(binding.status).json({
        success: false,
        message: binding.message,
        code: binding.code
      });
    }

    // Update order
    order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    order.paymentDetails.razorpaySignature = razorpay_signature;
    order.paymentDetails.status = 'completed';
    order.paymentDetails.paidAt = new Date();
    order.paymentDetails.transactionId = razorpay_payment_id;
    order.status = 'confirmed';
    order.statusTimestamps.confirmedAt = new Date();

    order.orderNotes.push({
      note: `Payment successful via ${gatewayPayment.method}`,
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

// Initiate refund for an order (customer-initiated)
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

    // Read-side eligibility check
    const decision = decideRefundRequest({ order, amount });

    if (!decision.allowed) {
      return res.status(decision.status).json({
        success: false,
        message: decision.message,
        code: decision.code
      });
    }

    const result = await initiateClaimedRefund({
      orderId: order._id,
      amount: decision.amount,
      initiatedBy: 'user',
      reason: reason || 'Customer requested refund'
    });

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        code: result.code,
        ...(result.error ? { error: result.error } : {})
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refund: result.refund
    });

  } catch (error) {
    console.error(`[req:${req.id}] Refund initiation error:`, error);
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
    // express.raw delivers the exact bytes Razorpay signed (Buffer).
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}), 'utf8');

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Verify webhook signature against the RAW body
    const isValid = paymentService.verifyWebhookSignature(rawBody, webhookSignature);

    if (!isValid) {
      console.error('Invalid webhook signature received');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Signature is valid — safe to parse the payload now
    const webhookBody = JSON.parse(rawBody.toString('utf8'));
    const event = webhookBody.event;
    const payload = webhookBody.payload;
    // Razorpay sends a stable id per event; it is what makes retries idempotent.
    const eventId = req.get('x-razorpay-event-id') || null;

    console.log(`Razorpay webhook received: ${event} (${eventId ?? 'no event id'})`);

    // Claim the event before doing any work. The unique index on eventId makes
    // this atomic: if two deliveries race, exactly one insert wins.
    if (eventId) {
        try {
            await paymentWebhookEventModel.create({ eventId, event, outcome: 'ignored' });
        } catch (claimErr) {
            if (claimErr?.code === 11000) {
                console.log(`Webhook ${eventId} already processed — acknowledging duplicate`);
                return res.status(200).json({ success: true, message: 'Duplicate event ignored' });
            }
            // A ledger write failure is transient (e.g. DB down). Let Razorpay retry.
            console.error(`[req:${req.id}] Webhook ledger claim failed for ${eventId}:`, claimErr.message);
            return res.status(500).json({ success: false, message: 'Webhook could not be recorded' });
        }
    }

    // Pull the entity out of the event-specific payload shape
    const entity =
        payload?.payment?.entity ??
        payload?.refund?.entity ??
        payload?.order?.entity ??
        null;

    // Locate the order this event refers to
    const lookup = resolveOrderKey(event, entity);
    let order = null;
    if (lookup.byId) {
        order = await orderModel.findById(lookup.byId).catch(() => null);
    } else if (lookup.byPaymentId) {
        order = await orderModel
            .findOne({ 'paymentDetails.razorpayPaymentId': lookup.byPaymentId })
            .catch(() => null);
    } else if (lookup.byRazorpayOrderId) {
        order = await orderModel
            .findOne({ 'paymentDetails.razorpayOrderId': lookup.byRazorpayOrderId })
            .catch(() => null);
    }

    const decision = decideWebhookAction({ event, entity, order });
    await recordWebhookOutcome(eventId, decision);

    switch (decision.action) {
        case ACTION.APPLY:
            await applyWebhookChanges(order, decision);
            break;

        case ACTION.REJECT:
            // The event is authentic but contradicts our records. Acknowledge it —
            console.error(
                `[req:${req.id}] Webhook REJECTED ${event}:`,
                JSON.stringify({
                    code: decision.code,
                    message: decision.message,
                    order: order?._id,
                    lookup,
                    expectedAmount: decision.expectedAmount,
                    receivedAmount: decision.receivedAmount,
                })
            );
            break;

        default:
            console.log(`Webhook ${event} ignored: ${decision.reason}`);
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 5xx so Razorpay retries. The previous behaviour acknowledged every
    // failure with 200, which silently discarded any event we failed to handle.
    if (eventId) await recordWebhookOutcome(eventId, { action: 'reject', code: 'PROCESSING_ERROR' }, true);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// Record why an event was handled the way it was, for later auditing.
const recordWebhookOutcome = async (eventId, decision, isError = false) => {
  if (!eventId) return;
  const outcome = isError
    ? 'error'
    : decision.action === ACTION.APPLY
      ? 'applied'
      : decision.action === ACTION.REJECT
        ? 'rejected'
        : 'ignored';
  try {
    await paymentWebhookEventModel.updateOne(
      { eventId },
      { $set: { outcome, detail: decision.reason || decision.code || decision.message } }
    );
  } catch (e) {
    console.error('Failed to record webhook outcome:', e.message);
  }
};

// Apply a decision. Each field is written only when the decision allows it.
const applyWebhookChanges = async (order, decision) => {
  if (!order) return;
  const { changes, note, paidAt } = decision;

  if (changes.paymentStatus) {
    order.paymentDetails.status = changes.paymentStatus;
    if (changes.paymentStatus === 'completed') {
      if (changes.razorpayPaymentId) order.paymentDetails.razorpayPaymentId = changes.razorpayPaymentId;
      order.paymentDetails.paidAt = paidAt || new Date();
      order.paymentDetails.transactionId = changes.razorpayPaymentId;
    }
  }

  if (changes.orderStatus) {
    order.status = changes.orderStatus;
    if (changes.orderStatus === 'confirmed') order.statusTimestamps.confirmedAt = new Date();
    if (changes.orderStatus === 'cancelled') {
      order.cancellation.isCancelled = true;
      order.cancellation.cancelledBy = order.cancellation.cancelledBy || 'system';
      order.cancellation.cancelledAt = order.cancellation.cancelledAt || new Date();
    }
  }

  if (changes.refundStatus) {
    order.cancellation.refundStatus = changes.refundStatus;
    if (changes.refundAmount !== undefined) order.cancellation.refundAmount = changes.refundAmount;
  }

  if (note) order.orderNotes.push({ note, addedBy: 'system' });

  await order.save();
  console.log(`Webhook applied to order ${order._id}: ${JSON.stringify(changes)}`);
};
