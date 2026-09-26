import mongoose from "mongoose";

const intEnv = (name, fallback) => {
    const n = parseInt(process.env[name], 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

const connectDB = async () => {
    const uri = process.env.MONGODB_URL;
    if (!uri) {
        throw new Error('MONGODB_URL is not set in environment variables. Please set it before starting the server.');
    }

    const isProduction = process.env.NODE_ENV === 'production';

    try {
        await mongoose.connect(uri, {
            // Without an explicit pool size Mongoose defaults to 100 sockets, which is far more than a single small service needs and can exhaust Atlas connection limits under load spikes.
           
            maxPoolSize: intEnv('MONGO_MAX_POOL_SIZE', 10),
            minPoolSize: intEnv('MONGO_MIN_POOL_SIZE', 2),

            // Fail fast instead of buffering commands for 30s when the database is unreachable — a buffering server looks alive but serves nothing.
            serverSelectionTimeoutMS: intEnv('MONGO_SERVER_SELECTION_TIMEOUT_MS', 10000),
            connectTimeoutMS: intEnv('MONGO_CONNECT_TIMEOUT_MS', 10000),
            socketTimeoutMS: intEnv('MONGO_SOCKET_TIMEOUT_MS', 45000),

            // Indexes are managed explicitly, not on every process boot. Production models already declare their indexes.
            autoIndex: !isProduction,

            // Atlas sits behind a replica set; without this, retryable writes fail with "not primary" during elections.
            retryWrites: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error; // rethrow so the process exits and the issue is visible
    }
}

export default connectDB