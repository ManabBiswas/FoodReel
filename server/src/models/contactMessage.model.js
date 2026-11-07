import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxLength: 120
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxLength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxLength: 5000
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied'],
        default: 'new'
    },
    repliedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

contactMessageSchema.index({ status: 1, createdAt: -1 });

const contactMessageModel = mongoose.model("ContactMessage", contactMessageSchema);

export default contactMessageModel;
