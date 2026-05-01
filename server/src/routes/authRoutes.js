import express from 'express';
import authService from '../services/authService.js';
import ipRateLimit from '../utils/ipRateLimit.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

function checkIp(req, res) {
  const allowed = ipRateLimit.allow(req.ip);
  if (allowed.allowed) return null;
  return res.status(429).json({
    success: false,
    code: 'ip_rate_limited',
    message: `Too many requests. Try again in ${allowed.retryAfterSeconds}s.`,
    retryAfterSeconds: allowed.retryAfterSeconds,
  });
}

router.post('/register', async (req, res) => {
  const ipResult = checkIp(req, res);
  if (ipResult) return ipResult;
  const result = await authService.registerUserAndSendOtp(req.body || {});
  return res.status(result.status).json(result.body);
});

router.post('/login', async (req, res) => {
  const ipResult = checkIp(req, res);
  if (ipResult) return ipResult;
  const { email } = req.body || {};
  const result = await authService.requestLoginOtp({ email });
  return res.status(result.status).json(result.body);
});

router.post('/verify-email-otp', async (req, res) => {
  const result = await authService.verifyEmailOtpAndActivate(req.body || {});
  return res.status(result.status).json(result.body);
});

router.post('/verify-login-otp', async (req, res) => {
  const result = await authService.verifyLoginOtpAndIssueToken(req.body || {});
  return res.status(result.status).json(result.body);
});

router.post('/resend-otp', async (req, res) => {
  const ipResult = checkIp(req, res);
  if (ipResult) return ipResult;
  const { email, purpose } = req.body || {};
  const result = await authService.resendOtp({ email, purpose });
  return res.status(result.status).json(result.body);
});

router.post('/logout', async (req, res) => {
  const result = await authService.logout();
  return res.status(result.status).json(result.body);
});

router.get('/me', authMiddleware, async (req, res) => {
  const result = await authService.getMe({ userId: req.auth?.userId });
  return res.status(result.status).json(result.body);
});

router.patch('/me', authMiddleware, async (req, res) => {
  const result = await authService.updateMe({ userId: req.auth?.userId, ...(req.body || {}) });
  return res.status(result.status).json(result.body);
});

router.post('/forgot-password', async (req, res) => {
  const ipResult = checkIp(req, res);
  if (ipResult) return ipResult;
  const result = await authService.forgotPassword(req.body || {});
  return res.status(result.status).json(result.body);
});

router.post('/reset-password', async (req, res) => {
  const ipResult = checkIp(req, res);
  if (ipResult) return ipResult;
  const result = await authService.resetPassword(req.body || {});
  return res.status(result.status).json(result.body);
});

router.patch('/change-password', authMiddleware, async (req, res) => {
  const result = await authService.changePassword({ userId: req.auth?.userId, ...(req.body || {}) });
  return res.status(result.status).json(result.body);
});

router.post('/verify-password', authMiddleware, async (req, res) => {
  const result = await authService.verifyCurrentPassword({ userId: req.auth?.userId, currentPassword: req.body?.currentPassword });
  return res.status(result.status).json(result.body);
});

export default router;

