import foodPartnerModel from "../models/foodPartner.Model.js";
import foodModel from "../models/food.model.js";
import reviewModel from "../models/review.model.js";
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

async function check(req, res) {
    try {
        // If middleware passes, user is authenticated
        const foodPartner = req.foodPartner;
        res.status(200).json({
            isAuthenticated: true,
            user: {
                _id: foodPartner._id,
                companyName: foodPartner.companyName,
                email: foodPartner.email,
                mobile: foodPartner.mobile
            }
        });
    } catch (error) {
        res.status(401).json({
            isAuthenticated: false,
            message: "Not authenticated"
        });
    }
}

// Get partner profile data
async function getProfile(req, res) {
    try {
        const partnerId = req.foodPartner._id;
        
        // Get partner data
        const partner = await foodPartnerModel.findById(partnerId).select('-password');
        if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
        }

        // Get food items count and food items
        const foodItems = await foodModel.find({ 
            foodPartner: partnerId, 
            isActive: true 
        }).sort({ createdAt: -1 });

        // Update food items count
        await foodPartnerModel.findByIdAndUpdate(partnerId, {
            foodItemsCount: foodItems.length
        });

        // Format food items for frontend
        const formattedFoodItems = foodItems.map(item => ({
            id: item._id,
            name: item.name,
            image: item.image,
            video: item.video,
            likeCount: item.likeCount || 0,
            commentCount: item.commentCount || 0,
            type: item.type,
            duration: item.duration,
            description: item.description,
            tags: item.tags || []
        }));

        console.log('Formatted food items:', formattedFoodItems);

        res.status(200).json({
            partner: {
                companyName: partner.companyName,
                username: partner.username || `@${partner.companyName.toLowerCase().replace(/\s+/g, '_')}`,
                email: partner.email,
                phone: partner.mobile ? `+91 ${partner.mobile}` : "",//+91 is default country code It will use for my contry india
                address: partner.address,
                bio: partner.bio || "",
                followers: partner.followersCount,
                foodItems: partner.foodItemsCount,
                following: partner.followingCount,
                verified: partner.verified,
                profileImage: partner.profileImage ? "/api/partner/profile-image/" + partner._id : "/api/placeholder/150/150"
            },
            foodItems: formattedFoodItems
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Update partner bio
async function updateBio(req, res) {
    try {
        const partnerId = req.foodPartner._id;
        const { bio } = req.body;

        if (bio && bio.length > 300) {
            return res.status(400).json({ error: "Bio cannot exceed 300 characters" });
        }

        const updatedPartner = await foodPartnerModel.findByIdAndUpdate(
            partnerId,
            { bio: bio || "" },
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: "Bio updated successfully",
            bio: updatedPartner.bio
        });
    } catch (error) {
        console.error('Update bio error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get partner reviews
async function getReviews(req, res) {
    try {
        const partnerId = req.foodPartner._id;
        
        const reviews = await reviewModel.find({ 
            foodPartner: partnerId, 
            isActive: true 
        })
        .populate('user', 'name email profileImage')
        .populate('foodItem', 'name')
        .sort({ createdAt: -1 });

        const formattedReviews = reviews.map(review => ({
            id: review._id,
            user: {
                name: review.user?.name || "Anonymous User",
                profileImage: review.user?.profileImage || "/api/placeholder/40/40"
            },
            rating: review.rating,
            comment: review.comment,
            foodItem: review.foodItem?.name || "General Review",
            createdAt: review.createdAt,
            helpful: review.helpfulCount,
            verified: review.isVerified,
            images: review.images || []
        }));

        res.status(200).json({
            reviews: formattedReviews,
            totalReviews: reviews.length,
            averageRating: reviews.length > 0 
                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                : 0
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: error.message });
    }
}

export default {
    register,
    login,
    logout,
    check,
    getProfile,
    updateBio,
    getReviews
}
