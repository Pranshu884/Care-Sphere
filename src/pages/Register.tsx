import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, ShieldCheck } from 'lucide-react';
import {
  requestRegisterOtp,
  resendOtp,
  setSessionUser,
  setToken,
  verifyRegisterEmailOtp,
  getMe,
  logoutUser
} from '../lib/auth';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other' | 'prefer-not',
    password: '',
    confirmPassword: '',
  });
  const [otpStage, setOtpStage] = useState<'request' | 'verify'>('request');
  const [otpInput, setOtpInput] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number | null>(null);
  const [requestOtpLoading, setRequestOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const cooldownIntervalRef = useRef<number | null>(null);

  const canVerify = useMemo(() => otpInput.trim().length >= 4 && otpInput.trim().length <= 6, [otpInput]);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) window.clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('caresphere_token');
    if (token) {
      getMe().then(res => {
        if (res.ok) {
          const role = localStorage.getItem('role') || 'user';
          if (role === 'admin') navigate('/admin/dashboard');
          else if (role === 'doctor') navigate('/doctor/dashboard');
          else navigate('/dashboard');
        } else {
          logoutUser();
        }
      });
    }
  }, [navigate]);

  const startCooldown = (seconds: number) => {
    if (cooldownIntervalRef.current) window.clearInterval(cooldownIntervalRef.current);
    setResendDisabled(true);
    setCooldownSecondsLeft(seconds);

    cooldownIntervalRef.current = window.setInterval(() => {
      setCooldownSecondsLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          if (cooldownIntervalRef.current) window.clearInterval(cooldownIntervalRef.current);
          setResendDisabled(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearCooldown = () => {
    if (cooldownIntervalRef.current) window.clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = null;
    setResendDisabled(false);
    setCooldownSecondsLeft(null);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setRequestOtpLoading(true);

    try {
      if (!form.name.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (!form.email.trim()) {
        setError('Please enter your email.');
        return;
      }

      if (!form.age.trim()) {
        setError('Please enter your age.');
        return;
      }
      const ageNum = Number(form.age);
      if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
        setError('Age must be between 1 and 120.');
        return;
      }

      if (!form.password) {
        setError('Please enter a password.');
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const result = await requestRegisterOtp({
        name: form.name,
        email: form.email,
        age: ageNum,
        gender: form.gender,
        password: form.password,
      });
      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setExpiresAt(result.expiresAt);
      setOtpStage('verify');
      setOtpInput('');
      setInfo('OTP sent to your email. Please verify to create your account.');
      startCooldown(result.cooldownSeconds);
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setRequestOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setVerifyLoading(true);

    try {
      if (otpInput.trim().length < 4) {
        setError('Please enter a valid OTP.');
        return;
      }

      const result = await verifyRegisterEmailOtp({ email: form.email, otp: otpInput.trim() });
      if (!result.ok) {
        setError(result.reason || 'Invalid OTP.');
        return;
      }

      setToken(result.token);
      setSessionUser(result.user);
      navigate('/dashboard');
    } catch {
      setError('OTP verification failed. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-background overflow-hidden relative z-0">
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22640%22 viewBox=%220 0 640 640%22%3E%3Cg fill=%22none%22 stroke=%22%2300D4FF%22 stroke-opacity=%220.05%22 stroke-width=%222%22%3E%3Cpath d=%22M0 320h640%22/%3E%3Cpath d=%22M320 0v640%22/%3E%3Ccircle cx=%22320%22 cy=%22320%22 r=%22100%22/%3E%3C/g%3E%3C/svg%3E')] bg-cover opacity-60 pointer-events-none -z-10"
      />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold transition-transform hover:scale-105">
            <Activity className="w-8 h-8" />
            <span className="text-xl tracking-tight">CareSphere</span>
          </Link>
        </div>

        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-primary drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Create an account</h1>
          </div>
          <p className="mt-2 text-muted">Register securely using your email address.</p>

          {otpStage === 'request' ? (
            <form onSubmit={handleRequestOtp} className="mt-8 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/70" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="premium-input pl-11"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted mb-1.5">Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="premium-input"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-muted mb-1.5">Age</label>
                  <input
                    id="age"
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="premium-input"
                    placeholder="Age"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-muted mb-1.5">Gender</label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as typeof form.gender })}
                    className="premium-input [&>option]:text-slate-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-muted mb-1.5">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="premium-input"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted mb-1.5">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="premium-input"
                  placeholder="Match password"
                />
              </div>

              <button
                type="submit"
                className="glow-button w-full py-3.5 mt-2 flex justify-center items-center"
                disabled={requestOtpLoading}
              >
                {requestOtpLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              {info && <div className="text-sm text-primary text-center">{info}</div>}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {info && (
                <div className="p-3 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-primary text-sm">
                  {info}
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm text-muted">
                  Enter the OTP sent to <span className="font-medium text-white">{form.email}</span>
                </div>

                {expiresAt && (
                  <div className="text-xs text-muted/60">OTP is valid for 5 minutes</div>
                )}
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-muted mb-1.5">Verification Code</label>
                <input
                  id="otp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="premium-input font-mono tracking-widest text-center text-xl py-3"
                  placeholder="123456"
                />
              </div>

              <button
                type="submit"
                disabled={!canVerify || verifyLoading}
                className="glow-button w-full py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyLoading ? 'Verifying...' : 'Verify OTP & Create account'}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStage('request');
                    setOtpInput('');
                    setExpiresAt(null);
                    clearCooldown();
                  }}
                  className="text-sm text-muted hover:text-white transition-colors"
                >
                  Change email
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setInfo('');
                    try {
                      setRequestOtpLoading(true);
                      const result = await resendOtp({ email: form.email, purpose: 'register' });
                      if (!result.ok) {
                        setError(result.reason);
                        return;
                      }

                      setExpiresAt(result.expiresAt);
                      setOtpInput('');
                      setInfo('New OTP sent. Please verify.');
                      startCooldown(result.cooldownSeconds);
                    } catch {
                      setError('Failed to resend OTP.');
                    } finally {
                      setRequestOtpLoading(false);
                    }
                  }}
                  disabled={resendDisabled || requestOtpLoading}
                  className="text-sm text-primary hover:text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendDisabled && cooldownSecondsLeft !== null ? `Resend in ${cooldownSecondsLeft}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-muted text-sm border-t border-white/10 pt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:text-white transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
