import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import otpRoutes from './routes/otpRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';
import { startMedicineScheduler } from './services/medicineScheduler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '50kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/otp', otpRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/user/appointments', appointmentRoutes);
app.use('/api/medicines', authMiddleware, medicineRoutes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`[care-sphere-otp] listening on port ${port}`);
  startMedicineScheduler();
});

