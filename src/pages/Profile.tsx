import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Save } from 'lucide-react';
import { getMe, normalizePhone, setSessionUser, clearSessionUser, clearToken, updateMe } from '../lib/auth';

export default function Profile() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getMe();
      if (!mounted) return;
      if (res.ok) {
        setForm({ name: res.user.name, email: res.user.email, phone: res.user.phone || '' });
        setSessionUser(res.user);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    (async () => {
      const res = await updateMe({ name: form.name, email: form.email, phone: normalizePhone(form.phone || '') });
      if (!res.ok) {
        setMessage(res.reason);
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      setForm({ name: res.user.name, email: res.user.email, phone: res.user.phone || '' });
      setSessionUser(res.user);
      setEditMode(false);
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
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="text-slate-600 mt-1">Manage your account settings</p>

      {message && (
        <div className={`mt-4 p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="mt-8 space-y-8">
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-900">Personal Details</h2>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} className="text-teal-600 font-medium hover:underline">
                Edit
              </button>
            ) : (
              <button onClick={() => setEditMode(false)} className="text-slate-500 hover:underline">Cancel</button>
            )}
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!editMode}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!editMode}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={!editMode}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {editMode && (
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700"
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
