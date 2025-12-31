import mongoose from "mongoose";
import reviewModel from "../models/review.model.js";
import userModel from "../models/user.Model.js";
import foodPartnerModel from "../models/foodPartner.Model.js";
import foodModel from "../models/food.model.js";
import orderModel from "../models/order.model.js";

// Create a review
export const createReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            foodPartnerId,
            foodItemId,
            orderId,
            rating,
            comment,
            images,
            ratings // Detailed ratings object
        } = req.body;

        // Validate required fields
        if (!foodPartnerId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "Food partner ID, rating, and comment are required"
            });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        // Check if user has already reviewed this combination
        const existingReview = await reviewModel.findOne({
            user: userId,
            foodPartner: foodPartnerId,
            foodItem: foodItemId || null,
            isActive: true
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this"
            });
        }

        // Check if verified purchase (if order ID provided)
        let isVerifiedPurchase = false;
        if (orderId) {
            const order = await orderModel.findOne({
                _id: orderId,
                user: userId,
                status: 'delivered'
            });
            isVerifiedPurchase = !!order;
        }

        // Create review
        const review = await reviewModel.create({
            user: userId,
            foodPartner: foodPartnerId,
            foodItem: foodItemId || null,
            order: orderId || null,
            rating,
            comment,
            images: images || [],
            ratings: ratings || {},
            isVerifiedPurchase,
            status: 'approved'
        });

        // Update user's reviews count
        await userModel.findByIdAndUpdate(userId, {
            $inc: { reviewsCount: 1 },
            $addToSet: { reviewsGiven: review._id }
        });

        // Update food partner's ratings
        await updateFoodPartnerRatings(foodPartnerId);

        // Populate review before sending
        const populatedReview = await reviewModel
            .findById(review._id)
            .populate('user', 'firstName lastName profileImage')
            .populate('foodItem', 'name image');

        res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: populatedReview
        });

    } catch (error) {
        console.error("Error in createReview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create review",
            error: error.message
        });
    }
};

// Get reviews for a food partner
export const getReviewsByFoodPartner = async (req, res) => {
    try {
        const { foodPartnerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'createdAt'; // createdAt, rating, helpful
        const order = req.query.order === 'asc' ? 1 : -1;
        const ratingFilter = req.query.rating ? parseInt(req.query.rating) : null;

        const query = {
            foodPartner: foodPartnerId,
            isActive: true,
            status: 'approved'
        };

        if (ratingFilter) {
            query.rating = ratingFilter;
        }

        const sortOptions = {};
        if (sortBy === 'helpful') {
            sortOptions.helpfulCount = order;
        } else if (sortBy === 'rating') {
            sortOptions.rating = order;
        } else {
            sortOptions.createdAt = order;
        }

        const reviews = await reviewModel
            .find(query)
            .populate('user', 'firstName lastName profileImage')
            .populate('foodItem', 'name image price')
            .skip(skip)
            .limit(limit)
            .sort(sortOptions);

        const total = await reviewModel.countDocuments(query);

        // Get rating distribution
        const ratingDistribution = await reviewModel.aggregate([
            { $match: { foodPartner: new mongoose.Types.ObjectId(foodPartnerId), isActive: true, status: 'approved' } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: reviews,
            ratingDistribution,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error in getReviewsByFoodPartner:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get reviews",
            error: error.message
        });
    }
};

// Get reviews for a specific food item
export const getReviewsByFoodItem = async (req, res) => {
    try {
        const { foodItemId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await reviewModel
            .find({
                foodItem: foodItemId,
                isActive: true,
                status: 'approved'
            })
            .populate('user', 'firstName lastName profileImage')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await reviewModel.countDocuments({
            foodItem: foodItemId,
            isActive: true,
            status: 'approved'
        });

        // Calculate average rating
        const avgRating = await reviewModel.aggregate([
            { $match: { foodItem: new mongoose.Types.ObjectId(foodItemId), isActive: true, status: 'approved' } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        res.status(200).json({
            success: true,
            data: reviews,
            averageRating: avgRating[0]?.avgRating || 0,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error in getReviewsByFoodItem:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get reviews",
            error: error.message
        });
    }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await reviewModel
            .find({
                user: userId,
                isActive: true
            })
            .populate('foodPartner', 'companyName username profileImage')
            .populate('foodItem', 'name image price')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await reviewModel.countDocuments({
            user: userId,
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error in getUserReviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user reviews",
            error: error.message
        });
    }
};

// Update a review
export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;
        const { rating, comment, images, ratings } = req.body;

        const review = await reviewModel.findOne({
            _id: reviewId,
            user: userId,
            isActive: true
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Update fields
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (images) review.images = images;
        if (ratings) review.ratings = { ...review.ratings, ...ratings };

        await review.save();

        // Update food partner ratings
        await updateFoodPartnerRatings(review.foodPartner);

        const updatedReview = await reviewModel
            .findById(reviewId)
            .populate('user', 'firstName lastName profileImage')
            .populate('foodItem', 'name image');

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: updatedReview
        });

    } catch (error) {
        console.error("Error in updateReview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update review",
            error: error.message
        });
    }
};

// Delete a review
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await reviewModel.findOne({
            _id: reviewId,
            user: userId,
            isActive: true
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        review.isActive = false;
        await review.save();

        // Update user's reviews count
        await userModel.findByIdAndUpdate(userId, {
            $inc: { reviewsCount: -1 },
            $pull: { reviewsGiven: reviewId }
        });

        // Update food partner ratings
        await updateFoodPartnerRatings(review.foodPartner);

        res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });

    } catch (error) {
        console.error("Error in deleteReview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete review",
            error: error.message
        });
    }
};

