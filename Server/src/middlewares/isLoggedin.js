import userModel from "../models/user.Model.js";
import jwt from "jsonwebtoken";

async function isLoggedin(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "login first" });
    };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
        console.log(error);
    }
}

export default isLoggedin;