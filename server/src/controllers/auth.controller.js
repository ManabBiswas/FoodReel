import userModel from "../models/user.Model.js";
import adminModel from "../models/admin.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function register(req, res) {
    try {
        const { firstName, lastName, email, password, mobile } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                error: "First name, last name, email, and password are required"
            });
        }

        const isUserExist = await userModel.findOne({ email });
        if (isUserExist) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const userData = {
            firstName,
            lastName,
            email,
            password: hashPassword,
            mobile
        };

        // Handle profile image if uploaded
        if (req.file) {
            userData.profileImage = req.file.buffer;
        }

        const user = await userModel.create(userData);

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.cookie("token", token, {
            httpOnly: true,
            // Use Lax so localhost:5173 (frontend) can send cookies to localhost:3000 (API) during dev
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobile: user.mobile,
                profileImage: user.profileImage ? `data:image/jpeg;base64,${user.profileImage.toString('base64')}` : null
            }
        });
        console.log("User created successfully", user);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                error: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (isPasswordMatched) {
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
            res.cookie('token', token, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
                path: '/'
            });

            res.status(200).json({
                message: "User logged in successfully",
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    mobile: user.mobile
                }
            });
        } else {
            return res.status(400).json({
                error: "Invalid email or password"
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function getProfile(req, res) {
    try {
        const userId = req.user._id;
        
        // Populate savedFoods and savedPosts with actual data
        const user = await userModel.findById(userId)
            .populate({
                path: 'savedFoods',
                select: 'name description image video price isAvailable type'
            })
            .populate({
                path: 'savedPosts',
                select: 'title description image video type postedBy createdAt likeCount commentCount',
                populate: {
                    path: 'postedBy',
                    select: 'firstName lastName profileImage'
                }
            });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            bio: user.bio || '',
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            preferences: user.preferences,
            isEmailVerified: user.isEmailVerified,
            isMobileVerified: user.isMobileVerified,
            profileImage: user.profileImage ? `data:image/jpeg;base64,${user.profileImage.toString('base64')}` : null,
            savedFoods: user.savedFoods || [],
            savedPosts: user.savedPosts || [],
            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(400).json({ error: error.message });
    }
}

async function updateProfile(req, res) {
    try {
        const userId = req.user._id;
        const { firstName, lastName, mobile, bio } = req.body;

        // Build update object with only provided fields
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (mobile) updateData.mobile = mobile;
        if (bio !== undefined) updateData.bio = bio.substring(0, 150); // Limit to 150 chars

        // Handle profile image if uploaded
        if (req.file) {
            updateData.profileImage = req.file.buffer;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                bio: updatedUser.bio || '',
                profileImage: updatedUser.profileImage ? `data:image/jpeg;base64,${updatedUser.profileImage.toString('base64')}` : null,
                updatedAt: updatedUser.updatedAt
            }
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function changePassword(req, res) {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters long" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await userModel.findByIdAndUpdate(userId, { password: hashedNewPassword });

        res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function deleteAccount(req, res) {
    try {
        const userId = req.user._id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Password is required to delete account" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Incorrect password" });
        }

        // Delete user account
        await userModel.findByIdAndDelete(userId);

        // Clear cookie
        res.clearCookie('token');

        res.status(200).json({ message: "Account deleted successfully" });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function logout(req, res) {
    res.clearCookie('token', { path: '/' });
    res.status(200).json({ message: "User logged out successfully" });

}

async function verify(req, res) {
    // This endpoint uses the isLoggedin middleware to verify the token
    try {
        res.status(200).json({
            isAuthenticated: true,
            message: "User is authenticated",
            user: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                mobile: req.user.mobile
            }
        });
    } catch (error) {
        res.status(401).json({
            isAuthenticated: false,
            message: "Not authenticated",
            error: error.message
        });
    }
}

// ============ ADMIN AUTHENTICATION ============
async function adminLogin(req, res) {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                error: "Email and code are required"
            });
        }

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                error: "Invalid email or code"
            });
        }

        if (admin.code !== code) {
            return res.status(400).json({
                error: "Invalid email or code"
            });
        }

        const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET);
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
        
        res.status(200).json({ 
            message: "Admin login successful",
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

async function adminLogout(req, res) {
    try {
        res.clearCookie('token', { path: '/' });
        res.status(200).json({ message: "Admin logout successful" });
    } catch (error) {
        console.error('Admin logout error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function adminVerify(req, res) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                isAuthenticated: false,
                message: "Not authenticated"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await adminModel.findById(decoded.id).select('-code');
        
        if (!admin) {
            return res.status(404).json({ 
                isAuthenticated: false,
                error: "Admin not found" 
            });
        }
        
        res.status(200).json({
            isAuthenticated: true,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Admin verify error:', error);
        res.status(401).json({ 
            isAuthenticated: false,
            error: "Unauthorized" 
        });
    }
}

async function adminProfile(req, res) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                error: "Not authenticated"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await adminModel.findById(decoded.id).select('-code');
        
        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }
        
        res.status(200).json({
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                createdAt: admin.createdAt
            }
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export default {
    register,
    login,
    logout,
    verify,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    adminLogin,
    adminLogout,
    adminVerify,
    adminProfile
}