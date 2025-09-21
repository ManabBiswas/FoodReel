import foodPartnerModel from "../models/foodPartner.Model.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

async function register(req,res) {
    try{
        const {companyName,email,password,mobile,address,latitude,longitude} = req.body;
        
        // Convert mobile to number and validate
        const mobileNumber = parseInt(mobile);
        if (isNaN(mobileNumber)) {
            return res.status(400).json({error: "Invalid mobile number format"});
        }
        
        // Convert coordinates to numbers if provided
        const lat = latitude ? parseFloat(latitude) : null;
        const lng = longitude ? parseFloat(longitude) : null;
        
        const isPartnerExist = await foodPartnerModel.findOne({email})
        if(isPartnerExist){
            res.status(400).json({error: "FoodPartner already exist"})
        }else{
            const hashPassword = await bcrypt.hash(password,10);
            const foodPartner = await foodPartnerModel.create({
                companyName,
                email,
                mobile: mobileNumber,
                password: hashPassword,
                address,
                latitude: lat,
                longitude: lng
                // profileImage will be added later via profile update
            })
            const token = jwt.sign({id: foodPartner._id,email: foodPartner.email},process.env.JWT_SECRET);
            res.cookie('token',token)
            res.status(201).json({
                message: "FoodPartner created successfully",
                _id: foodPartner._id,
                companyName: foodPartner.companyName,
                email: foodPartner.email,
                mobile: foodPartner.mobile
            })
        }
    }catch(error){
        console.error('Registration error:', error);
        res.status(400).json({error: error.message});
    }
}

async function login(req,res){
    try{
        const {email,password} = req.body;
        const foodPartner = await foodPartnerModel.findOne({email});
        if(!foodPartner){
            return res.status(400).json({
                error: "Invalid email and Password"
            });
        }
        else{
            const isPasswordMatched = await bcrypt.compare(password,foodPartner.password,(err,result)=>{
                if(result){
                    const token = jwt.sign({ id: foodPartner._id,email: foodPartner.email }, process.env.JWT_SECRET);
                    res.cookie('token',token)
                    res.status(200).json({
                        message: "FoodPartner logged in successfully",
                        _id: foodPartner._id,
                        companyName: foodPartner.companyName,
                        email: foodPartner.email,
                    });
                }else{
                    return res.status(400).json({
                        error: "Invalid email and Password"
                    });
                }
                console.log(err);
            }
        )}
    }catch(error){
        res.status(400).json({ error: error.message });
    }  
}

async function logout(req, res) {
    res.clearCookie('token');
    res.status(200).json({message: "food partner logout successfully"})
    
}

export default {
    register,
    login,
    logout
}