// Mark review as helpful/not helpful
export const markReviewHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { helpful } = req.body; // true for helpful, false for not helpful
        const userId = req.user._id;

        const review = await reviewModel.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        if (helpful) {
            // Remove from notHelpful if exists
            review.notHelpful = review.notHelpful.filter(id => id.toString() !== userId.toString());
            
            // Toggle helpful
            const index = review.helpful.findIndex(id => id.toString() === userId.toString());
            if (index > -1) {
                review.helpful.splice(index, 1);
                review.helpfulCount = Math.max(0, review.helpfulCount - 1);
            } else {
                review.helpful.push(userId);
                review.helpfulCount += 1;
            }
        } else {
            // Remove from helpful if exists
            review.helpful = review.helpful.filter(id => id.toString() !== userId.toString());
            
            // Toggle notHelpful
            const index = review.notHelpful.findIndex(id => id.toString() === userId.toString());
            if (index > -1) {
                review.notHelpful.splice(index, 1);
                review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
                if (review.helpfulCount > 0) review.helpfulCount -= 1;
            } else {
                review.notHelpful.push(userId);
                review.notHelpfulCount += 1;
            }
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: "Review feedback updated",
            data: {
                helpfulCount: review.helpfulCount,
                notHelpfulCount: review.notHelpfulCount
            }
        });

    } catch (error) {
        console.error("Error in markReviewHelpful:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update review feedback",
            error: error.message
        });
    }
};

// Add reply to review
export const addReviewReply = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Reply text is required"
            });
        }

        const review = await reviewModel.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        review.replies.push({
            user: userId,
            text: text.trim(),
            createdAt: new Date()
        });
        review.repliesCount += 1;

        await review.save();

        const updatedReview = await reviewModel
            .findById(reviewId)
            .populate('replies.user', 'firstName lastName profileImage');

        res.status(200).json({
            success: true,
            message: "Reply added successfully",
            data: updatedReview
        });

    } catch (error) {
        console.error("Error in addReviewReply:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add reply",
            error: error.message
        });
    }
};

// Food partner response to review
export const respondToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { text } = req.body;
        const foodPartnerId = req.user._id; // Assuming food partner is logged in

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Response text is required"
            });
        }

        const review = await reviewModel.findOne({
            _id: reviewId,
            foodPartner: foodPartnerId
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or unauthorized"
            });
        }

        review.response = {
            text: text.trim(),
            respondedAt: new Date(),
            respondedBy: foodPartnerId
        };

        await review.save();

        const updatedReview = await reviewModel
            .findById(reviewId)
            .populate('user', 'firstName lastName profileImage')
            .populate('response.respondedBy', 'companyName username profileImage');

        res.status(200).json({
            success: true,
            message: "Response added successfully",
            data: updatedReview
        });

    } catch (error) {
        console.error("Error in respondToReview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add response",
            error: error.message
        });
    }
};

// Helper function to update food partner ratings
async function updateFoodPartnerRatings(foodPartnerId) {
    try {
        const reviews = await reviewModel.find({
            foodPartner: foodPartnerId,
            isActive: true,
            status: 'approved'
        });

        if (reviews.length === 0) {
            await foodPartnerModel.findByIdAndUpdate(foodPartnerId, {
                averageRating: 0,
                totalReviews: 0,
                ratingBreakdown: {
                    food: 0,
                    service: 0,
                    ambiance: 0,
                    value: 0
                }
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        // Calculate detailed ratings breakdown
        const breakdown = {
            food: 0,
            service: 0,
            ambiance: 0,
            value: 0
        };

        let detailedCount = 0;
        reviews.forEach(review => {
            if (review.ratings) {
                if (review.ratings.food) {
                    breakdown.food += review.ratings.food;
                    detailedCount++;
                }
                if (review.ratings.service) breakdown.service += review.ratings.service;
                if (review.ratings.ambiance) breakdown.ambiance += review.ratings.ambiance;
                if (review.ratings.value) breakdown.value += review.ratings.value;
            }
        });

        if (detailedCount > 0) {
            breakdown.food = breakdown.food / detailedCount;
            breakdown.service = breakdown.service / detailedCount;
            breakdown.ambiance = breakdown.ambiance / detailedCount;
            breakdown.value = breakdown.value / detailedCount;
        }

        await foodPartnerModel.findByIdAndUpdate(foodPartnerId, {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            ratingBreakdown: breakdown
        });

    } catch (error) {
        console.error("Error updating food partner ratings:", error);
    }
}

export default {
    createReview,
    getReviewsByFoodPartner,
    getReviewsByFoodItem,
    getUserReviews,
    updateReview,
    deleteReview,
    markReviewHelpful,
    addReviewReply,
    respondToReview
};
