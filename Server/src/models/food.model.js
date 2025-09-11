import mongoose from "mongoose";
const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    video: {
        type: Buffer, // Changed to Buffer to store file data
        required: true,
    },
    description: {
        type: String,
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner" // Fixed reference name
    },
    likeCount: {
        type: Number,
        default: 0
    },
    savesCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true })


const foodModel = mongoose.model("food", foodSchema);




export default foodModel;