import mongoose from "mongoose";

const foodPartnerSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true // Allow null/undefined but ensure uniqueness when set
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        maxLength: 300,
        default: ""
    },
    profileImage: {
        type: Buffer,
    },
    mobile: {
        type: Number,
        required: true,
        length: 10
    },
    address: {
        type: String,
        required: true
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodPartner'
    }],
    followersCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    },
    foodItemsCount: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

export default mongoose.model('FoodPartner', foodPartnerSchema)