import { useState, useCallback, useRef } from 'react';
import { X, Eye, EyeOff, Check, Loader2, ShieldCheck } from 'lucide-react';
import { changePassword, verifyCurrentPassword } from '../../lib/auth';

/* ─── Types ─────────────────────────────────────────────────── */
type Validity = 'idle' | 'pending' | 'valid' | 'error';

interface StrengthResult {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
  barColor: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function getStrength(pwd: string): StrengthResult {
  if (!pwd) return { score: 0, label: '', color: '', barColor: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map: Record<number, StrengthResult> = {
    0: { score: 0, label: 'Weak', color: 'text-[#f85149]', barColor: 'bg-[#f85149]' },
    1: { score: 1, label: 'Fair', color: 'text-orange-400', barColor: 'bg-orange-400' },
    2: { score: 2, label: 'Strong', color: 'text-yellow-400', barColor: 'bg-yellow-400' },
    3: { score: 3, label: 'Very Strong', color: 'text-[#58d9b0]', barColor: 'bg-[#58d9b0]' },
  };
  return map[score] as StrengthResult;
}

function getNewPwdError(newPwd: string, currentPwd: string): string {
  if (!newPwd) return '';
  if (newPwd === currentPwd && currentPwd) return 'New password must be different from your current password.';
  if (newPwd.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(newPwd)) return 'Must include at least one uppercase letter.';
  if (!/[0-9]/.test(newPwd)) return 'Must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(newPwd)) return 'Must include at least one special character.';
  return '';
}

function hasAnyInput(curr: string, newP: string, conf: string) {
  return curr.length > 0 || newP.length > 0 || conf.length > 0;
}

/* ─── Sub-components ─────────────────────────────────────────── */
interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onToggleShow: () => void;
  onChange: (v: string) => void;
  onBlur?: () => void;
  validity?: Validity;
  errorMsg?: string;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}

function PasswordField({
  id, label, value, show, onToggleShow, onChange, onBlur,
  validity = 'idle', errorMsg, disabled, rightSlot
}: PasswordFieldProps) {
  const borderClass =
    validity === 'valid' ? 'border-[#58d9b0] bg-[rgba(88,217,176,0.06)]' :
    validity === 'error' ? 'border-[#f85149] bg-[rgba(248,81,73,0.06)]' :
    'border-[#1e2130] bg-[#0f1117]';

  return (
    <div>
      <label htmlFor={id} className="block text-[11px] text-[#8b92a5] mb-1.5 font-medium uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete="new-password"
          className={`w-full px-3 py-2.5 rounded-[8px] border text-[13px] text-white/90 placeholder-[#8b92a5] 
            outline-none focus:border-[#58d9b0]/70 transition-all duration-200 pr-20 disabled:opacity-50
            ${borderClass}`}
          style={{ WebkitTextFillColor: 'inherit' }}
        />
        {/* Right icons: spinner / check / eye */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {validity === 'pending' && <Loader2 className="w-3.5 h-3.5 text-[#8b92a5] animate-spin" />}
          {validity === 'valid' && <Check className="w-3.5 h-3.5 text-[#58d9b0]" />}
          {rightSlot}
          <button
            type="button"
            tabIndex={-1}
            onClick={onToggleShow}
            className="text-[#8b92a5] hover:text-white transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {errorMsg && (
        <p className="mt-1 text-[11px] text-[#f85149] animate-in fade-in slide-in-from-top-1 duration-150">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────── */
interface Props {
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ChangePasswordModal({ onClose, showToast }: Props) {
  // Field values — kept in refs for security, mirrored to state for rendering
  const currentRef = useRef('');
  const newRef = useRef('');
  const confirmRef = useRef('');

  const [currentVal, setCurrentVal] = useState('');
  const [newVal, setNewVal] = useState('');
  const [confirmVal, setConfirmVal] = useState('');

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation states
  const [currentValidity, setCurrentValidity] = useState<Validity>('idle');
  const [currentError, setCurrentError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Discard confirmation
  const [showDiscard, setShowDiscard] = useState(false);

  /* Derived */
  const strength = getStrength(newVal);
  const newPwdError = getNewPwdError(newVal, currentRef.current);
  const confirmError = confirmVal && newVal !== confirmVal ? 'Passwords do not match.' : '';
  const confirmValid = confirmVal.length > 0 && newVal === confirmVal && !newPwdError;

  const canSubmit =
    currentValidity === 'valid' &&
    !newPwdError &&
    newVal.length > 0 &&
    strength.score >= 1 &&
    confirmValid &&
    !isSubmitting;

  /* ── Verify current password on blur ── */
  const handleCurrentBlur = useCallback(async () => {
    const val = currentRef.current;
    if (!val) return;
    setIsVerifying(true);
    setCurrentValidity('pending');
    setCurrentError('');
    const res = await verifyCurrentPassword(val);
    setIsVerifying(false);
    if (res.ok) {
      setCurrentValidity('valid');
    } else {
      setCurrentValidity('error');
      setCurrentError('Incorrect password. Please try again.');
    }
  }, []);

  /* ── Close / discard logic ── */
  const tryClose = useCallback(() => {
    if (hasAnyInput(currentRef.current, newRef.current, confirmRef.current)) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  }, [onClose]);

  const confirmDiscard = useCallback(() => {
    // Clear refs — never log
    currentRef.current = '';
    newRef.current = '';
    confirmRef.current = '';
    onClose();
  }, [onClose]);

  /* ── Submit ── */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await changePassword({
        currentPassword: currentRef.current,
        newPassword: newRef.current,
      });
      if (res.ok) {
        // Clear refs before closing
        currentRef.current = '';
        newRef.current = '';
        confirmRef.current = '';
        showToast('Password updated successfully.', 'success');
        onClose();
      } else {
        setSubmitError(res.reason || 'Failed to update password. Please try again.');
      }
    } catch {
      setSubmitError('Something went wrong. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, onClose, showToast]);

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0f1117]/85 backdrop-blur-sm z-50"
        onClick={tryClose}
        aria-hidden
      />

      {/* Modal card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-[#13151e] border border-[#1e2130] rounded-[12px] shadow-[0_24px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2130]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#58d9b0]" />
              <h2 className="text-[15px] font-semibold text-white/90">Change Password</h2>
            </div>
            <button
              type="button"
              onClick={tryClose}
              className="text-[#8b92a5] hover:text-white transition-colors p-1 rounded-[6px] hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Current Password */}
            <PasswordField
              id="cp-current"
              label="Current Password"
              value={currentVal}
              show={showCurrent}
              onToggleShow={() => setShowCurrent(v => !v)}
              onChange={v => {
                currentRef.current = v;
                setCurrentVal(v);
                setCurrentValidity('idle');
                setCurrentError('');
              }}
              onBlur={handleCurrentBlur}
              validity={isVerifying ? 'pending' : currentValidity}
              errorMsg={currentError}
              disabled={isSubmitting}
            />

            {/* New Password */}
            <div>
              <PasswordField
                id="cp-new"
                label="New Password"
                value={newVal}
                show={showNew}
                onToggleShow={() => setShowNew(v => !v)}
                onChange={v => {
                  newRef.current = v;
                  setNewVal(v);
                }}
                validity={newVal && !newPwdError ? 'valid' : newVal && newPwdError ? 'error' : 'idle'}
                errorMsg={newVal ? newPwdError : ''}
                disabled={isSubmitting}
              />

              {/* Strength bar */}
              {newVal.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                          i < strength.score + 1 ? strength.barColor : 'bg-[#1e2130]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-medium ${strength.color}`}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <PasswordField
              id="cp-confirm"
              label="Confirm New Password"
              value={confirmVal}
              show={showConfirm}
              onToggleShow={() => setShowConfirm(v => !v)}
              onChange={v => {
                confirmRef.current = v;
                setConfirmVal(v);
              }}
              validity={confirmValid ? 'valid' : confirmError ? 'error' : 'idle'}
              errorMsg={confirmError}
              disabled={isSubmitting}
            />

            {/* Submit error */}
            {submitError && (
              <div className="px-3 py-2.5 rounded-[8px] bg-[rgba(248,81,73,0.1)] border border-[#f85149]/30 text-[12px] text-[#f85149]">
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="pt-1 flex justify-end gap-3">
              <button
                type="button"
                onClick={tryClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] font-medium text-[#8b92a5] hover:text-white border border-[#1e2130] hover:border-[#2e3244] rounded-[8px] transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-[#58d9b0] text-[#0d1117] rounded-[8px]
                  hover:bg-[#4ac59f] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Discard confirmation dialog */}
      {showDiscard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f1117]/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13151e] border border-[#1e2130] rounded-[12px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-[14px] font-semibold text-white/90 mb-2">Discard changes?</h3>
            <p className="text-[13px] text-[#8b92a5] mb-5">Your password has not been updated. Are you sure you want to discard these changes?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDiscard(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#8b92a5] hover:text-white border border-[#1e2130] rounded-[8px] transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmDiscard}
                className="px-4 py-2 text-[13px] font-medium bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/30 rounded-[8px] hover:bg-[#f85149]/20 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
