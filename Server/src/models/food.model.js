import mongoose from "mongoose";
const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    video: {
        type: String, // URL or file path for video
    },
    image: {
        type: String, // URL or file path for image
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        enum: ['video', 'image'],
        required: true
    },
    duration: {
        type: String, // For video duration like "1:20"
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner",
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    likeCount: {
        type: Number,
        default: 0
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    commentCount: {
        type: Number,
        default: 0
    },
    savesCount: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
})


const foodModel = mongoose.model("food", foodSchema);




export default foodModel;