import foodModel from "../models/food.model.js";
import { serverError } from "../utils/apiError.js";
import { resolveSort, FOOD_SORT_FIELDS } from '../utils/sortQuery.js';
import storageService from "../services/storage.service.js";
import { updateFoodPartnerRatings } from "./review.controller.js";
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
            price,
            currency = 'INR',
            preparationTime,
            isAvailable,
            promotionType,
            prices,
            validUntil,
            promoCode
        } = req.body;

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

        // Validate file type against declared type
        const mimeIsVideo = req.file.mimetype.startsWith('video/');
        const mimeIsImage = req.file.mimetype.startsWith('image/');

        if (type === 'video' && !mimeIsVideo) {
            return res.status(400).json({ error: "Please upload a valid video file" });
        }
        if (type === 'image' && !mimeIsImage) {
            return res.status(400).json({ error: "Please upload a valid image file" });
        }

        // ── FIXED UPLOAD ─────────────────────────────────────────────
        // Pass mimetype so storage.service enforces the correct extension.
        // Without this, ImageKit stores UUID filenames with no extension and
        // the /ik-thumbnail.jpg API silently returns nothing for videos.
        const { url: fileUrl, isVideo: uploadedAsVideo } = await storageService.uploadFile(
            req.file.buffer,
            req.file.originalname,   // e.g. "biryani.mp4" — kept for human readability
            req.file.mimetype        // e.g. "video/mp4"   — enforces extension on ImageKit
        );
        // ─────────────────────────────────────────────────────────────

        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch {
                parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
        }

        let parsedPrices = null;
        if (postType === 'advertisement' && prices) {
            try {
                parsedPrices = JSON.parse(prices);
                if (parsedPrices.original && (isNaN(parsedPrices.original) || parsedPrices.original < 0)) {
                    return res.status(400).json({ error: "Original price must be a valid positive number" });
                }
                if (parsedPrices.discounted && (isNaN(parsedPrices.discounted) || parsedPrices.discounted < 0)) {
                    return res.status(400).json({ error: "Discounted price must be a valid positive number" });
                }
            } catch {
                return res.status(400).json({ error: "Invalid prices format" });
            }
        }

        const foodData = {
            name: name.trim(),
            description: description?.trim() || "",
            postType,
            foodPartner: req.foodPartner._id,
            tags: parsedTags,
        };

        // ── Set media fields from actual upload result (not from client's declared type) ──
        if (uploadedAsVideo) {
            foodData.video = fileUrl;
            foodData.type = 'video';           // ground truth: mimetype wins over client field
            if (duration) foodData.duration = duration;
        } else {
            foodData.image = fileUrl;
            foodData.type = 'image';
        }

        if (postType === 'food') {
            if (price) foodData.price = parseFloat(price);
            if (currency) foodData.currency = currency;
            if (preparationTime) foodData.preparationTime = parseInt(preparationTime);
            foodData.isAvailable = isAvailable !== undefined
                ? (isAvailable === 'true' || isAvailable === true)
                : true;
        } else if (postType === 'advertisement') {
            if (promotionType) foodData.promotionType = promotionType;
            if (parsedPrices) foodData.prices = {
                original: parsedPrices.original ? parseFloat(parsedPrices.original) : undefined,
                discounted: parsedPrices.discounted ? parseFloat(parsedPrices.discounted) : undefined
            };
            if (validUntil) foodData.validUntil = new Date(validUntil);
            if (promoCode) foodData.promoCode = promoCode.trim().toUpperCase();
        }

        const newFoodItem = await foodModel.create(foodData);
        await newFoodItem.populate('foodPartner', 'companyName email verified');

        res.status(201).json({
            message: `${postType === 'food' ? 'Food item' : 'Advertisement'} created successfully`,
            food: newFoodItem
        });
    } catch (error) {
        console.error("Error creating food/advertisement:", error);
        serverError(res, error, "Failed to create post");
    }
};

