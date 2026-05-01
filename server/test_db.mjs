import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/Pranshu Bhavsar/care-sphere/server/.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    const reports = await db.collection('reports').find().sort({createdAt: -1}).limit(2).toArray();
    console.log(JSON.stringify(reports, null, 2));
    process.exit(0);
});
