import bcrypt from 'bcrypt';
import User from '../models/User.js';
import otpService from './otpService.js';
import { connectMongo } from '../utils/mongo.js';
import { signToken } from '../utils/jwt.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidGender(gender) {
  return ['male', 'female', 'other', 'prefer-not'].includes(gender);
}

function getSaltRounds() {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  return Number.isFinite(rounds) ? rounds : 12;
}

function toPublicUser(u) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    age: u.age,
    gender: u.gender,
    emailVerified: u.emailVerified,
    role: u.role || 'user',
    doctorProfileId: u.doctorProfileId || undefined,
    isBlocked: u.isBlocked || false,
    isActive: u.isActive !== false,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    // Emergency Profile
    bloodGroup: u.bloodGroup || '',
    allergies: u.allergies || [],
    chronicDiseases: u.chronicDiseases || [],
    majorSurgeries: u.majorSurgeries || [],
    currentMedications: u.currentMedications || [],
    emergencyContact: u.emergencyContact || { name: '', phone: '' }
  };
}

async function registerUserAndSendOtp({ name, email, phone, age, gender, password }) {
  await connectMongo();

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }
  if (!password || String(password).length < 6) {
    return { status: 400, body: { success: false, code: 'invalid_password', message: 'Password must be at least 6 characters.' } };
  }
  if (!name || String(name).trim().length < 1) {
    return { status: 400, body: { success: false, code: 'invalid_name', message: 'Name is required.' } };
  }
  const normalizedAge = Number(age);
  if (!Number.isFinite(normalizedAge) || normalizedAge < 1 || normalizedAge > 120) {
    return { status: 400, body: { success: false, code: 'invalid_age', message: 'Age must be between 1 and 120.' } };
  }
  if (!isValidGender(gender)) {
    return { status: 400, body: { success: false, code: 'invalid_gender', message: 'Invalid gender.' } };
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    if (existing.emailVerified) {
      return { status: 409, body: { success: false, code: 'email_already_exists', message: 'An account with this email already exists.' } };
    }
    
    // User exists but is unverified. Update details and allow re-registration.
    existing.name = String(name).trim();
    if (phone) existing.phone = String(phone);
    existing.passwordHash = await bcrypt.hash(String(password), getSaltRounds());
    existing.age = normalizedAge;
    existing.gender = gender;
    await existing.save();

    const otpResult = await otpService.sendOtp({ email: normalizedEmail, purpose: 'register', resend: false });
    if (otpResult.status !== 200) {
      return otpResult;
    }

    return {
      status: 200,
      body: {
        success: true,
        code: 'registration_created',
        message: 'Account updated. Verification OTP sent to your email.',
        expiresAt: otpResult.body.expiresAt,
        cooldownSeconds: otpResult.body.cooldownSeconds,
      },
    };
  }

  const passwordHash = await bcrypt.hash(String(password), getSaltRounds());

  // Create user as not verified until OTP is confirmed.
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    phone: String(phone || ''),
    passwordHash,
    age: normalizedAge,
    gender,
    emailVerified: false,
  });

  const otpResult = await otpService.sendOtp({ email: normalizedEmail, purpose: 'register', resend: false });
  if (otpResult.status !== 200) {
    // Roll back registration if OTP couldn't be sent.
    await User.deleteOne({ _id: user._id });
    return otpResult;
  }

  return {
    status: 200,
    body: {
      success: true,
      code: 'registration_created',
      message: 'Account created. Verification OTP sent to your email.',
      expiresAt: otpResult.body.expiresAt,
      cooldownSeconds: otpResult.body.cooldownSeconds,
    },
  };
}

async function verifyEmailOtpAndActivate({ email, otp }) {
  await connectMongo();

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }
  const otpResult = await otpService.verifyOtp({ email: normalizedEmail, purpose: 'register', otp });
  if (otpResult.status !== 200) {
    return { status: otpResult.status, body: otpResult.body };
  }

  const user = await User.findOne({ email: normalizedEmail, emailVerified: false });
  if (!user) {
    return { status: 404, body: { success: false, code: 'account_not_pending', message: 'Account is not awaiting verification (or not found).' } };
  }

  user.emailVerified = true;
  await user.save();

  const token = signToken(user);
  return {
    status: 200,
    body: {
      success: true,
      code: 'email_verified',
      message: 'Email verified successfully.',
      token,
      user: toPublicUser(user),
    },
  };
}

async function requestLoginOtp({ email }) {
  await connectMongo();

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (!existing) {
    return { status: 404, body: { success: false, code: 'account_not_found', message: 'No account found for this email.' } };
  }
  if (!existing.emailVerified) {
    return { status: 403, body: { success: false, code: 'email_not_verified', message: 'Please verify your email via the registration page first.' } };
  }

  const otpResult = await otpService.sendOtp({ email: normalizedEmail, purpose: 'login', resend: false });
  return otpResult.status === 200
    ? { status: 200, body: { ...otpResult.body, code: 'otp_sent', message: 'OTP sent to your email.' } }
    : { status: otpResult.status, body: otpResult.body };
}

