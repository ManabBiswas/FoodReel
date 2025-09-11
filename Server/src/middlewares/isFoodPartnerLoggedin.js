import foodPartnerModel from "../models/foodPartner.Model.js";
import jwt from 'jsonwebtoken';

async function isFoodPartnerLoggedin(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
       return res.status(401).json({ message: "login first" });
    };
    try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const foodPartner = await foodPartnerModel.findById(decoded.id);
        req.foodPartner = foodPartner;
        next();
    }catch(error){
        res.status(401).json({ message: "Unauthorized" });
        console.log(error);
    }
}

export default isFoodPartnerLoggedin