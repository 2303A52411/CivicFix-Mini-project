import mongoose from 'mongoose';
export const connectDB = (uri = process.env.MONGODB_URI) => mongoose.connect(uri);
