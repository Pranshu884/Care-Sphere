import express from 'express';
import otpService from '../services/otpService.js';
import ipRateLimit from '../utils/ipRateLimit.js';

const router = express.Router();

router.post('/send', async (req, res) => {
  try {
    const ip = req.ip;
    const allowed = ipRateLimit.allow(ip);
    if (!allowed.allowed) {
      return res.status(429).json({
        success: false,
        code: 'ip_rate_limited',
        message: `Too many OTP requests. Try again in ${allowed.retryAfterSeconds}s.`,
        retryAfterSeconds: allowed.retryAfterSeconds
      });
    }
    const { email, purpose } = req.body || {};
    const result = await otpService.sendOtp({ email, purpose, resend: false });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ success: false, code: 'server_error', message: 'Unexpected server error.' });
  }
});

router.post('/resend', async (req, res) => {
  try {
    const ip = req.ip;
    const allowed = ipRateLimit.allow(ip);
    if (!allowed.allowed) {
      return res.status(429).json({
        success: false,
        code: 'ip_rate_limited',
        message: `Too many OTP requests. Try again in ${allowed.retryAfterSeconds}s.`,
        retryAfterSeconds: allowed.retryAfterSeconds
      });
    }
    const { email, purpose } = req.body || {};
    const result = await otpService.sendOtp({ email, purpose, resend: true });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ success: false, code: 'server_error', message: 'Unexpected server error.' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { email, purpose, otp } = req.body || {};
    const result = await otpService.verifyOtp({ email, purpose, otp });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ success: false, code: 'server_error', message: 'Unexpected server error.' });
  }
});

export default router;

