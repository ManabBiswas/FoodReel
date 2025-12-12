import adminModel from "../models/admin.model.js";
import jwt from "jsonwebtoken";

async function isAdmin(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            isAuthenticated: false,
            message: "Please login first"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await adminModel.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({
                isAuthenticated: false,
                message: "Unauthorized - Admin not found"
            });
        }
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(401).json({
            isAuthenticated: false,
            message: "Unauthorized"
        });
    }
}

export default isAdmin;