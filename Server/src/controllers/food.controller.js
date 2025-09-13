import foodModel from "../models/food.model.js";
import storageService from "../services/storage.service.js";
import { v4 as uuid } from "uuid";


const createFood = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Food name is required" });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: "Video file is required" });
        }
        
        console.log("Food Partner:", req.foodPartner);
        console.log("Request Body:", req.body);
        console.log("File Info:", {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        const fileUploadReasult = await storageService.uploadImage(req.file.buffer, uuid() );
        console.log(fileUploadReasult);
        
        // Create new food document
        const newFoodItem = await foodModel.create({
            name,
            description: description || "",
            video: fileUploadReasult, // uploadImage returns the URL string directly
            foodPartner: req.foodPartner._id,
        });
        
        res.status(201).json({
            message: "Food created successfully",
            food: newFoodItem
            // {
            //     _id: newFoodItem._id,
            //     name: newFoodItem.name,
            //     description: newFoodItem.description,
            //     foodPartner: newFoodItem.foodPartner
            // }
        });
    } catch (error) {
        console.error("Error creating food:", error);
        res.status(500).json({ error: error.message });
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

export default { createFood, getFoodItems, getAllFoods }