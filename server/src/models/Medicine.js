import mongoose from 'mongoose';

const statusLogSchema = new mongoose.Schema({
  date: { type: String, required: true },     // "YYYY-MM-DD"
  time: { type: String, required: true },     // "HH:MM"
  status: { type: String, enum: ['taken', 'missed'], required: true },
}, { _id: false });

const medicineSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:         { type: String, required: true, trim: true },
  dosage:       { type: String, required: true, trim: true },    // e.g. "500mg", "1 tablet"
  times:        { type: [String], required: true },              // ["08:00", "14:00", "21:00"]

  // Reminder type: "daily" | "days" | "range"
  reminderType: { type: String, enum: ['daily', 'days', 'range'], default: 'daily' },
  days:         { type: [String], default: [] },                 // ["Mon","Wed","Fri"] — for type "days"
  startDate:    { type: String, default: null },                 // "YYYY-MM-DD"  — for type "range"
  endDate:      { type: String, default: null },                 // "YYYY-MM-DD"  — for type "range"

  notes:        { type: String, default: '' },
  isActive:     { type: Boolean, default: true },

  // Deduplication
  lastNotifiedAt: { type: Date, default: null },
  lastReminderSentAt: { type: String, default: null },
  statusLogs:   { type: [statusLogSchema], default: [] },
}, { timestamps: true });

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
