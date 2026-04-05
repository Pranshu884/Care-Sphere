import cron from 'node-cron';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import { connectMongo } from '../utils/mongo.js';
import { sendMedicineReminderEmail } from './medicineEmailService.js';

const IST = 'Asia/Kolkata';

function getISTDateStr(now) {
  return now.toLocaleDateString('en-CA', { timeZone: IST }); // "YYYY-MM-DD"
}

function getISTDayAbbr(now) {
  const day = now.toLocaleDateString('en-US', { weekday: 'short', timeZone: IST }); // "Mon"
  return day.slice(0, 3);
}

function isMedicineScheduledToday(med, todayIST, dayAbbr) {
  if (med.reminderType === 'range') {
    if (med.startDate && todayIST < med.startDate) return false;
    if (med.endDate   && todayIST > med.endDate)   return false;
  } else if (med.reminderType === 'days') {
    if (!(med.days || []).includes(dayAbbr)) return false;
  }
  return true;
}

async function runReminderJob() {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-IN', {
    timeZone: IST,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).slice(0, 5); // HH:mm

  console.log("Cron running...");
  console.log("Current time:", currentTime);

  try {
    await connectMongo();

    const todayDate = getISTDateStr(now);
    const todayDay  = getISTDayAbbr(now);

    // Fetch active medicines, populate userId
    const medicines = await Medicine.find({ isActive: true }).populate('userId');

    for (const medicine of medicines) {
      // Basic day/range check
      if (!isMedicineScheduledToday(medicine, todayDate, todayDay)) {
        continue;
      }

      // Loop through medicine.times array
      for (const scheduledTime of medicine.times) {
        // Match
        if (scheduledTime === currentTime) {
          console.log("Checking medicine:", medicine.name);
          console.log("Scheduled times:", medicine.times);

          // Duplicate Prevention: Check if already sent within last 1 minute
          if (medicine.lastNotifiedAt) {
            const timeDiff = now.getTime() - new Date(medicine.lastNotifiedAt).getTime();
            if (timeDiff < 60000) {
              console.log("Skipped duplicate");
              continue; // Skip processing this duplicate match
            }
          }

          const user = medicine.userId;
          if (!user || !user.email) {
             continue; // No valid user or email
          }

          try {
            await sendMedicineReminderEmail({
              toEmail: user.email,
              userName: user.name,
              medicineName: medicine.name,
              dosage: medicine.dosage,
              time: currentTime,
              instructions: medicine.notes || ''
            });

            console.log("Email sent to:", user.email);

            // Update state
            medicine.lastNotifiedAt = now;
            await medicine.save();
          } catch (emailErr) {
            console.error(`Error sending email for medicine ${medicine.name}:`, emailErr.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("Cron Job Error:", err.message);
  }
}

export function startMedicineScheduler() {
  // A SINGLE cron job running every minute
  cron.schedule('* * * * *', runReminderJob);
  console.log('[MedicineScheduler] ✅ Started — checking every minute.');
  
  // Run once immediately on startup
  runReminderJob();
}
