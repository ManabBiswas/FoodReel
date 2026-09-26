import orderModel from "../models/order.model.js";
import foodModel from "../models/food.model.js";
import userModel from "../models/user.Model.js";
import paymentService from "../services/payment.service.js";
import emailService from "../services/email.service.js";

const createOrder = async (req, res) => {
  try {
    const {
      items = [], // array of { foodItemId, quantity }
      deliveryAddress,
      specialInstructions,
      orderNotes,
      orderSource = 'cart',
      paymentMethod = 'cod'
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const userId = req.user._id;

    // Validate required fields
    if (!items.length || !deliveryAddress) {
      return res.status(400).json({
        error: "At least one food item and delivery address are required"
      });
    }

    // Validate delivery address
    const { fullName, phone, addressLine1, city, state, pincode } = deliveryAddress;
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        error: "Complete delivery address is required (fullName, phone, addressLine1, city, state, pincode)"
      });
    }
    // Order schema enforces /^(0?[6-9]\d{9})$/ — validate here so a bad phone
    // is a 400, not a Mongoose ValidationError → 500.
    if (!/^0?[6-9]\d{9}$/.test(String(phone).trim())) {
      return res.status(400).json({
        error: "Phone must be a valid 10-digit Indian mobile number"
      });
    }
    // paymentDetails.method enum in order.model.js is ['razorpay', 'cod'] —
    // validate here so an unknown value is a 400, not a ValidationError → 500.
    if (!['razorpay', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ error: `Invalid payment method: ${paymentMethod}` });
    }

    // Build items array with validation
    const orderItems = [];
    let itemPriceTotal = 0;
    const prepTimes = [];

    for (const { foodItemId, quantity = 1 } of items) {
      const foodItem = await foodModel.findById(foodItemId).populate('foodPartner');
      if (!foodItem) {
        return res.status(404).json({ error: `Food item ${foodItemId} not found` });
      }
      if (foodItem.postType !== 'food') {
        return res.status(400).json({ error: `${foodItem.name} is not orderable` });
      }
      if (!foodItem.price || foodItem.price <= 0) {
        return res.status(400).json({ error: `${foodItem.name} has no valid price` });
      }
      // Schema requires items.foodPartner — a food item without a partner used
      // to throw `foodItem.foodPartner._id` (TypeError → 500).
      if (!foodItem.foodPartner) {
        return res.status(400).json({ error: `${foodItem.name} has no restaurant assigned` });
      }

      const qty = parseInt(quantity);
      if (!Number.isFinite(qty) || qty < 1 || qty > 100) {
        return res.status(400).json({ error: `Invalid quantity for ${foodItem.name}` });
      }
      const subtotal = foodItem.price * qty;
      itemPriceTotal += subtotal;

      prepTimes.push(foodItem.preparationTime || 20);

      orderItems.push({
        foodItem: foodItem._id,
        quantity: qty,
        priceAtOrder: foodItem.price,
        foodPartner: foodItem.foodPartner._id
      });
    }

    // Calculate pricing (subtotal + fees + taxes - discounts)
    const pricing = paymentService.calculatePricing(itemPriceTotal);

    // Estimated delivery time (max prep time among items + delivery buffer).
    // Uses prepTimes collected above — no N+1 refetch per item.
    const deliveryTime = 30;
    const estimatedDeliveryTime = new Date(Date.now() + (Math.max(...prepTimes) + deliveryTime) * 60 * 1000);

    // Create order
    const orderData = {
      user: userId,
      items: orderItems,
      currency: 'INR',
      deliveryAddress,
      specialInstructions: specialInstructions || orderNotes || '',
      estimatedDeliveryTime,
      orderSource,
      pricing,
      status: 'pending',
      paymentDetails: {
        method: paymentMethod,
        status: 'pending'
      },
      orderNotes: [{
        note: `Order placed with ${orderItems.length} items`,
        addedBy: 'system'
      }]
    };

    const newOrder = await orderModel.create(orderData);

    // Populate related data
    await newOrder.populate([
      { path: 'user', select: 'firstName lastName email mobile' },
      { path: 'items.foodItem', select: 'name description image video price currency preparationTime postType' },
      { path: 'items.foodPartner', select: 'companyName email mobile address' }
    ]);

    // Update user order history
    await userModel.findByIdAndUpdate(
      userId,
      { $push: { orderHistory: newOrder._id } }
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
      orderId: newOrder._id
    });

    // Send order confirmation email (fire-and-forget)
    if (newOrder.user?.email) {
      const p = newOrder.pricing || {};
      const addr = newOrder.deliveryAddress || {};
      const orderDetails = {
        orderId: newOrder._id,
        items: newOrder.items.map(item => ({
          name: item.foodItem?.name || 'Food Item',
          quantity: item.quantity,
          price: item.priceAtOrder
        })),
        itemTotal: p.itemPrice || 0,
        deliveryFee: p.deliveryFee || 0,
        platformFee: p.platformFee || 0,
        gst: p.taxes?.gst || 0,
        grandTotal: p.totalAmount || 0,
        deliveryAddress: `${addr.addressLine1 || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`,
        estimatedTime: newOrder.estimatedDeliveryTime
          ? new Date(newOrder.estimatedDeliveryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : '30 - 45 minutes'
      };
      emailService.sendOrderConfirmationEmail(
        newOrder.user.email,
        newOrder.user.firstName,
        orderDetails
      ).catch(err => console.error('Failed to send order confirmation email:', err.message));
    }

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      error: "Failed to create order",
      details: error.message
    });
  }
};

