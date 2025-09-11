import mongoose from "mongoose";

const foodPartnerSchema = new mongoose.Schema({
    companyName: {
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
    mobile: {
        type: Number,
        required: true,
        length: 10
    },
    address: {
        type: String,
        required: true
    }
}, { timestamps: true 

})

export default mongoose.model('FoodPartner', foodPartnerSchema)