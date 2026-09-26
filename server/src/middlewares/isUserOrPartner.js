import userModel from "../models/user.Model.js";
import foodPartnerModel from "../models/foodPartner.Model.js";
import jwt from "jsonwebtoken";

// Accept EITHER a user or a food-partner session (shared 'token' cookie).
// Sets req.user and req.userType ('User' | 'FoodPartner').
async function isUserOrPartner(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            isAuthenticated: false,
            message: "Please login first"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id);
        if (user) {
            if (user.isBlocked) {
                return res.status(403).json({
                    isAuthenticated: false,
                    message: "Your account has been blocked. Please contact support."
                });
            }
            req.user = user;
            req.userType = 'User';
            return next();
        }

        const partner = await foodPartnerModel.findById(decoded.id);
        if (partner) {
            if (partner.isBlocked) {
                return res.status(403).json({
                    isAuthenticated: false,
                    message: "Your account has been blocked. Please contact support."
                });
            }
            req.user = partner;
            req.userType = 'FoodPartner';
            return next();
        }

        return res.status(401).json({
            isAuthenticated: false,
            message: "Account not found"
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            isAuthenticated: false,
            message: "Unauthorized"
        });
    }
}

export default isUserOrPartner;
