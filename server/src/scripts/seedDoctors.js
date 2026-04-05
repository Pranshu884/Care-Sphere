import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/caresphere';

const categories = [
  'General Physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatrician',
  'Neurologist',
  'Gastroenterologist',
  'Orthopedic'
];

const cities = [
  'Ahmedabad',
  'Surat',
  'Rajkot',
  'Vadodara',
  'Nadiad'
];

const qualifications = ['MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'MBBS, Diploma'];
const hospitals = ['Care Hospital', 'Lifeline Clinic', 'City Medical Center', 'Apex Hospital', 'Nova Care'];
const availabilitySlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Aadhya', 'Diya', 'Kashvi', 'Saanvi', 'Myra', 'Ira', 'Navya', 'Kiara', 'Ananya', 'Riya'];
const lastNames = ['Patel', 'Shah', 'Desai', 'Mehta', 'Joshi', 'Bhatt', 'Rajput', 'Raval', 'Chauhan', 'Thakor'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing doctors
    const deletedDoctors = await Doctor.deleteMany({});
    console.log(`Cleared ${deletedDoctors.deletedCount} existing doctors.`);

    // Clear existing users with doctor role
    const deletedUsers = await User.deleteMany({ role: 'doctor' });
    console.log(`Cleared ${deletedUsers.deletedCount} existing doctor users.`);

    const passwordHash = await bcrypt.hash('password123', 10);
    let count = 0;

    for (const category of categories) {
      for (let i = 0; i < 10; i++) {
        const city = cities[i % cities.length]; // 2 per city per category exactly
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        const fullName = `Dr. ${firstName} ${lastName}`;
        const email = `doctor${count + 1}@caresphere.com`;

        const user = await User.create({
          name: fullName,
          email,
          passwordHash,
          age: Math.floor(Math.random() * 30) + 30, // 30-59
          gender: Math.random() > 0.5 ? 'male' : 'female',
          emailVerified: true,
          role: 'doctor',
          isActive: true
        });

        await Doctor.create({
          userId: user._id,
          name: fullName,
          specialization: category, // Fallback for existing fields
          category,
          city,
          qualification: getRandomItem(qualifications),
          hospital: `${getRandomItem(hospitals)} ${city}`,
          address: `123 Health Ave, ${city}`,
          experience: Math.floor(Math.random() * 20) + 5, // 5-24
          availabilitySlots,
          approvalStatus: 'approved'
        });

        count++;
      }
    }

    console.log(`Successfully seeded ${count} doctors.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
