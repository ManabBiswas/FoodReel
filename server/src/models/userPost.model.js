import mongoose from 'mongoose';

const userPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['video', 'image'], required: true },
    image: { type: String },
    video: { type: String },
    duration: { type: String },
    postType: { type: String, enum: ['food', 'general'], default: 'food' },
    tags: [{ type: String }],
    // optional references to existing Food and FoodPartner records
    taggedFood: { type: mongoose.Schema.Types.ObjectId, ref: 'food' },
    taggedPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPartner' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    commentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('UserPost', userPostSchema);
