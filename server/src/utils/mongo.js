import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI');
}

let cached = global._careSphereMongo || null;

export async function connectMongo() {
  if (cached) return cached;

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(MONGODB_URI);
  cached = conn;
  global._careSphereMongo = cached;
  return conn;
}

