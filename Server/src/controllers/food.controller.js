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

export default {createFood}