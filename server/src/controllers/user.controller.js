import userModel from "../models/user.Model.js";
import bcrypt from "bcrypt";

// Get user statistics (orders, favorites, etc.)
async function getUserStats(req, res) {
    try {
        const userId = req.user._id;
        
        // This is a placeholder - you would integrate with your order model when available
        const stats = {
            totalOrders: 0,
            favoriteRestaurants: 0,
            totalSpent: 0,
            memberSince: req.user.createdAt
        };

        res.status(200).json({
            message: "User statistics retrieved successfully",
            stats
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
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
        const { page = 1, limit = 10 } = req.query;

        // This is a placeholder - you would integrate with your order/activity models
        const activities = [
            {
                type: "order",
                description: "Ordered Pizza from Tony's Pizza",
                timestamp: new Date(),
                amount: 25.99
            },
            {
                type: "review",
                description: "Left a review for Burger Palace",
                timestamp: new Date(),
                rating: 5
            }
        ];

        res.status(200).json({
            message: "User activity retrieved successfully",
            activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: activities.length
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
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
        const { fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, isDefault } = req.body;

        // Validate required fields
        if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
            return res.status(400).json({ 
                error: "Required fields: fullName, phone, addressLine1, city, state, pincode" 
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Initialize addresses array if it doesn't exist
        if (!user.deliveryAddresses) {
            user.deliveryAddresses = [];
        }

        // If this is the first address or marked as default, set it as default
        const makeDefault = isDefault || user.deliveryAddresses.length === 0;
        
        // If making this default, unset all other defaults
        if (makeDefault) {
            user.deliveryAddresses.forEach(addr => addr.isDefault = false);
        }

        // Add new address
        user.deliveryAddresses.push({
            fullName,
            phone,
            addressLine1,
            addressLine2,
            landmark,
            city,
            state,
            pincode,
            isDefault: makeDefault
        });

        await user.save();

        res.status(201).json({
            message: "Address added successfully",
            addresses: user.deliveryAddresses
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Update delivery address
async function updateAddress(req, res) {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;
        const { fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const address = user.deliveryAddresses.id(addressId);
        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // Update fields if provided
        if (fullName) address.fullName = fullName;
        if (phone) address.phone = phone;
        if (addressLine1) address.addressLine1 = addressLine1;
        if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
        if (landmark !== undefined) address.landmark = landmark;
        if (city) address.city = city;
        if (state) address.state = state;
        if (pincode) address.pincode = pincode;

        await user.save();

        res.status(200).json({
            message: "Address updated successfully",
            addresses: user.deliveryAddresses
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
        address.remove();

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
    deleteAddress,
    setDefaultAddress,
    getUserActivity,
    validatePassword
};