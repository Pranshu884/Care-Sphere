import express from 'express';
import userService from '../services/userService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.patch('/profile', async (req, res) => {
  const result = await userService.updateProfile(req.auth.userId, req.body);
  return res.status(result.status).json(result.body);
});

router.patch('/health-summary', async (req, res) => {
  const result = await userService.updateHealthSummary(req.auth.userId, req.body);
  return res.status(result.status).json(result.body);
});

router.delete('/account', async (req, res) => {
  const result = await userService.deleteAccount(req.auth.userId);
  return res.status(result.status).json(result.body);
});

export default router;