const getUserOrders = async (req, res) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;

        // Build filter
        const filter = { user: req.user._id };
        if (status && ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
            filter.status = status;
        }

        // Calculate pagination
        const validLimit = Math.min(parseInt(limit), 50);
        const skip = (parseInt(page) - 1) * validLimit;

        const orders = await orderModel
            .find(filter)
            .populate('user', 'firstName lastName email mobile')
            .populate('items.foodItem', 'name description image video price currency preparationTime postType')
            .populate('items.foodPartner', 'companyName email mobile address')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(validLimit);

        const totalCount = await orderModel.countDocuments(filter);

        res.status(200).json({
            message: "Orders retrieved successfully",
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / validLimit),
                totalCount,
                hasNextPage: skip + validLimit < totalCount
            }
        });

    } catch (error) {
        console.error("Error getting user orders:", error);
        res.status(500).json({ error: error.message });
    }
};

const getPartnerOrders = async (req, res) => {
    try {
        const { status, limit = 20, page = 1 } = req.query;

        // Build filter
        const filter = { 'items.foodPartner': req.foodPartner._id };
        if (status && ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
            filter.status = status;
        }

        // Calculate pagination
        const validLimit = Math.min(parseInt(limit), 100);
        const skip = (parseInt(page) - 1) * validLimit;

        const orders = await orderModel
            .find(filter)
            .populate('user', 'firstName lastName email mobile')
            .populate('items.foodItem', 'name description image video price currency preparationTime')
            .populate('items.foodPartner', 'companyName email mobile address')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(validLimit);

        const totalCount = await orderModel.countDocuments(filter);

        res.status(200).json({
            message: "Partner orders retrieved successfully",
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / validLimit),
                totalCount,
                hasNextPage: skip + validLimit < totalCount
            }
        });

    } catch (error) {
        console.error("Error getting partner orders:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, note } = req.body;

        if (!status || !['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: "Valid status is required" });
        }

        // Find order that contains items from this food partner
        const order = await orderModel.findOne({
            _id: orderId,
            'items.foodPartner': req.foodPartner._id
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found or you don't have permission to update it" });
        }

        // Check if order is cancelled - prevent any status changes
        if (order.cancellation?.isCancelled || order.status === 'cancelled') {
            return res.status(400).json({ 
                error: "Cannot update status of a cancelled order",
                message: "This order has been cancelled and cannot be modified"
            });
        }

        // Prevent invalid status transitions
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready'],
            'ready': ['delivered'],
            'delivered': [],
            'cancelled': []
        };

        if (!validTransitions[order.status]?.includes(status)) {
            return res.status(400).json({ 
                error: `Cannot change status from ${order.status} to ${status}`,
                validTransitions: validTransitions[order.status]
            });
        }

        // Update status
        order.status = status;

        // Add timestamp for specific statuses
        if (status === 'confirmed') {
            order.statusTimestamps = order.statusTimestamps || {};
            order.statusTimestamps.confirmedAt = new Date();
        } else if (status === 'delivered') {
            order.statusTimestamps = order.statusTimestamps || {};
            order.statusTimestamps.deliveredAt = new Date();
        }

        // Add status note
        if (note) {
            order.orderNotes.push({
                note: note,
                addedBy: 'partner'
            });
        } else {
            order.orderNotes.push({
                note: `Order status updated to ${status}`,
                addedBy: 'partner'
            });
        }

        await order.save();

        await order.populate([
            { path: 'user', select: 'firstName lastName email mobile' },
            { path: 'items.foodItem', select: 'name description image video price currency' },
            { path: 'items.foodPartner', select: 'companyName email mobile' }
        ]);

        // Send email notification when order is ready (fire-and-forget)
        if (status === 'ready' && order.user?.email) {
          const partnerName = order.items[0]?.foodPartner?.companyName || 'FoodReel Partner';
          const orderDetails = {
            orderId: order._id,
            partnerName,
            estimatedDelivery: order.estimatedDeliveryTime
              ? new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : 'Soon',
            trackingUrl: `${process.env.FRONTEND_URL}/order/tracking/${order._id}`
          };
          emailService.sendOrderShippedEmail(
            order.user.email,
            order.user.firstName,
            orderDetails
          ).catch(err => console.error('Failed to send order ready email:', err.message));
        }

        res.status(200).json({
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: error.message });
    }
};
const getOrderStatistics = async (req, res) => {
    try {
        const partnerId = req.foodPartner._id;

        // Get statistics for orders with this partner's items
        const stats = await orderModel.aggregate([
            {
                // Match orders that have items from this partner
                $match: { 'items.foodPartner': partnerId }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$pricing.totalAmount" }
                }
            }
        ]);

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayStats = await orderModel.aggregate([
            {
                $match: {
                    'items.foodPartner': partnerId,
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    todayOrders: { $sum: 1 },
                    todayRevenue: { $sum: "$pricing.totalAmount" }
                }
            }
        ]);

        // Delivered revenue: total and a 7-day series. Computed here (not on the
        // client) so the numbers cover every order, not just the current page.
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setHours(0, 0, 0, 0);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const deliveredStats = await orderModel.aggregate([
            {
                $match: {
                    'items.foodPartner': partnerId,
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: null,
                    deliveredRevenue: { $sum: "$pricing.totalAmount" },
                    deliveredOrders: { $sum: 1 }
                }
            }
        ]);

        const revenueByDay = await orderModel.aggregate([
            {
                $match: {
                    'items.foodPartner': partnerId,
                    status: 'delivered',
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$pricing.totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            message: "Order statistics retrieved successfully",
            statistics: {
                byStatus: stats,
                today: todayStats[0] || { todayOrders: 0, todayRevenue: 0 },
                delivered: deliveredStats[0] || { deliveredRevenue: 0, deliveredOrders: 0 },
                revenueByDay
            }
        });

    } catch (error) {
        console.error("Error getting order statistics:", error);
        res.status(500).json({ error: error.message });
    }
};
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await orderModel
            .findOne({ _id: orderId })
            .populate('user', 'firstName lastName email mobile')
            .populate('items.foodItem', 'name description image video price currency preparationTime postType')
            .populate('items.foodPartner', 'companyName email mobile address');

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Unauthorized access to this order" });
        }

        res.status(200).json({
            message: "Order retrieved successfully",
            order
        });

    } catch (error) {
        console.error("Error getting order:", error);
        res.status(500).json({ error: 'Failed to retrieve order', details: error.message });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';

        const order = await orderModel.findById(orderId)
            .populate('user', 'firstName lastName email mobile')
            .populate('items.foodItem', 'name price')
            .populate('items.foodPartner', 'companyName email');

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Verify user owns this order
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Unauthorized to cancel this order" });
        }

        // Check if already cancelled
        if (order.cancellation?.isCancelled || order.status === 'cancelled') {
            return res.status(400).json({ 
                error: "Order is already cancelled",
                cancelledAt: order.cancellation?.cancelledAt,
                cancelledBy: order.cancellation?.cancelledBy
            });
        }

        // Check if order can be cancelled (only pending, confirmed, or preparing)
        if (!['pending', 'confirmed', 'preparing'].includes(order.status)) {
            return res.status(400).json({ 
                error: `Cannot cancel order in ${order.status} status`,
                message: `Orders can only be cancelled when pending, confirmed, or preparing. Current status: ${order.status}` 
            });
        }

        // Update cancellation info
        order.cancellation = {
            isCancelled: true,
            cancelledBy: 'user',
            cancelledAt: new Date(),
            reason: reason || 'Customer requested cancellation',
            refundStatus: order.paymentDetails.method === 'cod' ? 'not_applicable' : 'pending',
            refundAmount: order.paymentDetails.status === 'completed' ? order.pricing.totalAmount : 0
        };
        order.status = 'cancelled';

        // Add cancellation note
        order.orderNotes.push({
            note: `Order cancelled by customer. Reason: ${reason || 'Customer requested cancellation'}`,
            addedBy: 'user'
        });

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order,
            refundInfo: order.cancellation.refundStatus !== 'not_applicable' 
                ? { status: order.cancellation.refundStatus, amount: order.cancellation.refundAmount }
                : null
        });

        // Send order cancelled email (fire-and-forget)
        if (order.user?.email) {
          const orderDetails = {
            orderId: order._id,
            items: order.items.map(item => ({
              name: item.foodItem?.name || 'Food Item',
              quantity: item.quantity,
              price: item.priceAtOrder
            })),
            totalAmount: order.pricing?.grandTotal || order.pricing?.totalAmount,
            reason: order.cancellation.reason,
            cancelledBy: order.cancellation.cancelledBy,
            cancelledAt: order.cancellation.cancelledAt,
            refundStatus: order.cancellation.refundStatus,
            refundAmount: order.cancellation.refundAmount
          };
          emailService.sendOrderCancelledEmail(
            order.user.email,
            order.user.firstName,
            orderDetails
          ).catch(err => console.error('Failed to send order cancelled email:', err.message));
        }

    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ error: 'Failed to cancel order', details: error.message });
    }
};

const partnerCancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';

        // Find order that contains items from this food partner
        const order = await orderModel.findOne({
            _id: orderId,
            'items.foodPartner': req.foodPartner._id
        })
            .populate('user', 'firstName lastName email mobile')
            .populate('items.foodItem', 'name price')
            .populate('items.foodPartner', 'companyName email');

        if (!order) {
            return res.status(404).json({ error: "Order not found or you don't have permission to cancel it" });
        }

        // Check if already cancelled
        if (order.cancellation?.isCancelled || order.status === 'cancelled') {
            return res.status(400).json({ 
                error: "Order is already cancelled",
                cancelledAt: order.cancellation?.cancelledAt,
                cancelledBy: order.cancellation?.cancelledBy
            });
        }

        // Partners can only cancel pending or confirmed orders
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({ 
                error: `Cannot cancel order in ${order.status} status`,
                message: `Partners can only cancel orders when pending or confirmed. Current status: ${order.status}` 
            });
        }

        // Update cancellation info
        order.cancellation = {
            isCancelled: true,
            cancelledBy: 'partner',
            cancelledAt: new Date(),
            reason: reason || 'Cancelled by food partner',
            refundStatus: order.paymentDetails.method === 'cod' ? 'not_applicable' : 'pending',
            refundAmount: order.paymentDetails.status === 'completed' ? order.pricing.totalAmount : 0
        };
        order.status = 'cancelled';

        // Add cancellation note
        order.orderNotes.push({
            note: `Order cancelled by partner. Reason: ${reason || 'Cancelled by food partner'}`,
            addedBy: 'partner'
        });

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully by partner",
            order,
            refundInfo: order.cancellation.refundStatus !== 'not_applicable' 
                ? { status: order.cancellation.refundStatus, amount: order.cancellation.refundAmount }
                : null
        });

        // Send order cancelled email (fire-and-forget)
        if (order.user?.email) {
          const orderDetails = {
            orderId: order._id,
            items: order.items.map(item => ({
              name: item.foodItem?.name || 'Food Item',
              quantity: item.quantity,
              price: item.priceAtOrder
            })),
            totalAmount: order.pricing?.grandTotal || order.pricing?.totalAmount,
            reason: reason || 'Cancelled by food partner',
            cancelledBy: 'partner',
            refundStatus: order.cancellation.refundStatus,
            refundAmount: order.cancellation.refundAmount
          };
          emailService.sendOrderCancelledEmail(
            order.user.email,
            order.user.firstName,
            orderDetails
          ).catch(err => console.error('Failed to send order cancelled email:', err.message));
        }

    } catch (error) {
        console.error("Error cancelling order (partner):", error);
        res.status(500).json({ error: 'Failed to cancel order', details: error.message });
    }
};

