import foodPartnerModel from "../models/foodPartner.Model";
import jwt from 'jsonwebtoken';

async function isLoggedin(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
       return res.status(401).json({ message: "login first" });
    };
    try{
        const decoded =jwt.verify(tocken, process.env.JWT_SECRET);
        const foodPartner = await foodPartnerModel.findById(decoded.id);
        req.foodPartner = foodPartner;
        next();
    }catch(error){
        res.status(401).json({ message: "Unauthorized" });
    }
}

export default isFoodPartnerLoggedin