const getFoodItems = async (req, res) => {
    try {
        const { postType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const filter = { foodPartner: req.foodPartner._id };
        if (postType && ['food', 'advertisement'].includes(postType)) {
            filter.postType = postType;
        }

        const { sort: sortObj } = resolveSort({ sortBy, sortOrder, allowed: FOOD_SORT_FIELDS });

        const foods = await foodModel
            .find(filter)
            .populate('foodPartner', 'companyName email verified')
            .sort(sortObj);

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
        serverError(res, error);
    }
};

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
                    { validUntil: { $gte: currentDate } },
                    { validUntil: { $exists: false } }
                ]
            })
            .populate('foodPartner', 'companyName email verified profileImage')
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
        serverError(res, error);
    }
};

const getFoodItemsWithPricing = async (req, res) => {
    try {
        const { minPrice, maxPrice, currency = 'INR', limit = 20 } = req.query;
        const validLimit = Math.min(parseInt(limit), 100);

        const filter = {
            postType: 'food',
            isActive: true,
            isAvailable: { $ne: false },
            price: { $exists: true, $gt: 0 }
        };

        if (minPrice) filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
        if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
        if (currency) filter.currency = currency;

        const foodItems = await foodModel
            .find(filter)
            .populate('foodPartner', 'companyName email verified profileImage address')
            .sort({ price: 1 })
            .limit(validLimit)
            .lean();

        res.status(200).json({
            message: "Food items with pricing retrieved successfully",
            count: foodItems.length,
            filters: { minPrice: minPrice || 'none', maxPrice: maxPrice || 'none', currency },
            foodItems
        });
    } catch (error) {
        console.error("Error getting food items with pricing:", error);
        serverError(res, error);
    }
};

const getPostStatistics = async (req, res) => {
    try {
        const partnerId = req.foodPartner._id;

        const stats = await foodModel.aggregate([
            { $match: { foodPartner: partnerId, isActive: true } },
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

        const empty = { count: 0, totalLikes: 0, totalComments: 0, totalSaves: 0, avgLikes: 0, avgComments: 0, avgSaves: 0 };
        const formattedStats = {
            food: stats.find(s => s._id === 'food') || empty,
            advertisement: stats.find(s => s._id === 'advertisement') || empty,
            total: {
                count: stats.reduce((s, x) => s + x.count, 0),
                totalLikes: stats.reduce((s, x) => s + x.totalLikes, 0),
                totalComments: stats.reduce((s, x) => s + x.totalComments, 0),
                totalSaves: stats.reduce((s, x) => s + x.totalSaves, 0)
            }
        };

        res.status(200).json({ message: "Post statistics retrieved successfully", statistics: formattedStats });
    } catch (error) {
        console.error("Error getting post statistics:", error);
        serverError(res, error);
    }
};

const getTrendingFoods = async (req, res) => {
    try {
        const { limit = 3, postType } = req.query;
        const validLimit = Math.min(parseInt(limit), 50);

        const matchFilter = { isActive: true, isAvailable: { $ne: false } };
        if (postType && ['food', 'advertisement'].includes(postType)) {
            matchFilter.postType = postType;
        }

        const foods = await foodModel.aggregate([
            { $match: matchFilter },
            {
                $addFields: {
                    trendingScore: {
                        $add: [
                            { $multiply: ["$likeCount", 1] },
                            { $multiply: ["$commentCount", 2] },
                            { $multiply: ["$savesCount", 3] }
                        ]
                    }
                }
            },
            { $sort: { trendingScore: -1 } },
            { $limit: validLimit },
            {
                $lookup: {
                    from: "foodpartners",
                    localField: "foodPartner",
                    foreignField: "_id",
                    as: "foodPartner"
                }
            },
            { $unwind: "$foodPartner" },
            {
                $project: {
                    name: 1, video: 1, image: 1, description: 1,
                    type: 1, postType: 1, duration: 1,
                    price: 1, currency: 1, preparationTime: 1,
                    promotionType: 1, prices: 1, validUntil: 1, promoCode: 1,
                    likeCount: 1, commentCount: 1, savesCount: 1,
                    tags: 1, trendingScore: 1, createdAt: 1,
                    "foodPartner.companyName": 1,
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
        serverError(res, error);
    }
};

const getAllFoods = async (req, res) => {
    try {
        const { postType, limit = 50, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const filter = { isActive: true, isAvailable: { $ne: false } };
        if (postType && ['food', 'advertisement'].includes(postType)) filter.postType = postType;

        const validLimit = Math.min(parseInt(limit), 100);
        const skip = (parseInt(page) - 1) * validLimit;
        const { sort: sortObj } = resolveSort({ sortBy, sortOrder, allowed: FOOD_SORT_FIELDS });

        const foods = await foodModel
            .find(filter)
            .populate('foodPartner', 'companyName email verified profileImage')
            .populate('likes', '_id')
            .sort(sortObj)
            .skip(skip)
            .limit(validLimit)
            .lean();

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
        serverError(res, error);
    }
};

// GET /api/food/:id - single post detail. Public like the feed;
const getFoodById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: "Post not found" });
        }

        const food = await foodModel
            .findOne({ _id: id, isActive: true, isAvailable: { $ne: false } })
            .populate('foodPartner', 'companyName email verified profileImage')
            .populate('likes', '_id')
            .lean();

        if (!food) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json({
            message: "Post retrieved successfully",
            data: food
        });
    } catch (error) {
        console.error("Error getting food by id:", error);
        serverError(res, error);
    }
};

const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user?._id) return res.status(401).json({ error: "User not authenticated" });
        const userId = req.user._id;

        const unliked = await foodModel.findOneAndUpdate(
            { _id: id, likes: userId },
            { $pull: { likes: userId }, $inc: { likeCount: -1 } },
            { new: true }
        );

        if (unliked) {
            if (unliked.likeCount < 0) {
                // Data was already drifted below zero; clamp once.
                await foodModel.updateOne({ _id: id, likeCount: { $lt: 0 } }, { $set: { likeCount: 0 } });
                unliked.likeCount = 0;
            }
            return res.status(200).json({
                message: "Post unliked",
                isLiked: false,
                likeCount: unliked.likeCount
            });
        }

        const liked = await foodModel.findOneAndUpdate(
            { _id: id, likes: { $ne: userId } },
            { $addToSet: { likes: userId }, $inc: { likeCount: 1 } },
            { new: true }
        );

        if (liked) {
            return res.status(200).json({
                message: "Post liked",
                isLiked: true,
                likeCount: liked.likeCount
            });
        }

        // Either the post vanished or a concurrent request already toggled it;
        // refetch so the response reflects the true current state.
        const fresh = await foodModel.findById(id);
        if (!fresh) return res.status(404).json({ error: "Post not found" });
        const isLiked = fresh.likes.some((u) => u.toString() === userId.toString());
        res.status(200).json({
            message: isLiked ? "Post liked" : "Post unliked",
            isLiked,
            likeCount: fresh.likeCount
        });
    } catch (error) {
        console.error("Error toggling like:", error);
        serverError(res, error);
    }
};

