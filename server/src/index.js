import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import otpRoutes from './routes/otpRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '50kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/otp', otpRoutes);
app.use('/api/auth', authRoutes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`[care-sphere-otp] listening on port ${port}`);
});