// DEV-ONLY: Manually update order status and send email (for testing after direct DB changes)
const devUpdateOrderStatusAndEmail = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is only available in development mode' });
  }
  
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Valid status required: pending, confirmed, preparing, ready, delivered, or cancelled" });
    }

    const order = await orderModel.findById(orderId)
      .populate('user', 'firstName lastName email')
      .populate('items.foodPartner', 'companyName');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update status
    order.status = status;
    await order.save();

    // Send email if transitioning to 'ready'
    if (status === 'ready' && order.user?.email) {
      const partnerName = order.items[0]?.foodPartner?.companyName || 'FoodReel Partner';
      const orderDetails = {
        orderId: order._id,
        partnerName,
        estimatedDelivery: order.estimatedDeliveryTime
          ? new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : 'Soon',
        trackingUrl: `${process.env.FRONTEND_URL}/order/tracking/${order._id}`
      };
      
      emailService.sendOrderShippedEmail(
        order.user.email,
        order.user.firstName,
        orderDetails
      )
        .then(() => console.log(`✅ Ready email sent to ${order.user.email}`))
        .catch(err => console.error('❌ Failed to send ready email:', err.message));
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status} and email sent if applicable`,
      order: {
        id: order._id,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Dev update order status error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getPartnerOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await orderModel
            .findOne({ _id: orderId, 'items.foodPartner': req.foodPartner._id })
            .populate('user', 'firstName lastName email mobile')
            .populate('items.foodItem', 'name description image video price currency preparationTime')
            .populate('items.foodPartner', 'companyName email mobile address');

        if (!order) {
            return res.status(404).json({ error: "Order not found or permission denied" });
        }

        // A mixed-partner order must not expose another vendor's items.
        const ownItems = (order.items || []).filter(
            item => item.foodPartner?._id?.toString() === req.foodPartner._id.toString()
        );

        res.status(200).json({
            message: "Order retrieved successfully",
            order: { ...order.toObject(), items: ownItems }
        });

    } catch (error) {
        console.error("Error getting partner order:", error);
        res.status(500).json({ error: 'Failed to retrieve order', details: error.message });
    }
};

export default {
    createOrder,
    getUserOrders,
    getPartnerOrders,
    updateOrderStatus,
    getOrderById,
    getPartnerOrderById,
    getOrderStatistics,
    cancelOrder,
    partnerCancelOrder,
    devUpdateOrderStatusAndEmail
};