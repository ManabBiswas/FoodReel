import followModel from "../models/follow.model.js";
import userModel from "../models/user.Model.js";
import foodPartnerModel from "../models/foodPartner.Model.js";

const TARGET_TYPES = ['User', 'FoodPartner'];

// Follow a user or food partner
export const followUser = async (req, res) => {
    try {
        const { targetId, targetType } = req.body; // targetType: 'User' or 'FoodPartner'
        const followerId = req.user._id;
        
        // Determine follower type — set by isUserOrPartner middleware;
        // fall back to a field check for older callers.
        const followerType = req.userType || (req.user.companyName ? 'FoodPartner' : 'User');

        if (!targetId || !targetType) {
            return res.status(400).json({ 
                success: false, 
                message: "Target ID and type are required" 
            });
        }
        // follow.followingModel enum is ['User','FoodPartner'] — validate before
        // hitting the DB so a bad value is a 400, not a ValidationError → 500.
        if (!TARGET_TYPES.includes(targetType)) {
            return res.status(400).json({
                success: false,
                message: "targetType must be 'User' or 'FoodPartner'"
            });
        }

        // Prevent self-follow
        if (followerId.toString() === targetId && followerType === targetType) {
            return res.status(400).json({ 
                success: false, 
                message: "You cannot follow yourself" 
            });
        }

        // Check if follow relationship exists (active or inactive)
        const existingFollow = await followModel.findOne({
            follower: followerId,
            followerModel: followerType,
            following: targetId,
            followingModel: targetType
        });

        if (existingFollow) {
            // If already actively following
            if (existingFollow.isActive) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Already following this user" 
                });
            }
            
            // Reactivate the existing follow relationship
            existingFollow.isActive = true;
            await existingFollow.save();
            
            // Update follower's following count
            const FollowerModel = followerType === 'User' ? userModel : foodPartnerModel;
            await FollowerModel.findByIdAndUpdate(followerId, {
                $inc: { followingCount: 1 },
                $addToSet: { following: targetId }
            });

            // Update target's followers count
            const TargetModel = targetType === 'User' ? userModel : foodPartnerModel;
            await TargetModel.findByIdAndUpdate(targetId, {
                $inc: { followersCount: 1 },
                $addToSet: { followers: followerId }
            });
            
            return res.status(200).json({
                success: true,
                message: "Successfully followed",
                data: existingFollow
            });
        }

        // Create new follow relationship
        const follow = await followModel.create({
            follower: followerId,
            followerModel: followerType,
            following: targetId,
            followingModel: targetType,
            isActive: true
        });

        // Update follower's following count
        const FollowerModel = followerType === 'User' ? userModel : foodPartnerModel;
        await FollowerModel.findByIdAndUpdate(followerId, {
            $inc: { followingCount: 1 },
            $addToSet: { following: targetId }
        });

        // Update target's followers count
        const TargetModel = targetType === 'User' ? userModel : foodPartnerModel;
        await TargetModel.findByIdAndUpdate(targetId, {
            $inc: { followersCount: 1 },
            $addToSet: { followers: followerId }
        });

        res.status(200).json({
            success: true,
            message: "Successfully followed",
            data: follow
        });

    } catch (error) {
        console.error("Error in followUser:", error);
        res.status(500).json({
            success: false,
            message: "Failed to follow user",
            error: error.message
        });
    }
};