const toggleSave = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user?._id) return res.status(401).json({ error: "User not authenticated" });
        const userId = req.user._id;

        const food = await foodModel.findById(id).select('savesCount');
        if (!food) return res.status(404).json({ error: "Post not found" });

        const userModel = (await import('../models/user.Model.js')).default;


        const unsaved = await userModel.findOneAndUpdate(
            { _id: userId, savedFoods: id },
            { $pull: { savedFoods: id } },
            { new: true }
        );

        if (unsaved) {
            await foodModel.updateOne(
                { _id: id, savesCount: { $gt: 0 } },
                { $inc: { savesCount: -1 } }
            );
            const fresh = await foodModel.findById(id).select('savesCount');
            return res.status(200).json({
                message: "Post unsaved",
                isSaved: false,
                savesCount: fresh?.savesCount ?? 0
            });
        }

        const saved = await userModel.findOneAndUpdate(
            { _id: userId, savedFoods: { $ne: id } },
            { $addToSet: { savedFoods: id } },
            { new: true }
        );

        if (saved) {
            await foodModel.updateOne({ _id: id }, { $inc: { savesCount: 1 } });
            const fresh = await foodModel.findById(id).select('savesCount');
            return res.status(200).json({
                message: "Post saved",
                isSaved: true,
                savesCount: fresh?.savesCount ?? 0
            });
        }

        // savedFoods already contained the id (concurrent save won) - report
        // the current state rather than toggling again.
        const fresh = await foodModel.findById(id).select('savesCount');
        res.status(200).json({
            message: "Post saved",
            isSaved: true,
            savesCount: fresh?.savesCount ?? 0
        });
    } catch (error) {
        console.error("Error toggling save:", error);
        serverError(res, error);
    }
};

const getReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, page = 1 } = req.query;
        const validLimit = Math.min(parseInt(limit), 50);
        const skip = (parseInt(page) - 1) * validLimit;

        const reviewModel = (await import('../models/review.model.js')).default;

        const reviews = await reviewModel
            .find({ foodItem: id, isActive: true })
            .populate('user', 'firstName lastName profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(validLimit)
            .lean();

        const totalCount = await reviewModel.countDocuments({ foodItem: id, isActive: true });
        const avgRating = await reviewModel.aggregate([
            { $match: { foodItem: new mongoose.Types.ObjectId(id), isActive: true } },
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
        serverError(res, error);
    }
};

const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user?._id) return res.status(401).json({ error: "User not authenticated" });

        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be between 1 and 5" });
        if (!comment?.trim()) return res.status(400).json({ error: "Comment is required" });

        const food = await foodModel.findById(id);
        if (!food) return res.status(404).json({ error: "Post not found" });

        const reviewModel = (await import('../models/review.model.js')).default;
        const existing = await reviewModel.findOne({
            user: req.user._id,
            foodItem: id,
            isActive: true
        });

        // Already reviewed this item -> overwrite them
        if (existing) {
            existing.rating = rating;
            existing.comment = comment.trim();
            await existing.save();
            await updateFoodPartnerRatings(existing.foodPartner);
            await existing.populate('user', 'firstName lastName profileImage');
            return res.status(200).json({
                message: "Review updated successfully",
                review: existing,
                updated: true
            });
        }

        const newReview = await reviewModel.create({
            user: req.user._id,
            foodPartner: food.foodPartner,
            foodItem: id,
            rating,
            comment: comment.trim()
        });

        await updateFoodPartnerRatings(newReview.foodPartner);
        await newReview.populate('user', 'firstName lastName profileImage');
        res.status(201).json({ message: "Review added successfully", review: newReview, updated: false });
    } catch (error) {
        console.error("Error adding review:", error);
        serverError(res, error);
    }
};

const deleteFood = async (req, res) => {
    try {
        const { id } = req.params;
        const food = await foodModel.findOne({ _id: id, foodPartner: req.foodPartner._id });
        if (!food) return res.status(404).json({ error: 'Food item not found or permission denied' });

        await foodModel.findByIdAndDelete(id);
        res.status(200).json({ message: 'Food item deleted successfully', deletedFoodId: id });
    } catch (error) {
        console.error('Error deleting food:', error);
        serverError(res, error);
    }
};

const updateFood = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, cuisine, ingredients, preparationTime, isAvailable } = req.body;

        const food = await foodModel.findOne({ _id: id, foodPartner: req.foodPartner._id });
        if (!food) return res.status(404).json({ error: 'Food item not found or permission denied' });

        if (name) food.name = name;
        if (description) food.description = description;
        if (price) food.price = price;
        if (cuisine) food.cuisine = cuisine;
        if (ingredients) food.ingredients = ingredients;
        if (preparationTime) food.preparationTime = preparationTime;
        if (typeof isAvailable === 'boolean') food.isAvailable = isAvailable;

        if (req.file) {
            const mimeIsVideo = req.file.mimetype.startsWith('video/');
            const mimeIsImage = req.file.mimetype.startsWith('image/');

            if (!mimeIsVideo && !mimeIsImage) {
                return res.status(400).json({ error: 'Please upload a valid image or video file' });
            }

            const { url: fileUrl, isVideo: uploadedAsVideo } = await storageService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );

            if (uploadedAsVideo) {
                food.video = fileUrl;
                food.image = undefined;
                food.type = 'video';
            } else {
                food.image = fileUrl;
                food.video = undefined;
                food.type = 'image';
            }
        }

        await food.save();
        res.status(200).json({ message: 'Food item updated successfully', food });
    } catch (error) {
        console.error('Error updating food:', error);
        serverError(res, error);
    }
};

export default {
    createFood, getFoodItems, getAllFoods, getFoodById, getTrendingFoods,
    getActiveAdvertisements, getFoodItemsWithPricing, getPostStatistics,
    toggleLike, toggleSave, getReviews, addReview, deleteFood, updateFood
};