import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    phone: { type: String, default: '', trim: true },

    passwordHash: { type: String, required: true, select: false },

    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, required: true, enum: ['male', 'female', 'other', 'prefer-not'] },

    emailVerified: { type: Boolean, default: false },

    role: { type: String, enum: ['user', 'admin', 'doctor'], default: 'user' },
    doctorProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Emergency Quick Profile
    bloodGroup: { type: String, default: '' },
    allergies: { type: [String], default: [] },
    chronicDiseases: { type: [String], default: [] },
    majorSurgeries: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);