async function verifyLoginOtpAndIssueToken({ email, otp }) {
  await connectMongo();

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }

  const otpResult = await otpService.verifyOtp({ email: normalizedEmail, purpose: 'login', otp });
  if (otpResult.status !== 200) {
    return { status: otpResult.status, body: otpResult.body };
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return { status: 404, body: { success: false, code: 'account_not_found', message: 'No account found for this email.' } };
  }
  if (!user.emailVerified) {
    return { status: 403, body: { success: false, code: 'email_not_verified', message: 'Please verify your email before logging in.' } };
  }
  if (user.isBlocked) {
    return { status: 403, body: { success: false, code: 'account_blocked', message: 'Your account has been blocked by an administrator.' } };
  }

  console.log("LOGIN ROLE:", user.role);

  const token = signToken(user);
  return {
    status: 200,
    body: {
      success: true,
      code: 'login_success',
      message: 'Logged in successfully.',
      token,
      role: user.role,
      user: toPublicUser(user),
    },
  };
}

async function resendOtp({ email, purpose }) {
  await connectMongo();
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }
  const otpResult = await otpService.sendOtp({ email: normalizedEmail, purpose, resend: true });
  return otpResult;
}

async function getMe({ userId }) {
  await connectMongo();
  const user = await User.findById(userId).lean();
  if (!user) {
    return { status: 404, body: { success: false, code: 'not_found', message: 'User not found.' } };
  }
  return { status: 200, body: { success: true, user: toPublicUser(user) } };
}

async function updateMe({ userId, name, email, phone }) {
  await connectMongo();
  const user = await User.findById(userId);
  if (!user) {
    return { status: 404, body: { success: false, code: 'not_found', message: 'User not found.' } };
  }

  if (typeof name === 'string' && name.trim().length > 0) user.name = name.trim();

  if (typeof email === 'string') {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
    }
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail }).lean();
      if (existing) {
        return { status: 409, body: { success: false, code: 'email_already_exists', message: 'Email is already used by another account.' } };
      }
      user.email = normalizedEmail;
      // If email changes, require re-verification.
      user.emailVerified = false;
    }
  }

  if (typeof phone === 'string') user.phone = String(phone);

  // Emergency Profile Updates
  const { bloodGroup, allergies, chronicDiseases, majorSurgeries, currentMedications, emergencyContact } = arguments[0];
  if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
  if (Array.isArray(allergies)) user.allergies = allergies;
  if (Array.isArray(chronicDiseases)) user.chronicDiseases = chronicDiseases;
  if (Array.isArray(majorSurgeries)) user.majorSurgeries = majorSurgeries;
  if (Array.isArray(currentMedications)) user.currentMedications = currentMedications;
  if (emergencyContact && typeof emergencyContact === 'object') {
     user.emergencyContact = {
        name: emergencyContact.name || user.emergencyContact?.name || '',
        phone: emergencyContact.phone || user.emergencyContact?.phone || ''
     };
  }

  await user.save();

  return { status: 200, body: { success: true, user: toPublicUser(user) } };
}

async function logout() {
  // JWT is stateless; client clears token.
  return { status: 200, body: { success: true, message: 'Logged out.' } };
}

async function forgotPassword({ email }) {
  await connectMongo();
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }

  const otpResult = await otpService.sendOtp({ email: normalizedEmail, purpose: 'forgot', resend: false });
  // Always respond OTP sent, even if user doesn't exist, to avoid enumeration.
  return otpResult;
}

async function resetPassword({ email, otp, newPassword }) {
  await connectMongo();
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { status: 400, body: { success: false, code: 'invalid_email', message: 'Invalid email.' } };
  }
  if (!newPassword || String(newPassword).length < 6) {
    return { status: 400, body: { success: false, code: 'invalid_password', message: 'New password must be at least 6 characters.' } };
  }

  const otpResult = await otpService.verifyOtp({ email: normalizedEmail, purpose: 'forgot', otp });
  if (otpResult.status !== 200) {
    return { status: otpResult.status, body: otpResult.body };
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return { status: 404, body: { success: false, code: 'account_not_found', message: 'No account found for this email.' } };
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), getSaltRounds());
  await user.save();

  return { status: 200, body: { success: true, code: 'password_reset', message: 'Password reset successful.' } };
}

const authService = {
  registerUserAndSendOtp,
  verifyEmailOtpAndActivate,
  requestLoginOtp,
  verifyLoginOtpAndIssueToken,
  resendOtp,
  getMe,
  updateMe,
  logout,
  forgotPassword,
  resetPassword,
};

export default authService;

