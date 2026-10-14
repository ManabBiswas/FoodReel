import userModel from "../models/user.Model.js";
import jwt from "jsonwebtoken";

async function optionalAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select('_id isBlocked');
        if (user && !user.isBlocked) req.user = user;
    } catch {
        // Invalid/expired/foreign token - treat as anonymous.
    }
    next();
}

export default optionalAuth;
