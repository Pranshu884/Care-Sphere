export type CareUser = {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer-not';
  emailVerified: boolean;
  role?: 'user' | 'admin' | 'doctor';
  isBlocked?: boolean;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type OtpPurpose = 'register' | 'login' | 'forgot';

const TOKEN_KEY = 'caresphere_token';
const SESSION_KEY = 'caresphere_user';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function normalizeApiBase(url: string) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getHeaders(withAuth: boolean) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function postJson(path: string, body: unknown, withAuth = false) {
  const base = normalizeApiBase(API_BASE_URL);
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: getHeaders(withAuth),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function getJson(path: string, withAuth = false) {
  const base = normalizeApiBase(API_BASE_URL);
  const res = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: getHeaders(withAuth),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getSessionUser(): CareUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CareUser;
  } catch {
    return null;
  }
}

export function setSessionUser(user: CareUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSessionUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function logoutUser() {
  clearToken();
  clearSessionUser();
  localStorage.removeItem('role');
  localStorage.removeItem('token');
  sessionStorage.clear();
  window.location.href = '/login';
}

export async function requestRegisterOtp(payload: {
  name: string;
  email: string;
  age: number;
  gender: CareUser['gender'];
  password: string;
}) {
  const result = await postJson('/api/auth/register', {
    name: payload.name,
    email: normalizeEmail(payload.email),
    age: payload.age,
    gender: payload.gender,
    password: payload.password,
  });
  if (result.ok && result.data?.success) {
    return {
      ok: true as const,
      expiresAt: Number(result.data.expiresAt),
      cooldownSeconds: Number(result.data.cooldownSeconds),
    };
  }
  return {
    ok: false as const,
    code: String(result.data?.code || 'register_failed'),
    reason: String(result.data?.message || 'Failed to register.'),
  };
}

export async function verifyRegisterEmailOtp(payload: { email: string; otp: string }) {
  const result = await postJson('/api/auth/verify-email-otp', {
    email: normalizeEmail(payload.email),
    otp: payload.otp,
  });
  if (result.ok && result.data?.success && result.data?.token) {
    return {
      ok: true as const,
      token: String(result.data.token),
      user: result.data.user as CareUser,
    };
  }
  return {
    ok: false as const,
    code: String(result.data?.code || 'verify_failed'),
    reason: String(result.data?.message || 'Invalid OTP.'),
  };
}

export async function requestLoginOtp(payload: { email: string }) {
  const result = await postJson('/api/auth/login', {
    email: normalizeEmail(payload.email),
  });
  if (result.ok && result.data?.success) {
    return {
      ok: true as const,
      expiresAt: Number(result.data.expiresAt),
      cooldownSeconds: Number(result.data.cooldownSeconds),
    };
  }
  return {
    ok: false as const,
    code: String(result.data?.code || 'login_otp_failed'),
    reason: String(result.data?.message || 'Failed to send OTP.'),
  };
}

export async function verifyLoginOtp(payload: { email: string; otp: string }) {
  const result = await postJson('/api/auth/verify-login-otp', {
    email: normalizeEmail(payload.email),
    otp: payload.otp,
  });
  if (result.ok && result.data?.success && result.data?.token) {
    return {
      ok: true as const,
      token: String(result.data.token),
      role: String(result.data.role || result.data.user?.role || 'patient').toLowerCase(),
      user: result.data.user as CareUser,
    };
  }
  return {
    ok: false as const,
    code: String(result.data?.code || 'login_verify_failed'),
    reason: String(result.data?.message || 'Invalid OTP.'),
  };
}

export async function resendOtp(payload: { email: string; purpose: OtpPurpose }) {
  const result = await postJson('/api/auth/resend-otp', {
    email: normalizeEmail(payload.email),
    purpose: payload.purpose,
  });
  if (result.ok && result.data?.success) {
    return {
      ok: true as const,
      expiresAt: Number(result.data.expiresAt),
      cooldownSeconds: Number(result.data.cooldownSeconds),
    };
  }
  return {
    ok: false as const,
    code: String(result.data?.code || 'otp_resend_failed'),
    reason: String(result.data?.message || 'Failed to resend OTP.'),
  };
}

export async function getMe() {
  const result = await getJson('/api/auth/me', true);
  if (result.ok && result.data?.success) {
    return { ok: true as const, user: result.data.user as CareUser };
  }
  return { ok: false as const, code: String(result.data?.code || 'me_failed'), reason: String(result.data?.message || 'Unauthorized') };
}

export async function updateMe(payload: { name: string; email: string }) {
  const base = normalizeApiBase(API_BASE_URL);
  const token = getToken();
  if (!token) return { ok: false as const, code: 'no_token', reason: 'Not authenticated.' };
  const res = await fetch(`${base}/api/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.success) {
    return { ok: true as const, user: data.user as CareUser };
  }
  return { ok: false as const, code: String(data?.code || 'update_failed'), reason: String(data?.message || 'Failed to update profile.') };
}

