import userModel from "../models/user.Model.js";
import jwt from "jsonwebtoken";

async function isLoggedin(req, res, next) {
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
        
        if (!user) {
            return res.status(401).json({ 
                isAuthenticated: false,
                message: "User not found" 
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            isAuthenticated: false,
            message: "Unauthorized" 
        });
    }
}

export default isLoggedin;