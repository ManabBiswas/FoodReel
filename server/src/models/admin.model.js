import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    adminId: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tokenVersion: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export default mongoose.model('Admin', adminSchema);