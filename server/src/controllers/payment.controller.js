import paymentService from '../services/payment.service.js';
import couponService from '../services/coupon.service.js';
import { serverFail } from '../utils/apiError.js';
import orderModel from '../models/order.model.js';
import mongoose from 'mongoose';
import emailService from '../services/email.service.js';
import { finalizeTicketPayment } from '../services/foodfest.ticket.service.js';
import { verifyOrderBinding, verifyPaymentBinding, toPaise } from '../services/payment.verification.js';
import { initiateClaimedRefund } from '../services/refund.service.js';
import { decideWebhookAction, resolveOrderKey, ACTION } from '../services/webhook.handler.js';
import { isGatewayOrderReusable, GATEWAY_ORDER_REUSE_WINDOW_MS } from '../services/gatewayOrderReuse.js';
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

    // Claim the gateway-order slot atomically before calling Razorpay, so a
    // double-click cannot mint two gateway orders.
    const claimed = await orderModel.findOneAndUpdate(
        {
            _id: orderId,
            user: userId,
            'paymentDetails.razorpayOrderId': { $exists: false },
            status: { $nin: ['cancelled', 'cancel_requested'] },
            // A concurrent request may have claimed the slot but not yet written the gateway order id.
            // If the slot is already in-flight, Only claim when the slot is untouched, or the in-flight claim has gone stale (crashed process) — otherwise the second click mints a second order.
            $or: [
                { 'paymentDetails.status': { $ne: 'processing' } },
                { 'paymentDetails.razorpayOrderCreatedAt': { $exists: false } },
                { 'paymentDetails.razorpayOrderCreatedAt': { $lt: new Date(Date.now() - GATEWAY_ORDER_REUSE_WINDOW_MS) } },
            ],
        },
        {
            $set: {
                'paymentDetails.status': 'processing',
                'paymentDetails.razorpayOrderCreatedAt': new Date(),
            },
        },
        { new: true }
    );

    if (!claimed) {
        // Someone else claimed the slot (or it is cancelled). If a gateway
        // order id now exists, reuse it; otherwise the order cannot be paid.
        const current = await orderModel
            .findById(orderId)
            .select('paymentDetails status pricing')
            .lean();
        if (current?.paymentDetails?.razorpayOrderId) {
            return res.status(200).json({
                success: true,
                reused: true,
                razorpayOrderId: current.paymentDetails.razorpayOrderId,
                amount:
                    (current.paymentDetails.razorpayAmount ??
                        toPaise(current.pricing?.totalAmount ?? 0)) /
                    100,
                currency: order.currency,
                keyId: paymentService.getKeyId(),
                order: {
                    id: order._id,
                    totalAmount: current.pricing?.totalAmount ?? order.pricing.totalAmount,
                },
            });
        }
        return res.status(409).json({
            success: false,
            message: 'This order cannot be paid (already cancelled or being processed).',
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
        // Release the claim so a retry can re-enter.
        await orderModel.updateOne(
            { _id: orderId },
            {
                $unset: { 'paymentDetails.razorpayOrderCreatedAt': '' },
                $set: { 'paymentDetails.status': 'pending' },
            }
        );
        return res.status(500).json({
          success: false,
          message: 'Failed to create Razorpay order',
          error: razorpayOrder.error
        });
    }

    // Write the gateway order id onto the claimed slot.
    const razorpayAmount = Number.isInteger(razorpayOrder.amount)
      ? razorpayOrder.amount
      : toPaise(order.pricing.totalAmount);

    await orderModel.updateOne(
        { _id: orderId },
        {
            $set: {
                'paymentDetails.razorpayOrderId': razorpayOrder.order_id,
                'paymentDetails.razorpayAmount': razorpayAmount,
            },
        }
    );

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
    serverFail(res, error, 'Failed to create payment order');
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

    // Count the redemption exactly once. The order-level `consumedAt` claim in the service makes this safe even when the webhook lands at the same time.
    if (order.coupon?.couponId) {
      const consumed = await couponService.consumeCoupon(order);
      if (!consumed.ok) {
        console.error(`[req:${req.id}] Coupon consume failed for order ${order._id}: ${consumed.code}`);
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
    serverFail(res, error, 'Payment verification failed');
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

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'orderId must be a valid id'
      });
    }

    const description = typeof error?.description === 'string'
      ? error.description.slice(0, 500)
      : 'Unknown error';

    // Update order
    const order = await orderModel.findOneAndUpdate(
      {
        _id: orderId,
        user: req.user._id,
        'paymentDetails.method': 'razorpay',
        'paymentDetails.status': { $in: ['pending', 'processing'] }
      },
      {
        $set: { 'paymentDetails.status': 'failed' },
        $push: {
          orderNotes: {
            note: `Payment failed: ${description}`,
            addedBy: 'system'
          }
        }
      },
      { new: true }
    );

    if (order) {
      return res.status(200).json({
        success: true,
        message: 'Payment failure recorded'
      });
    }

    const existing = await orderModel
      .findOne({ _id: orderId, user: req.user._id })
      .select('paymentDetails.status')
      .lean();

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Retrying the same failure notification is harmless.
    if (existing.paymentDetails?.status === 'failed') {
      return res.status(200).json({
        success: true,
        message: 'Payment failure already recorded'
      });
    }

    return res.status(409).json({
      success: false,
      code: 'PAYMENT_NOT_FAILABLE',
      message: 'This payment can no longer be marked as failed'
    });

  } catch (error) {
    console.error('Payment failure handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle payment failure'
    });
  }
};

