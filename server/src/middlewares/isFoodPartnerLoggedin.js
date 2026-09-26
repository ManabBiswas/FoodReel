import foodPartnerModel from "../models/foodPartner.Model.js";
import jwt from 'jsonwebtoken';

async function isFoodPartnerLoggedin(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
       return res.status(401).json({ 
           isAuthenticated: false,
           message: "Please login first" 
       });
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const foodPartner = await foodPartnerModel.findById(decoded.id);
        
        if (!foodPartner) {
            return res.status(401).json({ 
                isAuthenticated: false,
                message: "Partner not found" 
            });
        }

        if (foodPartner.isBlocked) {
            return res.status(403).json({
                isAuthenticated: false,
                message: "Your account has been blocked. Please contact support."
            });
        }
        
        req.foodPartner = foodPartner;
        next();
    }catch(error){
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            isAuthenticated: false,
            message: "Unauthorized" 
        });
    }
}

export default isFoodPartnerLoggedin