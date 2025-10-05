import userModel from "../models/user.Model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function register(req, res) {
    try {
        const {firstName, lastName, email, password, mobile} = req.body;
        
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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
    try{
        const {email, password} = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }
        
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(400).json({
                error: "Invalid email or password"
            });
        }
        
        // Compare password
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        
        if(isPasswordMatched){
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
            res.cookie('token', token, { 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
    }catch(error){
        console.error('Login error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function getProfile(req,res){
    try{
        const user = req.user;
        res.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            preferences: user.preferences,
            isEmailVerified: user.isEmailVerified,
            isMobileVerified: user.isMobileVerified,
            profileImage: user.profileImage ? `data:image/jpeg;base64,${user.profileImage.toString('base64')}` : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }catch(error){
        res.status(400).json({ error: error.message });
    }
}

async function updateProfile(req, res) {
    try {
        const userId = req.user._id;
        const { firstName, lastName, mobile } = req.body;
        
        // Build update object with only provided fields
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (mobile) updateData.mobile = mobile;
        
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
    res.clearCookie('token');
    res.status(200).json({ message: "User logged out successfully" });
    
}

async function verify(req, res) {
    // This endpoint uses the isLoggedin middleware to verify the token
    // If we reach here, the user is authenticated
    res.status(200).json({ 
        message: "User is authenticated",
        user: {
            _id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            mobile: req.user.mobile
        }
    });
}

export default {
    register,
    login,
    logout,
    verify,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount
}