// Handle Razorpay webhooks
export const razorpayWebhook = async (req, res) => {
  // Declared OUTSIDE the try: the catch block reads it to record the failure,
  // and a `const` inside the try would be in the temporal dead zone if an
  // error fired before its declaration (e.g. JSON.parse).
  let eventId = null;
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
    eventId = req.get('x-razorpay-event-id') || null;

    console.log(`Razorpay webhook received: ${event} (${eventId ?? 'no event id'})`);

    // Claim the event before doing any work. The unique index on eventId makes
    // this atomic: if two deliveries race, exactly one insert wins.
    if (eventId) {
        try {
            // Provisional "error": recordWebhookOutcome() replaces it with the
            // real outcome. If the process dies mid-delivery the row stays
            // retryable instead of being acked as a duplicate.
            await paymentWebhookEventModel.create({ eventId, event, outcome: 'error' });
        } catch (claimErr) {
            if (claimErr?.code === 11000) {
                // A previous delivery created this row. If that attempt failed
                // (outcome "error"), Razorpay is retrying us: remove the failed
                // ledger row and process the event again.
                const removed = await paymentWebhookEventModel
                    .deleteOne({ eventId, outcome: 'error' })
                    .catch((deleteErr) => {
                        console.error(`[req:${req.id}] Webhook retry claim failed for ${eventId}:`, deleteErr.message);
                        return { deletedCount: 0 };
                    });

                if (removed.deletedCount === 1) {
                    console.log(`Webhook ${eventId} retrying after a failed attempt`);
                } else {
                    console.log(`Webhook ${eventId} already processed — acknowledging duplicate`);
                    return res.status(200).json({ success: true, message: 'Duplicate event ignored' });
                }
            } else {
                // A ledger write failure is transient (e.g. DB down). Let Razorpay retry.
                console.error(`[req:${req.id}] Webhook ledger claim failed for ${eventId}:`, claimErr.message);
                return res.status(500).json({ success: false, message: 'Webhook could not be recorded' });
            }
        }
    }

    // Pull the entity out of the event-specific payload shape
    const entity =
        payload?.payment?.entity ??
        payload?.refund?.entity ??
        payload?.order?.entity ??
        null;

    // FoodFest tickets are not Orders - they live in their own collection, so
    // the order lookup below would never find them. Without this branch a ticket
    // paid over Razorpay stayed pending_payment and the sweeper later expired a
    // ticket the customer had actually paid for. The marker is written by
    // purchaseTicket as notes.kind.

    const entityForTickets = payload?.payment?.entity ?? null;
    if (
        event === 'payment.captured' &&
        entityForTickets?.notes?.kind === 'foodfest_ticket'
    ) {
        const result = await finalizeTicketPayment(
            entityForTickets.order_id,
            entityForTickets.id,
            null // webhook already authenticated the event; no signature to re-check
        );

        const settled = Boolean(result?.success || result?.alreadyFinalised);
        const retryable = Boolean(result?.retryable);

        // Record the real outcome.
        await recordWebhookOutcome(
            eventId,
            {
                action: settled ? ACTION.APPLY : ACTION.REJECT,
                reason: result?.code || (result?.alreadyFinalised ? 'already_finalised' : 'foodfest_ticket')
            },
            retryable
        );

        if (retryable) {
            // The money was captured but the refund is not done yet 
            // A 200 would make Razorpay drop the event, so fail the delivery to trigger a retry.
            console.error(
                `[req:${req.id}] FoodFest ticket refund pending:`,
                result?.code || 'unknown'
            );
            return res.status(503).json({
                success: false,
                handled: 'foodfest_ticket',
                finalized: false,
                refunded: false,
                retryable: true
            });
        }

        if (!settled) {
            console.error(
                `[req:${req.id}] FoodFest ticket not finalized:`,
                result?.code || 'unknown',
                result?.refunded ? `(auto-refund ${result.refundId})` : '(no refund recorded)'
            );
        }

        return res.status(200).json({
            success: true,
            handled: 'foodfest_ticket',
            finalized: Boolean(result?.success),
            refunded: Boolean(result?.refunded)
        });
    }

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
            // The capture is HMAC-authentic and money really moved, so hand it
            // back instead of only logging. Two shapes:
            //  - we never recorded this capture (cancelled order, verify never
            //    ran): record it, then run the standard guarded refund;
            //  - a second payment against an order already settled by another:
            //    refund THAT payment — never the one that settled the order.
            if (
                order &&
                (decision.code === 'ORDER_CANCELLED' || decision.code === 'DUPLICATE_CAPTURE') &&
                order.paymentDetails?.status !== 'refunded'
            ) {
                const capturedId = typeof entity?.id === 'string' ? entity.id : null;
                const capturedPaise =
                    Number.isInteger(entity?.amount) && entity.amount > 0 ? entity.amount : null;
                const storedId = order.paymentDetails?.razorpayPaymentId || null;

                if (storedId && capturedId && storedId !== capturedId) {
                    // Duplicate capture -> one-time claim  
                    const claimedExtra = await orderModel.findOneAndUpdate(
                        {
                            _id: order._id,
                            'paymentDetails.duplicateRefundPaymentId': { $exists: false },
                        },
                        { $set: { 'paymentDetails.duplicateRefundPaymentId': capturedId } },
                        { new: true }
                    );
                    if (claimedExtra && capturedPaise) {
                        // refundPayment takes RUPEES (it multiplies by 100 for
                        // the gateway) and rethrows gateway errors, so the
                        // one-time claim must be released from a catch too.
                        try {
                            const result = await paymentService.refundPayment(capturedId, capturedPaise / 100, {
                                orderId: String(order._id),
                                reason: `Webhook ${decision.code}: ${decision.message}`,
                            });
                            if (result?.success) {
                                await orderModel.updateOne(
                                    { _id: order._id },
                                    {
                                        $push: {
                                            orderNotes: {
                                                note: `Refund of duplicate payment ${capturedId} initiated (₹${capturedPaise / 100})`,
                                                addedBy: 'system',
                                            },
                                        },
                                    }
                                );
                            } else {
                                throw new Error(result?.error || 'unknown error');
                            }
                        } catch (err) {
                            await orderModel.updateOne(
                                { _id: order._id, 'paymentDetails.duplicateRefundPaymentId': capturedId },
                                { $unset: { 'paymentDetails.duplicateRefundPaymentId': '' } }
                            );
                            console.error(
                                `[req:${req.id}] Duplicate-capture refund failed for ${capturedId}:`,
                                err?.message || 'unknown error'
                            );
                        }
                    }
                } else {
                    // Capture we never recorded: write it onto the order (the
                    // webhook is authentic), then the standard claim+refund
                    // path owns the money movement and its idempotency.
                    const marked = await orderModel.findOneAndUpdate(
                        {
                            _id: order._id,
                            'paymentDetails.status': { $nin: ['completed', 'refunded'] },
                        },
                        {
                            $set: {
                                'paymentDetails.razorpayPaymentId': storedId || capturedId,
                                'paymentDetails.status': 'completed',
                                ...(capturedPaise
                                    ? { 'paymentDetails.razorpayAmount': capturedPaise }
                                    : {}),
                            },
                        },
                        { new: true }
                    );
                    if (marked) {
                        // initiateClaimedRefund takes rupees, not paise —
                        // refundPayment multiplies by 100 before the gateway call.
                        const refundAmount = capturedPaise
                            ? capturedPaise / 100
                            : Number(marked.pricing?.totalAmount) || 0;
                        if (refundAmount > 0) {
                            const claimed = await initiateClaimedRefund({
                                orderId: order._id,
                                amount: refundAmount,
                                initiatedBy: 'system',
                                reason: `Webhook ${decision.code}: ${decision.message}`,
                            });
                            if (!claimed?.ok) {
                                console.error(
                                    `[req:${req.id}] Webhook refund not started for order ${order._id}: ${claimed?.code || 'unknown'}`
                                );
                            }
                        }
                    }
                }
            }
            // Acknowledge regardless — retrying will not fix bad data.
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

  // A webhook can be the only payment-success signal (the customer closed the
  // tab). Count the redemption here too; the service is idempotent.
  if (changes.paymentStatus === 'completed' && order.coupon?.couponId) {
    const consumed = await couponService.consumeCoupon(order);
    if (!consumed.ok) {
      console.error(`Webhook coupon consume failed for order ${order._id}: ${consumed.code}`);
    }
  }

  console.log(`Webhook applied to order ${order._id}: ${JSON.stringify(changes)}`);
};
