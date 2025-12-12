import orderModel from "../models/order.model.js";
import foodModel from "../models/food.model.js";
import userModel from "../models/user.Model.js";
import paymentService from "../services/payment.service.js";

const createOrder = async (req, res) => {
    try {
        const {
            foodId,
            foodItemId, // Support both field names
            quantity = 1,
            deliveryAddress,
            specialInstructions,
            orderNotes,
            orderSource = 'modal',
            paymentMethod = 'cod'
        } = req.body;

        const itemId = foodId || foodItemId;

        // Validate required fields
        if (!itemId || !deliveryAddress) {
            return res.status(400).json({ 
                error: "Food item and delivery address are required" 
            });
        }

        // Validate delivery address
        if (!deliveryAddress.fullName || !deliveryAddress.phone || 
            !deliveryAddress.addressLine1 || !deliveryAddress.city || 
            !deliveryAddress.state || !deliveryAddress.pincode) {
            return res.status(400).json({ 
                error: "Complete delivery address is required (fullName, phone, addressLine1, city, state, pincode)" 
            });
        }

        // Find the food item and validate it's orderable
        const foodItem = await foodModel.findById(itemId).populate('foodPartner');
        
        if (!foodItem) {
            return res.status(404).json({ error: "Food item not found" });
        }

        if (foodItem.postType !== 'food') {
            return res.status(400).json({ 
                error: "This item is an advertisement and cannot be ordered directly" 
            });
        }

        if (!foodItem.price || foodItem.price <= 0) {
            return res.status(400).json({ 
                error: "This food item doesn't have pricing information" 
            });
        }

        // Calculate pricing using payment service
        const pricing = paymentService.calculatePricing(foodItem.price, quantity);

        // Calculate estimated delivery time (food prep time + 30 min delivery)
        const prepTime = foodItem.preparationTime || 20; // default 20 minutes
        const deliveryTime = 30; // 30 minutes for delivery
        const estimatedDeliveryTime = new Date(Date.now() + (prepTime + deliveryTime) * 60 * 1000);

        // Create order
        const orderData = {
            user: req.user._id,
            foodItem: itemId,
            foodPartner: foodItem.foodPartner._id,
            quantity: parseInt(quantity),
            currency: 'INR',
            deliveryAddress,
            specialInstructions: specialInstructions || orderNotes || '',
            estimatedDeliveryTime,
            orderSource,
            pricing,
            status: 'pending',
            paymentDetails: {
                method: paymentMethod,
                status: paymentMethod === 'cod' ? 'pending' : 'pending'
            },
            orderNotes: [{
                note: `Order placed for ${foodItem.name}`,
                addedBy: 'system'
            }]
        };

        const newOrder = await orderModel.create(orderData);

        // Populate the order with related data
        await newOrder.populate([
            { path: 'user', select: 'username email' },
            { path: 'foodItem', select: 'name description image video price currency preparationTime' },
            { path: 'foodPartner', select: 'restaurantName email phoneNumber address' }
        ]);

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
            .populate('foodItem', 'name description image video price currency preparationTime')
            .populate('foodPartner', 'restaurantName email phoneNumber')
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
            .populate('user', 'username email')
            .populate('foodItem', 'name description image price currency')
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
            { path: 'user', select: 'username email' },
            { path: 'foodItem', select: 'name description price currency' }
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

const getOrderById  = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await orderModel
            .findOne({ _id: orderId })
            .populate('user', 'username email')
            .populate('foodItem', 'name description image video price currency preparationTime')
            .populate('foodPartner', 'restaurantName email phoneNumber');

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
        res.status(500).json({ error:'Failed to retrieve order',details: error.message });
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

export default {
    createOrder,
    getUserOrders,
    getPartnerOrders,
    updateOrderStatus,
    getOrderById,
    getOrderStatistics
};