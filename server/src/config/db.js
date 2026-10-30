import mongoose from 'mongoose';
import { ensureMongoRunning } from '../../scripts/startMongo.js';

export const connectDB = async (uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix') => {
  if (uri.includes('127.0.0.1:27017') || uri.includes('localhost:27017')) {
    try {
      await ensureMongoRunning();
    } catch (err) {
      console.warn('[MongoDB] Auto-start check warning:', err.message);
    }
  }
  return mongoose.connect(uri);
};