// Unfollow a user or food partner
export const unfollowUser = async (req, res) => {
    try {
        const { targetId, targetType } = req.body;
        const followerId = req.user._id;
        
        // Determine follower type — set by isUserOrPartner middleware;
        const followerType = req.userType || (req.user.companyName ? 'FoodPartner' : 'User');

        if (!targetId || !targetType) {
            return res.status(400).json({ 
                success: false, 
                message: "Target ID and type are required" 
            });
        }
        if (!TARGET_TYPES.includes(targetType)) {
            return res.status(400).json({
                success: false,
                message: "targetType must be 'User' or 'FoodPartner'"
            });
        }

        // Find and remove follow relationship
        const follow = await followModel.findOneAndUpdate(
            {
                follower: followerId,
                followerModel: followerType,
                following: targetId,
                followingModel: targetType,
                isActive: true
            },
            { isActive: false },
            { new: true }
        );

        if (!follow) {
            return res.status(404).json({ 
                success: false, 
                message: "Follow relationship not found" 
            });
        }

        // Update follower's following count
        const FollowerModel = followerType === 'User' ? userModel : foodPartnerModel;
        await FollowerModel.findByIdAndUpdate(followerId, {
            $inc: { followingCount: -1 },
            $pull: { following: targetId }
        });

        // Update target's followers count
        const TargetModel = targetType === 'User' ? userModel : foodPartnerModel;
        await TargetModel.findByIdAndUpdate(targetId, {
            $inc: { followersCount: -1 },
            $pull: { followers: followerId }
        });

        res.status(200).json({
            success: true,
            message: "Successfully unfollowed"
        });

    } catch (error) {
        console.error("Error in unfollowUser:", error);
        res.status(500).json({
            success: false,
            message: "Failed to unfollow user",
            error: error.message
        });
    }
};

// Get followers list
export const getFollowers = async (req, res) => {
    try {
        const { userId, userType } = req.params; // userType: 'User' or 'FoodPartner'
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const followers = await followModel
            .find({
                following: userId,
                followingModel: userType,
                isActive: true
            })
            .populate('follower', 'firstName lastName username email profileImage')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await followModel.countDocuments({
            following: userId,
            followingModel: userType,
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: followers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error in getFollowers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get followers",
            error: error.message
        });
    }
};

// Get following list
export const getFollowing = async (req, res) => {
    try {
        const { userId, userType } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const following = await followModel
            .find({
                follower: userId,
                followerModel: userType,
                isActive: true
            })
            .populate('following', 'firstName lastName username email profileImage companyName')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await followModel.countDocuments({
            follower: userId,
            followerModel: userType,
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: following,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error in getFollowing:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get following list",
            error: error.message
        });
    }
};

// Check if following
export const checkFollowing = async (req, res) => {
    try {
        const { targetId, targetType } = req.params;
        const followerId = req.user._id;
        
        // Determine follower type — set by isUserOrPartner middleware
        const followerType = req.userType || (req.user.companyName ? 'FoodPartner' : 'User');

        if (!TARGET_TYPES.includes(targetType)) {
            return res.status(400).json({
                success: false,
                message: "targetType must be 'User' or 'FoodPartner'"
            });
        }

        const isFollowing = await followModel.exists({
            follower: followerId,
            followerModel: followerType,
            following: targetId,
            followingModel: targetType,
            isActive: true
        });

        res.status(200).json({
            success: true,
            isFollowing: !!isFollowing
        });

    } catch (error) {
        console.error("Error in checkFollowing:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check following status",
            error: error.message
        });
    }
};

// Get suggested users to follow (based on mutual connections, popular users, etc.)
export const getSuggestedFollows = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Determine user type — set by isUserOrPartner middleware
        const userType = req.userType || (req.user.companyName ? 'FoodPartner' : 'User');
        const limit = parseInt(req.query.limit) || 10;

        // Get users the current user is already following
        const currentFollowing = await followModel
            .find({
                follower: userId,
                followerModel: userType,
                isActive: true
            })
            .select('following');

        const followingIds = currentFollowing.map(f => f.following.toString());
        followingIds.push(userId.toString()); // Exclude self

        // Get popular food partners not already followed
        const suggestedPartners = await foodPartnerModel
            .find({
                _id: { $nin: followingIds },
                isActive: true
            })
            .select('companyName username profileImage followersCount averageRating verified')
            .sort({ followersCount: -1, averageRating: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            data: suggestedPartners
        });

    } catch (error) {
        console.error("Error in getSuggestedFollows:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get suggested follows",
            error: error.message
        });
    }
};
