import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/caresphere';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Delete all existing login accounts with role: 'doctor'
    const deletedUsers = await User.deleteMany({ role: 'doctor' });
    console.log(`Deleted ${deletedUsers.deletedCount} old 'doctor' login users.`);

    // 2. We now have 70 disconnected booking profiles.
    // We will pick the first 3 profiles and modify them to be our explicitly linked test accounts.
    const doctorsList = await Doctor.find().limit(3);
    
    if (doctorsList.length < 3) {
      console.log('Not enough doctor profiles to attach to. Please seed database first.');
      process.exit(1);
    }

    const testAccounts = [
      { name: 'Dr. Amit', email: 'dr.amit@caresphere.com' },
      { name: 'Dr. Neha', email: 'dr.neha@caresphere.com' },
      { name: 'Dr. Rahul', email: 'dr.rahul@caresphere.com' },
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (let i = 0; i < 3; i++) {
        const docProfile = doctorsList[i];
        const account = testAccounts[i];

        // Update the public booking profile name
        docProfile.name = account.name;
        // userId on Doctor is no longer strictly used/enforced so we just save it
        await docProfile.save();

        // Create the actual verified real login wrapper for this profile
        await User.create({
            name: account.name,
            email: account.email,
            passwordHash,
            age: 40,
            gender: 'prefer-not',
            emailVerified: true,
            role: 'doctor',
            isActive: true,
            doctorProfileId: docProfile._id // Crucial connection
        });
        
        console.log(`Created login account for ${account.name} attached to profile ${docProfile._id}`);
    }

    console.log('\nMigration complete!');
    console.log('- 70 dummy profiles remaining fully functional for PUBLIC booking.');
    console.log('- ONLY the 3 created emails can actually log in as doctors.');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
