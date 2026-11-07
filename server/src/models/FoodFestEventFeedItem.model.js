import mongoose from "mongoose";

const foodFestEventFeedItemSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodFestEvent',
        required: true
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    actorModel: {
        type: String,
        enum: ['User', 'FoodPartner', 'Admin'],
        required: true
    },
    verb: {
        type: String,
        required: true,
        trim: true
    },
    subjectType: {
        type: String,
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

foodFestEventFeedItemSchema.index({ eventId: 1, createdAt: -1 });

export default mongoose.model('FoodFestEventFeedItem', foodFestEventFeedItemSchema);
