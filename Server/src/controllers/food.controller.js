import foodModel from "../models/food.model.js";


const createFood = async (req, res)=>{
    try{
        console.log(req.foodPartner);
        res.status(201).json({message: "Food created successfully"});
        console.log(req.body)
    }
    catch(error){
        res.status(400).json({error: error.message});
    }
}

export default {createFood}