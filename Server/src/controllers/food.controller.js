import foodModel from "../models/food.model.js";
import storageService from "../services/storage.service.js";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";


const createFood = async (req, res) => {
    try {
        const { 
            name, 
            description, 
            type, 
            postType = 'food',
            duration, 
            tags,
            // Food-specific fields
            price,
            currency = 'INR',
            preparationTime,
            isAvailable,
            // Advertisement-specific fields
            promotionType,
            prices,
            validUntil,
            promoCode
        } = req.body;
        
        // Basic validation
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Name is required" });
        }
        
        if (!type || !['video', 'image'].includes(type)) {
            return res.status(400).json({ error: "Valid type (video/image) is required" });
        }
        
        if (!postType || !['food', 'advertisement'].includes(postType)) {
            return res.status(400).json({ error: "Valid post type (food/advertisement) is required" });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: `${type} file is required` });
        }
        
        // Post type specific validation
        if (postType === 'food') {
            if (price && (isNaN(price) || price < 0)) {
                return res.status(400).json({ error: "Price must be a valid positive number" });
            }
            if (preparationTime && (isNaN(preparationTime) || preparationTime < 0)) {
                return res.status(400).json({ error: "Preparation time must be a valid positive number" });
            }
        } else if (postType === 'advertisement') {
            if (promotionType && !['discount', 'bogo', 'combo', 'seasonal', 'announcement'].includes(promotionType)) {
                return res.status(400).json({ error: "Invalid promotion type" });
            }
            if (validUntil && new Date(validUntil) < new Date()) {
                return res.status(400).json({ error: "Valid until date must be in the future" });
            }
        }
        
        // Validate file type based on selected type
        const isVideo = req.file.mimetype.startsWith('video/');
        const isImage = req.file.mimetype.startsWith('image/');
        
        if (type === 'video' && !isVideo) {
            return res.status(400).json({ error: "Please upload a valid video file" });
        }
        
        if (type === 'image' && !isImage) {
            return res.status(400).json({ error: "Please upload a valid image file" });
        }
        
        console.log("Food Partner:", req.foodPartner);
        console.log("Request Body:", req.body);
        console.log("File Info:", {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        
        // Upload file to storage
        const fileUploadResult = await storageService.uploadImage(req.file.buffer, uuid());
        console.log("File upload result:", fileUploadResult);
        
        // Parse tags from string to array
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                // If parsing fails, treat as comma-separated string
                parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
        }
        
        // Parse prices for advertisements
        let parsedPrices = null;
        if (postType === 'advertisement' && prices) {
            try {
                parsedPrices = JSON.parse(prices);
                // Validate prices object
                if (parsedPrices.original && (isNaN(parsedPrices.original) || parsedPrices.original < 0)) {
                    return res.status(400).json({ error: "Original price must be a valid positive number" });
                }
                if (parsedPrices.discounted && (isNaN(parsedPrices.discounted) || parsedPrices.discounted < 0)) {
                    return res.status(400).json({ error: "Discounted price must be a valid positive number" });
                }
            } catch (e) {
                return res.status(400).json({ error: "Invalid prices format" });
            }
        }
        
        // Create food document with appropriate fields
        const foodData = {
            name: name.trim(),
            description: description?.trim() || "",
            type,
            postType,
            foodPartner: req.foodPartner._id,
            tags: parsedTags,
        };
        
        // Set the appropriate media field based on type
        if (type === 'video') {
            foodData.video = fileUploadResult;
            if (duration) {
                foodData.duration = duration;
            }
        } else {
            foodData.image = fileUploadResult;
        }
        
        // Add post-type specific fields
        if (postType === 'food') {
            if (price) {
                foodData.price = parseFloat(price);
                foodData.currency = currency;
            }
            if (preparationTime) {
                foodData.preparationTime = parseInt(preparationTime);
            }
            // Set availability status (default to true if not provided)
            foodData.isAvailable = isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true;
        } else if (postType === 'advertisement') {
            if (promotionType) {
                foodData.promotionType = promotionType;
            }
            if (parsedPrices) {
                foodData.prices = {
                    original: parsedPrices.original ? parseFloat(parsedPrices.original) : undefined,
                    discounted: parsedPrices.discounted ? parseFloat(parsedPrices.discounted) : undefined
                };
            }
            if (validUntil) {
                foodData.validUntil = new Date(validUntil);
            }
            if (promoCode) {
                foodData.promoCode = promoCode.trim().toUpperCase();
            }
        }
        
        const newFoodItem = await foodModel.create(foodData);
        
        // Populate the food partner info for response
        await newFoodItem.populate('foodPartner', 'restaurantName email verified');
        
        res.status(201).json({
            message: `${postType === 'food' ? 'Food item' : 'Advertisement'} created successfully`,
            food: newFoodItem
        });
    } catch (error) {
        console.error("Error creating food/advertisement:", error);
        res.status(500).json({ 
            error: "Failed to create post",
            details: error.message 
        });
    }
};

