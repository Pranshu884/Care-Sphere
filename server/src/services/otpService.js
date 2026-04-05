import crypto from 'crypto';
import db from '../utils/db.js';
import { sendOTPEmail } from './emailService.js';

const PURPOSES = new Set(['register', 'login', 'forgot']);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  // Simple email validation (enough for UI flow). Resend will also validate.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPurpose(purpose) {
  return typeof purpose === 'string' && PURPOSES.has(purpose);
}

function isValidOtp(otp) {
  return typeof otp === 'string' && /^[0-9]{6}$/.test(otp);
}

function nowMs() {
  return Date.now();
}

function generateOtp6() {
  // Numeric, cryptographically secure.
  const num = crypto.randomInt(0, 1000000); // 0..999999 inclusive
  return String(num).padStart(6, '0');
}

function otpHashHmac(otp) {
  const pepper = process.env.OTP_PEPPER;
  if (!pepper) {
    throw new Error('Missing OTP_PEPPER');
  }
  return crypto.createHmac('sha256', pepper).update(otp).digest('hex');
}

function getOtpConfig() {
  const expirySeconds = Number(process.env.OTP_EXPIRY_SECONDS || 300); // 5 minutes
  const cooldownSeconds = Number(process.env.OTP_COOLDOWN_SECONDS || 45); // 30-60 seconds
  const attemptsLeft = Number(process.env.OTP_MAX_ATTEMPTS || 5);
  if (!Number.isFinite(expirySeconds) || expirySeconds <= 0) throw new Error('Invalid OTP_EXPIRY_SECONDS');
  if (!Number.isFinite(cooldownSeconds) || cooldownSeconds < 0) throw new Error('Invalid OTP_COOLDOWN_SECONDS');
  if (!Number.isFinite(attemptsLeft) || attemptsLeft <= 0) throw new Error('Invalid OTP_MAX_ATTEMPTS');
  return { expirySeconds, cooldownSeconds, attemptsLeft };
}

function otpRowToChallenge(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    purpose: row.purpose,
    otpHash: row.otp_hash,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    attemptsLeft: row.attempts_left,
    cooldownUntil: row.cooldown_until
  };
}

async function sendOtpEmailIfConfigured({ email, otp, purpose }) {
  const expiresInMinutes = Math.ceil((getOtpConfig().expirySeconds || 300) / 60);
  await sendOTPEmail(email, otp, purpose, expiresInMinutes);
}

async function sendOtpInternal({ email, purpose, resend }) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }
  if (!isValidPurpose(purpose)) {
    return { status: 400, body: { success: false, code: 'invalid_purpose', message: 'Invalid purpose.' } };
  }

  const { expirySeconds, cooldownSeconds, attemptsLeft } = getOtpConfig();
  const tNow = nowMs();

  // Enforce cooldown based on the most recent unused challenge.
  const existing = otpRowToChallenge(
    db.getLatestActiveChallenge({ email: normalizedEmail, purpose })
  );

  if (existing && existing.usedAt === null && tNow < existing.cooldownUntil) {
    const remainingSec = Math.ceil((existing.cooldownUntil - tNow) / 1000);
    return {
      status: 429,
      body: {
        success: false,
        code: 'cooldown',
        message: `Please wait ${remainingSec}s before requesting another OTP.`,
        cooldownSeconds: remainingSec,
        expiresAt: existing.expiresAt,
        cooldownUntil: existing.cooldownUntil
      }
    };
  }

  // Generate + store OTP.
  const otp = generateOtp6();
  const otpHash = otpHashHmac(otp);

  const expiresAt = tNow + expirySeconds * 1000;
  const cooldownUntil = tNow + cooldownSeconds * 1000;

  // Invalidate older OTPs for the same email/purpose so only the latest code works.
  db.invalidateUnusedChallenges({ email: normalizedEmail, purpose, usedAt: tNow });
  db.insertOtpChallenge({
    email: normalizedEmail,
    purpose,
    otpHash,
    createdAt: tNow,
    expiresAt,
    attemptsLeft,
    cooldownUntil
  });

  // Send email after storing OTP (to avoid mismatched flows on send failures).
  try {
    await sendOtpEmailIfConfigured({ email: normalizedEmail, otp, purpose });
  } catch (err) {
    // If email sending fails, delete the OTP challenge so they can try again immediately without cooldown.
    db.invalidateUnusedChallenges({ email: normalizedEmail, purpose, usedAt: tNow });
    return {
      status: 500,
      body: {
        success: false,
        code: 'email_delivery_failed',
        message: 'Failed to send the OTP email. Ensure your Resend domain is verified. Details: ' + err.message
      }
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      code: 'otp_sent',
      message: 'OTP sent successfully.',
      expiresAt,
      cooldownSeconds: cooldownSeconds,
      cooldownUntil,
      purpose
    }
  };
}

async function verifyOtpInternal({ email, purpose, otp }) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }
  if (!isValidPurpose(purpose)) {
    return { status: 400, body: { success: false, code: 'invalid_purpose', message: 'Invalid purpose.' } };
  }
  if (!isValidOtp(otp)) {
    return { status: 400, body: { success: false, code: 'invalid_otp', message: 'OTP must be a 6-digit number.' } };
  }

  const challenge = otpRowToChallenge(db.getLatestChallengeByEmailAndPurpose({ email: normalizedEmail, purpose }));

  if (!challenge) {
    return { status: 404, body: { success: false, code: 'not_requested', message: 'OTP not requested. Request a new OTP.' } };
  }

  const tNow = nowMs();

  if (challenge.usedAt !== null) {
    return { status: 401, body: { success: false, code: 'used', message: 'OTP has already been used. Request a new OTP.' } };
  }

  if (tNow > challenge.expiresAt) {
    // Mark as used/invalid to avoid repeated checks.
    db.markUsed({ id: challenge.id, usedAt: tNow });
    return { status: 401, body: { success: false, code: 'expired', message: 'OTP expired. Request a new OTP.' } };
  }

  if (challenge.attemptsLeft <= 0) {
    db.markUsed({ id: challenge.id, usedAt: tNow });
    return { status: 401, body: { success: false, code: 'too_many_attempts', message: 'Too many incorrect attempts. Request a new OTP.' } };
  }

  const otpHash = otpHashHmac(otp);
  if (otpHash !== challenge.otpHash) {
    const updated = db.decrementAttempts({ id: challenge.id });
    return {
      status: 401,
      body: {
        success: false,
        code: 'incorrect_otp',
        message: 'Incorrect OTP. Please try again.',
        attemptsLeft: updated.attemptsLeft
      }
    };
  }

  db.markUsed({ id: challenge.id, usedAt: tNow });
  return {
    status: 200,
    body: {
      success: true,
      code: 'otp_verified',
      message: 'OTP verified successfully.',
      purpose
    }
  };
}

const otpService = {
  async sendOtp({ email, purpose, resend }) {
    return sendOtpInternal({ email, purpose, resend: Boolean(resend) });
  },
  async verifyOtp({ email, purpose, otp }) {
    return verifyOtpInternal({ email, purpose, otp });
  }
};

export default otpService;

