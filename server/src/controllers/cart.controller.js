import cartModel from '../models/cart.model.js';
import foodModel from '../models/food.model.js';
import orderModel from '../models/order.model.js';
import userModel from '../models/user.Model.js';
import paymentService from '../services/payment.service.js';

// Get user's cart
const getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        let cart = await cartModel
            .findOne({ user: userId })
            .populate({
                path: 'items.foodItem',
                select: 'name description image video price currency postType isAvailable'
            })
            .populate({
                path: 'items.foodPartner',
                select: 'companyName email mobile'
            })
            .populate('activeRestaurant', 'companyName');

        if (!cart) {
            // Create empty cart if doesn't exist
            cart = await cartModel.create({ user: userId, items: [] });
        }

        // Calculate totals before returning
        await calculateCartTotals(cart);

        res.status(200).json({
            success: true,
            cart
        });
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get cart',
            details: error.message
        });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { foodItemId, quantity = 1, specialInstructions } = req.body;

        const normalizedQty = Number.parseInt(quantity, 10);
        if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be a positive integer'
            });
        }

        if (!foodItemId) {
            return res.status(400).json({
                success: false,
                error: 'Food item ID is required'
            });
        }

        // Get food item details
        const foodItem = await foodModel.findById(foodItemId).populate('foodPartner');
        
        if (!foodItem) {
            return res.status(404).json({
                success: false,
                error: 'Food item not found'
            });
        }

        // Validate item is orderable
        if (foodItem.postType !== 'food') {
            return res.status(400).json({
                success: false,
                error: 'This item is not available for ordering'
            });
        }

        // Check availability
        if (!foodItem.isAvailable) {
            return res.status(400).json({
                success: false,
                error: `${foodItem.name} is currently unavailable`
            });
        }

        // Check price
        if (!foodItem.price || foodItem.price <= 0) {
            return res.status(400).json({
                success: false,
                error: `${foodItem.name} has no valid price`
            });
        }

        // Get or create cart
        let cart = await cartModel.findOne({ user: userId });
        
        if (!cart) {
            cart = await cartModel.create({ 
                user: userId, 
                items: [],
                activeRestaurant: foodItem.foodPartner._id
            });
        }

        // Check if cart has items from different restaurant
        if (cart.items.length > 0 && cart.activeRestaurant && 
            cart.activeRestaurant.toString() !== foodItem.foodPartner._id.toString()) {
            return res.status(409).json({
                success: false,
                error: 'Cart contains items from a different restaurant',
                code: 'DIFFERENT_RESTAURANT',
                currentRestaurant: cart.activeRestaurant,
                newRestaurant: foodItem.foodPartner._id,
                message: 'Your cart contains items from another restaurant. Would you like to clear your cart and add this item?'
            });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.foodItem.toString() === foodItemId
        );

        if (existingItemIndex >= 0) {
            // Update quantity
            cart.items[existingItemIndex].quantity += normalizedQty;
            cart.items[existingItemIndex].priceAtAdd = foodItem.price;
        } else {
            // Add new item
            cart.items.push({
                foodItem: foodItem._id,
                quantity: normalizedQty,
                priceAtAdd: foodItem.price,
                foodPartner: foodItem.foodPartner._id,
                specialInstructions,
                addedAt: new Date()
            });
            
            // Set active restaurant if first item
            if (cart.items.length === 1) {
                cart.activeRestaurant = foodItem.foodPartner._id;
            }
        }

        // Calculate totals
        await calculateCartTotals(cart);
        await cart.save();

        // Populate and return
        await cart.populate([
            { path: 'items.foodItem', select: 'name description image video price currency postType isAvailable' },
            { path: 'items.foodPartner', select: 'companyName email mobile' },
            { path: 'activeRestaurant', select: 'companyName' }
        ]);

        res.status(200).json({
            success: true,
            message: `Added ${foodItem.name} to cart`,
            cart
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add item to cart',
            details: error.message
        });
    }
};

// Update item quantity
const updateQuantity = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        const normalizedQty = Number.parseInt(quantity, 10);
        if (!Number.isFinite(normalizedQty) || normalizedQty < 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid quantity is required'
            });
        }

        const cart = await cartModel.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        if (normalizedQty === 0) {
            // Remove item if quantity is 0
            cart.items.splice(itemIndex, 1);
            
            // Clear active restaurant if cart is empty
            if (cart.items.length === 0) {
                cart.activeRestaurant = null;
            }
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = normalizedQty;
        }

        await calculateCartTotals(cart);
        await cart.save();

        await cart.populate([
            { path: 'items.foodItem', select: 'name description image video price currency postType isAvailable' },
            { path: 'items.foodPartner', select: 'companyName email mobile' },
            { path: 'activeRestaurant', select: 'companyName' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Cart updated',
            cart
        });

    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update cart',
            details: error.message
        });
    }
};

// Remove item from cart
const removeItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId } = req.params;

        const cart = await cartModel.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);

        if (cart.items.length === initialLength) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        // Clear active restaurant if cart is empty
        if (cart.items.length === 0) {
            cart.activeRestaurant = null;
        }

        await calculateCartTotals(cart);
        await cart.save();

        await cart.populate([
            { path: 'items.foodItem', select: 'name description image video price currency postType isAvailable' },
            { path: 'items.foodPartner', select: 'companyName email mobile' },
            { path: 'activeRestaurant', select: 'companyName' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            cart
        });

    } catch (error) {
        console.error('Error removing item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove item',
            details: error.message
        });
    }
};

// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const cart = await cartModel.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        cart.items = [];
        cart.activeRestaurant = null;
        cart.totals = {
            itemsTotal: 0,
            deliveryFee: 0,
            platformFee: 0,
            taxes: 0,
            discount: 0,
            grandTotal: 0
        };
        cart.appliedPromo = undefined;

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared',
            cart
        });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart',
            details: error.message
        });
    }
};

// Validate cart (check prices, availability)
const validateCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const cart = await cartModel
            .findOne({ user: userId })
            .populate('items.foodItem')
            .populate('activeRestaurant', 'companyName profileImage');

        if (!cart || cart.items.length === 0) {
            return res.status(200).json({
                success: true,
                valid: true,
                issues: []
            });
        }

        const issues = auditCartIssues(cart);

        // Keep totals in sync even when no issues
        await calculateCartTotals(cart);
        await cart.save();

        res.status(200).json({
            success: true,
            valid: issues.length === 0,
            issues,
            cart
        });

    } catch (error) {
        console.error('Error validating cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate cart',
            details: error.message
        });
    }
};

// Checkout - convert cart to order
const checkout = async (req, res) => {
    try {
        const userId = req.user._id;
        const { deliveryAddress, paymentMethod = 'cod', specialInstructions } = req.body;

        if (!deliveryAddress) {
            return res.status(400).json({
                success: false,
                error: 'Delivery address is required'
            });
        }

        // Get cart
        const cart = await cartModel
            .findOne({ user: userId })
            .populate('items.foodItem');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        // Validate cart before checkout (handles price changes too)
        const issues = auditCartIssues(cart);
        await calculateCartTotals(cart);
        await cart.save();

        if (issues.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart validation failed',
                issues
            });
        }

        // Create order from cart
        const orderItems = cart.items.map(item => ({
            foodItemId: item.foodItem._id,
            quantity: item.quantity
        }));

        // Use existing order creation logic
        const orderPayload = {
            items: orderItems,
            deliveryAddress,
            specialInstructions: specialInstructions || '',
            orderSource: 'cart',
            paymentMethod
        };

        // Create the order (reuse order controller logic)
        const orderData = {
            user: userId,
            items: cart.items.map(item => ({
                foodItem: item.foodItem._id,
                quantity: item.quantity,
                priceAtOrder: item.priceAtAdd,
                foodPartner: item.foodPartner
            })),
            currency: 'INR',
            deliveryAddress,
            specialInstructions: specialInstructions || '',
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 mins
            orderSource: 'cart',
            pricing: {
                itemPrice: cart.totals.itemsTotal,
                deliveryFee: cart.totals.deliveryFee,
                platformFee: cart.totals.platformFee,
                taxes: { gst: cart.totals.taxes, total: cart.totals.taxes },
                discount: cart.totals.discount,
                totalAmount: cart.totals.grandTotal
            },
            status: 'pending',
            paymentDetails: {
                method: paymentMethod,
                status: 'pending'
            },
            orderNotes: [{
                note: `Order placed with ${cart.items.length} items from cart`,
                addedBy: 'system'
            }]
        };

        const newOrder = await orderModel.create(orderData);

        // Track in user history
        await userModel.findByIdAndUpdate(
            userId,
            { $push: { orderHistory: newOrder._id } }
        );

        // Populate order
        await newOrder.populate([
            { path: 'user', select: 'firstName lastName email mobile' },
            { path: 'items.foodItem', select: 'name description image video price currency preparationTime postType' },
            { path: 'items.foodPartner', select: 'companyName email mobile address' }
        ]);

        // Clear cart after successful order
        cart.items = [];
        cart.activeRestaurant = null;
        cart.totals = {
            itemsTotal: 0,
            deliveryFee: 0,
            platformFee: 0,
            taxes: 0,
            discount: 0,
            grandTotal: 0
        };
        await cart.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: newOrder,
            orderId: newOrder._id
        });

    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process checkout',
            details: error.message
        });
    }
};

// Helper function to calculate cart totals
async function calculateCartTotals(cart) {
    let itemsTotal = 0;

    // Calculate items total
    for (const item of cart.items) {
        itemsTotal += item.priceAtAdd * item.quantity;
    }

    // Calculate fees using payment service
    const pricing = paymentService.calculatePricing(itemsTotal);

    cart.totals = {
        itemsTotal: pricing.itemPrice,
        deliveryFee: pricing.deliveryFee,
        platformFee: pricing.platformFee,
        taxes: pricing.taxes.gst,
        discount: pricing.discount || 0,
        grandTotal: pricing.totalAmount
    };

    return cart.totals;
}

// Shared cart audit to surface availability/price issues and keep prices fresh
function auditCartIssues(cart) {
    const issues = [];

    for (const item of cart.items) {
        const foodItem = item.foodItem;

        if (!foodItem) {
            issues.push({
                itemId: item._id,
                type: 'NOT_FOUND',
                message: 'Item no longer exists'
            });
            continue;
        }

        if (!foodItem.isAvailable) {
            issues.push({
                itemId: item._id,
                name: foodItem.name,
                type: 'UNAVAILABLE',
                message: `${foodItem.name} is currently unavailable`
            });
        }

        if (typeof foodItem.price === 'number' && foodItem.price !== item.priceAtAdd) {
            issues.push({
                itemId: item._id,
                foodItemId: foodItem._id,
                name: foodItem.name,
                type: 'PRICE_CHANGE',
                oldPrice: item.priceAtAdd,
                newPrice: foodItem.price,
                message: `Price changed from ₹${item.priceAtAdd} to ₹${foodItem.price}`
            });

            item.priceAtAdd = foodItem.price;
        }
    }

    return issues;
}

export default {
    getCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    validateCart,
    checkout
};
