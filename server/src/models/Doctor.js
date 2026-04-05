import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true, min: 0 },
    availabilitySlots: [{ type: String }],
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    category: { type: String, required: true, default: 'General Physician' },
    city: { type: String, required: true, default: 'Ahmedabad' },
    qualification: { type: String, required: true, default: 'MBBS' },
    hospital: { type: String, required: true, default: 'CareSphere Hospital' },
    address: { type: String, required: true, default: 'CareSphere HQ' },
  },
  { timestamps: true }
);

export default mongoose.model('Doctor', DoctorSchema);
