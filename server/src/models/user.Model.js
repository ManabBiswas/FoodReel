import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
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
    profileImage: {
        type: Buffer,
    },
    bio: {
        type: String,
        maxlength: 150,
        default: ''
    },
    mobile: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^\d{10}$/.test(v);
            },
            message: 'Mobile number must be 10 digits'
        }
    },
    dateOfBirth: {
        type: Date
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },
    preferences: {
        cuisine: [String], // e.g., ['Italian', 'Chinese', 'Indian']
        dietaryRestrictions: [String], // e.g., ['Vegetarian', 'Gluten-free']
        spiceLevel: {
            type: String,
            enum: ['mild', 'medium', 'hot', 'extra-hot'],
            default: 'medium'
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserPost"
        }
    ],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'followerModel'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'followingModel'
    }],
    followersCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    },
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserPost"
    }],
    savedFoods: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "food"
    }],
    reviewsGiven: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    reviewsCount: {
        type: Number,
        default: 0
    },
    followerModel: {
        type: String,
        enum: ['User', 'FoodPartner'],
        default: 'User'
    },
    followingModel: {
        type: String,
        enum: ['User', 'FoodPartner'],
        default: 'User'
    },
    orderHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }],
    // Saved delivery addresses (used by ProfileSettings + QuickOrderModal)
    deliveryAddresses: [{
        label: { type: String, default: 'Home' },
        fullName: { type: String, default: '' },
        phone: { type: String, default: '' },
        addressLine1: { type: String, default: '' },
        addressLine2: { type: String, default: '' },
        landmark: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        country: { type: String, default: 'India' },
        isDefault: { type: Boolean, default: false }
    }]
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ mobile: 1 });

export default mongoose.model("User", userSchema);