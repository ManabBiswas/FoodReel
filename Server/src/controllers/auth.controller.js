import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function register(req, res) {
    try {
        const {firstName, lastName, email, password, mobile, profileImage} = req.body;
        const isUserExist = await userModel.findOne({ email });
        if (isUserExist) {
            res.status(400).json({ error: "User already exist" });
        }
        // const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({ 
            firstName, 
            lastName, 
            email, 
            password:hashPassword, 
            mobile, 
            profileImage
        });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.cookie("token", token, { httpOnly: true });
        res.status(201).json({
            message: "User created successfully",
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile
        });
        console.log("User created succesfully", user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


export default {
    register
}