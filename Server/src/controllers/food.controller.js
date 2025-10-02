import foodModel from "../models/food.model.js";
import storageService from "../services/storage.service.js";
import { v4 as uuid } from "uuid";


const createFood = async (req, res) => {
    try {
        const { name, description, type, duration, tags } = req.body;
        
        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Food name is required" });
        }
        
        if (!type || !['video', 'image'].includes(type)) {
            return res.status(400).json({ error: "Valid type (video/image) is required" });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: `${type} file is required` });
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
        
        // Create food document with appropriate field based on type
        const foodData = {
            name: name.trim(),
            description: description?.trim() || "",
            type,
            foodPartner: req.foodPartner._id,
            tags: parsedTags,
        };
        
        // Set the appropriate field based on type
        if (type === 'video') {
            foodData.video = fileUploadResult;
            if (duration) {
                foodData.duration = duration;
            }
        } else {
            foodData.image = fileUploadResult;
        }
        
        const newFoodItem = await foodModel.create(foodData);
        
        // Populate the food partner info for response
        await newFoodItem.populate('foodPartner', 'restaurantName email verified');
        
        res.status(201).json({
            message: "Food created successfully",
            food: newFoodItem
        });
    } catch (error) {
        console.error("Error creating food:", error);
        res.status(500).json({ 
            error: "Failed to create food item",
            details: error.message 
        });
    }
};

const getFoodItems = async (req, res) => {
    try {
        const foods = await foodModel.find({ foodPartner: req.foodPartner._id });
        res.status(200).json({ foods });
    } catch (error) {
        console.error("Error getting foods:", error);
        res.status(500).json({ error: error.message });
    }
};

const getTrendingFoods = async (req, res) => {
    try {
        // Calculate trending score based on likes, comments, and saves
        const foods = await foodModel.aggregate([
            {
                $match: { isActive: true } // Only active foods
            },
            {
                $addFields: {
                    // Calculate trending score (you can adjust the weights)
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
                $limit: 3 // Get top 3
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
                    duration: 1,
                    likeCount: 1,
                    commentCount: 1,
                    savesCount: 1,
                    tags: 1,
                    trendingScore: 1,
                    createdAt: 1,
                    "foodPartner.restaurantName": 1,
                    "foodPartner.email": 1
                }
            }
        ]);

        res.status(200).json({ 
            message: "Trending foods retrieved successfully",
            foods 
        });
    } catch (error) {
        console.error("Error getting trending foods:", error);
        res.status(500).json({ error: error.message });
    }
};

const getAllFoods = async (req, res) => {
    try {
        const foods = await foodModel.find().populate('foodPartner', 'restaurantName email');
        res.status(200).json({ 
            message: "Foods retrieved successfully",
            foods 
        });
    } catch (error) {
        console.error("Error getting all foods:", error);
        res.status(500).json({ error: error.message });
    }
};

export default { createFood, getFoodItems, getAllFoods, getTrendingFoods };