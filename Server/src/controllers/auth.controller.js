import userModel from "../models/user.Model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function register(req, res) {
    try {
        const {firstName, lastName, email, password, mobile} = req.body;
        const isUserExist = await userModel.findOne({ email });
        if (isUserExist) {
            return res.status(400).json({ error: "User already exist" });
        }
        // const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({ 
            firstName, 
            lastName, 
            email, 
            password:hashPassword, 
            mobile    
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

async function login(req, res) {
    try{
        const {email, password} = req.body;
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(400).json({
                error: "Invalid email and Password"
            });
        }
        else{
            const isPasswordMatched = await bcrypt.compare(password,user.password,(err,result)=>{
                if(result){
                    const token = jwt.sign({ id: user._id,email: user.email }, process.env.JWT_SECRET);
                    res.cookie('token',token)
                    res.status(200).json({
                        message: "User logged in successfully",
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        mobile: user.mobile
                    });
                }else{
                    return res.status(400).json({
                        error: "Invalid email and Password"
                    });

                }
            });
                

                
        }
    }catch(error){
        res.status(400).json({ error: error.message });
    }
}

async function logout(req, res) {
    res.clearCookie('token');
    res.status(200).json({ message: "User logged out successfully" });
    
}

async function verify(req, res) {
    // This endpoint uses the isLoggedin middleware to verify the token
    // If we reach here, the user is authenticated
    res.status(200).json({ 
        message: "User is authenticated",
        user: {
            _id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            mobile: req.user.mobile
        }
    });
}

export default {
    register,
    login,
    logout,
    verify
}