const getFoodItems = async (req, res) => {
    try {
        const { postType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        // Build filter for partner's posts
        const filter = { foodPartner: req.foodPartner._id, isActive: true };
        if (postType && ['food', 'advertisement'].includes(postType)) {
            filter.postType = postType;
        }
        
        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const foods = await foodModel
            .find(filter)
            .populate('foodPartner', 'restaurantName email verified')
            .sort(sortObj);
            
        // Group by post type for easier frontend handling
        const groupedFoods = {
            food: foods.filter(item => item.postType === 'food'),
            advertisement: foods.filter(item => item.postType === 'advertisement'),
            all: foods
        };
        
        res.status(200).json({ 
            message: "Partner posts retrieved successfully",
            counts: {
                total: foods.length,
                food: groupedFoods.food.length,
                advertisement: groupedFoods.advertisement.length
            },
            foods: postType ? foods : groupedFoods 
        });
    } catch (error) {
        console.error("Error getting partner foods:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get active advertisements (for promotional display)
const getActiveAdvertisements = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const validLimit = Math.min(parseInt(limit), 50);
        
        const currentDate = new Date();
        
        const advertisements = await foodModel
            .find({
                postType: 'advertisement',
                isActive: true,
                $or: [
                    { validUntil: { $gte: currentDate } }, // Valid advertisements
                    { validUntil: { $exists: false } }     // Advertisements without expiry
                ]
            })
            .populate('foodPartner', 'restaurantName email verified profileImage')
            .sort({ createdAt: -1 })
            .limit(validLimit)
            .lean();
        
        res.status(200).json({
            message: "Active advertisements retrieved successfully",
            count: advertisements.length,
            advertisements
        });
    } catch (error) {
        console.error("Error getting active advertisements:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get food items with pricing (for ordering)
const getFoodItemsWithPricing = async (req, res) => {
    try {
        const { minPrice, maxPrice, currency = 'INR', limit = 20 } = req.query;
        const validLimit = Math.min(parseInt(limit), 100);
        
        // Build filter for food items with pricing
        const filter = {
            postType: 'food',
            isActive: true,
            price: { $exists: true, $gt: 0 }
        };
        
        // Add price range filters
        if (minPrice) {
            filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
        }
        if (maxPrice) {
            filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
        }
        
        // Add currency filter
        if (currency) {
            filter.currency = currency;
        }
        
        const foodItems = await foodModel
            .find(filter)
            .populate('foodPartner', 'restaurantName email verified profileImage address')
            .sort({ price: 1 }) // Sort by price ascending
            .limit(validLimit)
            .lean();
        
        res.status(200).json({
            message: "Food items with pricing retrieved successfully",
            count: foodItems.length,
            filters: {
                minPrice: minPrice || 'none',
                maxPrice: maxPrice || 'none',
                currency
            },
            foodItems
        });
    } catch (error) {
        console.error("Error getting food items with pricing:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get post statistics for partners
const getPostStatistics = async (req, res) => {
    try {
        const partnerId = req.foodPartner._id;
        
        const stats = await foodModel.aggregate([
            {
                $match: { foodPartner: partnerId, isActive: true }
            },
            {
                $group: {
                    _id: "$postType",
                    count: { $sum: 1 },
                    totalLikes: { $sum: "$likeCount" },
                    totalComments: { $sum: "$commentCount" },
                    totalSaves: { $sum: "$savesCount" },
                    avgLikes: { $avg: "$likeCount" },
                    avgComments: { $avg: "$commentCount" },
                    avgSaves: { $avg: "$savesCount" }
                }
            }
        ]);
        
        // Format statistics
        const formattedStats = {
            food: stats.find(s => s._id === 'food') || { count: 0, totalLikes: 0, totalComments: 0, totalSaves: 0, avgLikes: 0, avgComments: 0, avgSaves: 0 },
            advertisement: stats.find(s => s._id === 'advertisement') || { count: 0, totalLikes: 0, totalComments: 0, totalSaves: 0, avgLikes: 0, avgComments: 0, avgSaves: 0 },
            total: {
                count: stats.reduce((sum, s) => sum + s.count, 0),
                totalLikes: stats.reduce((sum, s) => sum + s.totalLikes, 0),
                totalComments: stats.reduce((sum, s) => sum + s.totalComments, 0),
                totalSaves: stats.reduce((sum, s) => sum + s.totalSaves, 0)
            }
        };
        
        res.status(200).json({
            message: "Post statistics retrieved successfully",
            statistics: formattedStats
        });
    } catch (error) {
        console.error("Error getting post statistics:", error);
        res.status(500).json({ error: error.message });
    }
};

const getTrendingFoods = async (req, res) => {
    try {
        // Get limit from query parameter, default to 3 if not provided
        const { limit = 3, postType } = req.query;
        
        const maxLimit = 50; 
        const validLimit = Math.min(parseInt(limit), maxLimit);
        
        // Build match filter
        const matchFilter = { isActive: true };
        if (postType && ['food', 'advertisement'].includes(postType)) {
            matchFilter.postType = postType;
        }
        
        // Calculate trending score based on likes, comments, and saves
        const foods = await foodModel.aggregate([
            {
                $match: matchFilter
            },
            {
                $addFields: {
                    trendingScore: {
                        $add: [
                            { $multiply: ["$likeCount", 1] },      // likes weight: 1
                            { $multiply: ["$commentCount", 2] },   // comments weight: 2
                            { $multiply: ["$savesCount", 3] }      // saves weight: 3
                        ]
                    }
                }
            },
            {
                $sort: { trendingScore: -1 } // Sort by trending score descending
            },
            {
                $limit: validLimit // Use dynamic limit
            },
            {
                $lookup: {
                    from: "foodpartners", // Collection name (lowercase + plural)
                    localField: "foodPartner",
                    foreignField: "_id",
                    as: "foodPartner"
                }
            },
            {
                $unwind: "$foodPartner"
            },
            {
                $project: {
                    name: 1,
                    video: 1,
                    image: 1,
                    description: 1,
                    type: 1,
                    postType: 1,
                    duration: 1,
                    // Food-specific fields
                    price: 1,
                    currency: 1,
                    preparationTime: 1,
                    // Advertisement-specific fields
                    promotionType: 1,
                    prices: 1,
                    validUntil: 1,
                    promoCode: 1,
                    // Common fields
                    likeCount: 1,
                    commentCount: 1,
                    savesCount: 1,
                    tags: 1,
                    trendingScore: 1,
                    createdAt: 1,
                    "foodPartner.restaurantName": 1,
                    "foodPartner.email": 1,
                    "foodPartner.verified": 1
                }
            }
        ]);

        res.status(200).json({ 
            message: "Trending posts retrieved successfully",
            count: foods.length,
            limit: validLimit,
            postType: postType || 'all',
            foods 
        });
    } catch (error) {
        console.error("Error getting trending foods:", error);
        res.status(500).json({ error: error.message });
    }
};

const getAllFoods = async (req, res) => {
    try {
        // Get query parameters for filtering
        const { postType, limit = 50, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        // Build filter object
        const filter = { isActive: true };
        if (postType && ['food', 'advertisement'].includes(postType)) {
            filter.postType = postType;
        }
        
        // Calculate pagination
        const validLimit = Math.min(parseInt(limit), 100); // Max 100 items per page
        const skip = (parseInt(page) - 1) * validLimit;
        
        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const foods = await foodModel
            .find(filter)
            .populate('foodPartner', 'restaurantName email verified profileImage')
            .populate('likes', '_id') // Populate likes to check if user liked
            .sort(sortObj)
            .skip(skip)
            .limit(validLimit)
            .lean(); // Use lean for better performance
        
        // Get total count for pagination
        const totalCount = await foodModel.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / validLimit);
        
        res.status(200).json({ 
            message: "Posts retrieved successfully",
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            },
            data: foods 
        });
    } catch (error) {
        console.error("Error getting all foods:", error);
        res.status(500).json({ error: error.message });
    }
};

// Toggle like on a post
const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        
        const userId = req.user._id;
        
        const food = await foodModel.findById(id);
        if (!food) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        const likeIndex = food.likes.indexOf(userId);
        
        if (likeIndex > -1) {
            // Unlike
            food.likes.splice(likeIndex, 1);
            food.likeCount = Math.max(0, food.likeCount - 1);
        } else {
            // Like
            food.likes.push(userId);
            food.likeCount += 1;
        }
        
        await food.save();
        
        res.status(200).json({
            message: likeIndex > -1 ? "Post unliked" : "Post liked",
            isLiked: likeIndex === -1,
            likeCount: food.likeCount
        });
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ error: error.message });
    }
};

// Toggle save on a post
const toggleSave = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        
        const userId = req.user._id;
        
        const food = await foodModel.findById(id);
        if (!food) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Check if user has saved this post (you might need to add a saves array to food model)
        // For now, just increment/decrement the counter
        const isSaved = req.body.isSaved || false;
        
        if (isSaved) {
            food.savesCount = Math.max(0, food.savesCount - 1);
        } else {
            food.savesCount += 1;
        }
        
        await food.save();
        
        res.status(200).json({
            message: isSaved ? "Post unsaved" : "Post saved",
            isSaved: !isSaved,
            savesCount: food.savesCount
        });
    } catch (error) {
        console.error("Error toggling save:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get reviews for a food item
const getReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, page = 1 } = req.query;
        
        const validLimit = Math.min(parseInt(limit), 50);
        const skip = (parseInt(page) - 1) * validLimit;
        
        const reviewModel = (await import('../models/review.model.js')).default;
        
        const reviews = await reviewModel
            .find({ foodItem: id, isActive: true })
            .populate('user', 'username name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(validLimit)
            .lean();
        
        const totalCount = await reviewModel.countDocuments({ foodItem: id, isActive: true });
        
        // Calculate average rating
        const avgRating = await reviewModel.aggregate([
            { $match: { foodItem: mongoose.Types.ObjectId(id), isActive: true } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } }
        ]);
        
        res.status(200).json({
            message: "Reviews retrieved successfully",
            reviews,
            totalCount,
            averageRating: avgRating[0]?.avgRating || 0,
            page: parseInt(page),
            totalPages: Math.ceil(totalCount / validLimit)
        });
    } catch (error) {
        console.error("Error getting reviews:", error);
        res.status(500).json({ error: error.message });
    }
};

// Add a review to a food item
const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        
        const userId = req.user._id;
        const { rating, comment } = req.body;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }
        
        if (!comment || !comment.trim()) {
            return res.status(400).json({ error: "Comment is required" });
        }
        
        const food = await foodModel.findById(id);
        if (!food) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        const reviewModel = (await import('../models/review.model.js')).default;
        
        // Check if user already reviewed this item
        const existingReview = await reviewModel.findOne({
            user: userId,
            foodItem: id
        });
        
        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this item" });
        }
        
        const newReview = await reviewModel.create({
            user: userId,
            foodPartner: food.foodPartner,
            foodItem: id,
            rating,
            comment: comment.trim()
        });
        
        await newReview.populate('user', 'username name email');
        
        res.status(201).json({
            message: "Review added successfully",
            review: newReview
        });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ error: error.message });
    }
};

export default { 
    createFood, 
    getFoodItems, 
    getAllFoods, 
    getTrendingFoods,
    getActiveAdvertisements,
    getFoodItemsWithPricing,
    getPostStatistics,
    toggleLike,
    toggleSave,
    getReviews,
    addReview
};