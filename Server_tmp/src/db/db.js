import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGODB_URL;
    if (!uri) {
        throw new Error('MONGODB_URL is not set in environment variables. Please set it before starting the server.');
    }

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error; // rethrow so the process exits and the issue is visible
    }
}

export default connectDB