import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, ShieldCheck } from 'lucide-react';
import {
  requestLoginOtp,
  resendOtp,
  setSessionUser,
  setToken,
  verifyLoginOtp,
} from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '' });
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
      if (cooldownIntervalRef.current) {
        window.clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

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
      if (!form.email.trim()) {
        setError('Please enter your email.');
        return;
      }

      const result = await requestLoginOtp({ email: form.email });
      if (!result.ok) {
        setError(result.reason);
        return;
      }

      setExpiresAt(result.expiresAt);
      setOtpStage('verify');
      setOtpInput('');
      setInfo('OTP sent to your email.');
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

      const result = await verifyLoginOtp({ email: form.email, otp: otpInput.trim() });
      if (!result.ok) {
        setError(result.reason || 'Invalid OTP.');
        return;
      }

      localStorage.removeItem('caresphere_token');
      localStorage.removeItem('caresphere_user');
      localStorage.removeItem('role');

      setToken(result.token);
      setSessionUser(result.user);
      
      const role = result.role;
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", role);
      
      console.log("Frontend Role:", role);

      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/dashboard');
      }
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Sign in securely</h1>
          </div>
          <p className="mt-2 text-muted">
            Enter your email to receive a secure one-time password.
          </p>

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

              <button
                type="submit"
                className="glow-button w-full py-3.5 mt-2"
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
                {verifyLoading ? 'Verifying...' : 'Verify OTP & Sign in'}
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
                      const result = await resendOtp({ email: form.email, purpose: 'login' });
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
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:text-white transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
