import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Save, Edit2, X } from 'lucide-react';
import { getMe, setSessionUser, clearSessionUser, clearToken, updateMe } from '../lib/auth';

export default function Profile() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getMe();
      if (!mounted) return;
      if (res.ok) {
        setForm({ name: res.user.name, email: res.user.email });
        setSessionUser(res.user);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    (async () => {
      const res = await updateMe({ name: form.name, email: form.email });
      if (!res.ok) {
        setIsSuccess(false);
        setMessage(res.reason);
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      setForm({ name: res.user.name, email: res.user.email });
      setSessionUser(res.user);
      setEditMode(false);
      setIsSuccess(true);
      setMessage(res.user.emailVerified ? 'Profile updated successfully.' : 'Email updated. Please verify your new email.');
      setTimeout(() => setMessage(''), 3000);

      if (!res.user.emailVerified) {
        clearToken();
        clearSessionUser();
        navigate('/login');
      }
    })();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Profile</h1>
        <p className="text-muted mt-1">Manage your account settings</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
          isSuccess
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar & name header */}
        <div className="glass-panel p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/40 to-purple-500/40 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{form.name || 'Your Name'}</p>
            <p className="text-muted text-sm">{form.email || 'your@email.com'}</p>
          </div>
        </div>

        {/* Edit form */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white text-lg">Personal Details</h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-primary text-sm font-medium hover:bg-white/10 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <button
                onClick={() => setEditMode(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-muted text-sm font-medium hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/70" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!editMode}
                  className="premium-input pl-11 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/70" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!editMode}
                  className="premium-input pl-11 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {editMode && (
              <button
                type="submit"
                className="glow-button inline-flex items-center gap-2 px-6 py-3"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
