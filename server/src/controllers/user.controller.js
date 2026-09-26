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