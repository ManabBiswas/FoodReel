import userModel from "../models/user.Model.js";
import orderModel from "../models/order.model.js";
import reviewModel from "../models/review.model.js";
import bcrypt from "bcrypt";
import { serverError } from "../utils/apiError.js";

// Get user statistics (orders, favorites, etc.)
async function getUserStats(req, res) {
    try {
        const userId = req.user._id;

        const [totalOrders, spentAgg, favoritePartners, user] = await Promise.all([
            orderModel.countDocuments({ user: userId }),
            orderModel.aggregate([
                { $match: { user: userId, status: { $ne: "cancelled" } } },
                { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
            ]),
            orderModel.distinct("items.foodPartner", { user: userId, status: { $ne: "cancelled" } }),
            userModel.findById(userId).select("savedFoods")
        ]);

        const stats = {
            totalOrders,
            favoriteRestaurants: favoritePartners.length,
            totalSpent: spentAgg[0]?.total ?? 0,
            savedFoods: user?.savedFoods?.length ?? 0,
            memberSince: req.user.createdAt
        };

        res.status(200).json({
            message: "User statistics retrieved successfully",
            stats
        });
    } catch (error) {
        console.error("Error getting user stats:", error);
        serverError(res, error);
    }
}

// Upload or update profile picture
async function uploadProfilePicture(req, res) {
    try {
        const userId = req.user._id;
        
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: "Only image files are allowed" });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { profileImage: req.file.buffer },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            message: "Profile picture updated successfully",
            profileImage: `data:image/jpeg;base64,${updatedUser.profileImage.toString('base64')}`
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Remove profile picture
async function removeProfilePicture(req, res) {
    try {
        const userId = req.user._id;

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $unset: { profileImage: 1 } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            message: "Profile picture removed successfully"
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Update user preferences
async function updatePreferences(req, res) {
    try {
        const userId = req.user._id;
        const { cuisine, dietaryRestrictions, spiceLevel } = req.body;

        const updateData = {};
        if (cuisine) updateData['preferences.cuisine'] = cuisine;
        if (dietaryRestrictions) updateData['preferences.dietaryRestrictions'] = dietaryRestrictions;
        if (spiceLevel) updateData['preferences.spiceLevel'] = spiceLevel;

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.status(200).json({
            message: "User preferences updated successfully",
            preferences: updatedUser.preferences
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


// Get user activity history
async function getUserActivity(req, res) {
    try {
        const userId = req.user._id;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const skip = (page - 1) * limit;
        const [orders, reviews] = await Promise.all([
            orderModel.find({ user: userId })
                .select("status pricing.totalAmount items.foodItem createdAt")
                .populate("items.foodItem", "name")
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(),
            reviewModel.find({ user: userId, isActive: true })
                .select("rating comment foodPartner foodItem createdAt")
                .populate("foodPartner", "companyName")
                .populate("foodItem", "name")
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean()
        ]);

        const orderActivities = orders.map(o => ({
            type: "order",
            orderId: o._id,
            status: o.status,
            description: o.items?.[0]?.foodItem?.name
                ? `Ordered ${o.items[0].foodItem.name}${o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}`
                : "Placed an order",
            amount: o.pricing?.totalAmount,
            timestamp: o.createdAt
        }));

        const reviewActivities = reviews.map(r => ({
            type: "review",
            reviewId: r._id,
            rating: r.rating,
            description: r.foodItem?.name
                ? `Reviewed ${r.foodItem.name}`
                : r.foodPartner?.companyName
                    ? `Reviewed ${r.foodPartner.companyName}`
                    : "Left a review",
            timestamp: r.createdAt
        }));

        const merged = [...orderActivities, ...reviewActivities]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const [totalOrders, totalReviews] = await Promise.all([
            orderModel.countDocuments({ user: userId }),
            reviewModel.countDocuments({ user: userId, isActive: true })
        ]);

        res.status(200).json({
            message: "User activity retrieved successfully",
            activities: merged.slice(skip, skip + limit),
            pagination: {
                page,
                limit,
                total: totalOrders + totalReviews
            }
        });
    } catch (error) {
        console.error("Error getting user activity:", error);
        serverError(res, error);
    }
}

// Validate current password (for sensitive operations)
async function validatePassword(req, res) {
    try {
        const userId = req.user._id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (isPasswordValid) {
            res.status(200).json({
                message: "Password is valid",
                valid: true
            });
        } else {
            res.status(400).json({
                error: "Invalid password",
                valid: false
            });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Normalize the two address shapes the frontend sends:
// - QuickOrderModal: fullName, phone, addressLine1, city, state, pincode
// - ProfileSettings: label, street, city, state, pinCode, country
function normalizeAddressInput(body, user) {
    return {
        label: body.label || 'Home',
        fullName: body.fullName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
        phone: body.phone || (user && user.mobile) || '',
        addressLine1: body.addressLine1 || body.street || '',
        addressLine2: body.addressLine2 || '',
        landmark: body.landmark || '',
        city: body.city || '',
        state: body.state || '',
        pincode: String(body.pincode || body.pinCode || ''),
        country: body.country || 'India',
        isDefault: !!body.isDefault
    };
}

// Get all user addresses
async function getAddresses(req, res) {
    try {
        const userId = req.user._id;
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return addresses array or empty array
        const addresses = user.deliveryAddresses || [];
        
        res.status(200).json({
            message: "Addresses retrieved successfully",
            addresses
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Add new delivery address
async function addAddress(req, res) {
    try {
        const userId = req.user._id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const input = normalizeAddressInput(req.body, user);

        // Validate required fields (after normalization so ProfileSettings'
        // {street, pinCode} shape and QuickOrderModal's {addressLine1, pincode}
        // shape both work)
        if (!input.addressLine1 || !input.city || !input.state || !input.pincode) {
            return res.status(400).json({ 
                error: "Required fields: addressLine1 (or street), city, state, pincode (or pinCode)" 
            });
        }

        // Initialize addresses array if it doesn't exist
        if (!user.deliveryAddresses) {
            user.deliveryAddresses = [];
        }

        // If this is the first address or marked as default, set it as default
        const makeDefault = input.isDefault || user.deliveryAddresses.length === 0;
        
        // If making this default, unset all other defaults
        if (makeDefault) {
            user.deliveryAddresses.forEach(addr => addr.isDefault = false);
        }

        // Add new address
        user.deliveryAddresses.push({ ...input, isDefault: makeDefault });

        await user.save();

        res.status(201).json({
            message: "Address added successfully",
            addresses: user.deliveryAddresses
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Update delivery address (by :addressId)
async function updateAddress(req, res) {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const address = user.deliveryAddresses.id(addressId);
        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // Accept both frontend shapes (street/pinCode vs addressLine1/pincode)
        const body = req.body || {};
        if (body.label !== undefined) address.label = body.label;
        if (body.fullName) address.fullName = body.fullName;
        if (body.phone) address.phone = body.phone;
        const line1 = body.addressLine1 || body.street;
        if (line1) address.addressLine1 = line1;
        if (body.addressLine2 !== undefined) address.addressLine2 = body.addressLine2;
        if (body.landmark !== undefined) address.landmark = body.landmark;
        if (body.city) address.city = body.city;
        if (body.state) address.state = body.state;
        const pin = body.pincode || body.pinCode;
        if (pin) address.pincode = String(pin);
        if (body.country) address.country = body.country;

        if (body.isDefault === true) {
            user.deliveryAddresses.forEach(addr => { addr.isDefault = false; });
            address.isDefault = true;
        }

        await user.save();

        res.status(200).json({
            message: "Address updated successfully",
            addresses: user.deliveryAddresses
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Update the profile's single address object (PUT /user/address, no :addressId).
// This is what ProfileSettings.handleAddressUpdate calls — it is NOT a
// delivery-address CRUD call (that uses /:addressId).
async function updateProfileAddress(req, res) {
    try {
        const userId = req.user._id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const body = req.body || {};
        user.address = {
            ...(user.address?.toObject?.() || user.address || {}),
            street: body.street || body.addressLine1 || user.address?.street || '',
            city: body.city || user.address?.city || '',
            state: body.state || user.address?.state || '',
            pincode: String(body.pincode || body.pinCode || user.address?.pincode || ''),
            country: body.country || user.address?.country || 'India'
        };

        await user.save();

        res.status(200).json({
            message: "Address updated successfully",
            address: user.address
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Delete delivery address
async function deleteAddress(req, res) {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const address = user.deliveryAddresses.id(addressId);
        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // If deleting default address, make first remaining address default
        const wasDefault = address.isDefault;
        user.deliveryAddresses.pull({ _id: addressId });

        if (wasDefault && user.deliveryAddresses.length > 0) {
            user.deliveryAddresses[0].isDefault = true;
        }

        await user.save();

        res.status(200).json({
            message: "Address deleted successfully",
            addresses: user.deliveryAddresses
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Set default delivery address
async function setDefaultAddress(req, res) {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const address = user.deliveryAddresses.id(addressId);
        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // Unset all defaults
        user.deliveryAddresses.forEach(addr => addr.isDefault = false);
        
        // Set this address as default
        address.isDefault = true;

        await user.save();

        res.status(200).json({
            message: "Default address updated successfully",
            addresses: user.deliveryAddresses
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export default {
    getUserStats,
    uploadProfilePicture,
    removeProfilePicture,
    updatePreferences,
    getAddresses,
    addAddress,
    updateAddress,
    updateProfileAddress,
    deleteAddress,
    setDefaultAddress,
    getUserActivity,
    validatePassword
};