import orderModel from "../models/order.model.js";
import foodModel from "../models/food.model.js";
import userModel from "../models/user.Model.js";
import paymentService from "../services/payment.service.js";

const createOrder = async (req, res) => {
  try {
    const {
      items = [], // array of { foodItemId, quantity }
      deliveryAddress,
      specialInstructions,
      orderNotes,
      orderSource = 'modal',
      paymentMethod = 'cod'
    } = req.body;

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

    // Build items array with validation
    const orderItems = [];
    let itemPriceTotal = 0;

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

      const qty = parseInt(quantity);
      const subtotal = foodItem.price * qty;
      itemPriceTotal += subtotal;

      orderItems.push({
        foodItem: foodItem._id,
        quantity: qty,
        priceAtOrder: foodItem.price,
        foodPartner: foodItem.foodPartner._id
      });
    }

    // Calculate pricing (subtotal + fees + taxes - discounts)
    const pricing = paymentService.calculatePricing(itemPriceTotal);

    // Estimated delivery time (max prep time among items + delivery buffer)
    const maxPrepTime = await Promise.all(orderItems.map(async i => {
      const food = await foodModel.findById(i.foodItem);
      return food.preparationTime || 20;
    }));
    const deliveryTime = 30;
    const estimatedDeliveryTime = new Date(Date.now() + (Math.max(...maxPrepTime) + deliveryTime) * 60 * 1000);

    // Create order
    const orderData = {
      user: req.user._id,
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
      req.user._id,
      { $push: { orderHistory: newOrder._id } }
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
      orderId: newOrder._id
    });

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
        const filter = { foodPartner: req.foodPartner._id };
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

        const order = await orderModel.findOne({
            _id: orderId,
            foodPartner: req.foodPartner._id
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Update status
        order.status = status;

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

        const stats = await orderModel.aggregate([
            {
                $match: { foodPartner: partnerId }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayStats = await orderModel.aggregate([
            {
                $match: {
                    foodPartner: partnerId,
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    todayOrders: { $sum: 1 },
                    todayRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        res.status(200).json({
            message: "Order statistics retrieved successfully",
            statistics: {
                byStatus: stats,
                today: todayStats[0] || { todayOrders: 0, todayRevenue: 0 }
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




export default {
    createOrder,
    getUserOrders,
    getPartnerOrders,
    updateOrderStatus,
    getOrderById,
    getOrderStatistics
};