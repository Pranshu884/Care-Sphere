import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { Calendar, Clock, User, Stethoscope } from 'lucide-react';

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('appointments');

  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: '', specialization: '', experience: 0, availabilitySlots: '' });

  useEffect(() => {
    fetchProfile();
    fetchAppointments();
  }, []);

  const fetchProfile = async () => {
    const res = await apiGet('/api/doctor/profile');
    if (res.ok && res.data.doctor) {
      setProfile(res.data.doctor);
      setForm({
        name: res.data.doctor.name || '',
        specialization: res.data.doctor.specialization || '',
        experience: res.data.doctor.experience || 0,
        availabilitySlots: (res.data.doctor.availabilitySlots || []).join(', ')
      });
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    const res = await apiGet('/api/doctor/appointments');
    if (res.ok) setAppointments(res.data.appointments);
    setLoading(false);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slots = form.availabilitySlots.split(',').map(s => s.trim()).filter(Boolean);
    const res = await apiPatch('/api/doctor/profile', { ...form, availabilitySlots: slots });
    if (res.ok) { alert('Profile updated'); fetchProfile(); }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    await apiPatch(`/api/doctor/appointments/${id}/status`, { status });
    fetchAppointments();
  };

  const updateAppointmentNotes = async (id: string, notes: string) => {
    await apiPatch(`/api/doctor/appointments/${id}/notes`, { notes });
    fetchAppointments();
  };

  const navItems = [
    { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 shrink-0 flex flex-col p-4 gap-2 border-r border-white/10 bg-white/[0.02]">
        <div className="px-2 mb-4">
          <p className="text-xs font-bold text-muted/60 uppercase tracking-widest">Doctor Panel</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Doctor Profile</h1>
            <p className="text-muted text-sm mb-8">Manage your profile and availability</p>

            {profile?.approvalStatus === 'pending' && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
                Your profile is <strong>pending approval</strong> by an administrator.
              </div>
            )}

            <div className="glass-panel p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white">{profile?.name || 'Doctor Name'}</p>
                  <p className="text-sm text-muted">{profile?.specialization || 'Specialization'}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Name</label>
                  <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="premium-input" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Specialization</label>
                  <input required type="text" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className="premium-input" placeholder="e.g. Cardiologist" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Experience (Years)</label>
                  <input required type="number" min="0" value={form.experience} onChange={e => setForm({ ...form, experience: Number(e.target.value) })} className="premium-input" placeholder="Years of experience" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Availability Slots <span className="text-muted/60">(comma-separated times)</span></label>
                  <input type="text" placeholder="09:00, 10:00, 14:00" value={form.availabilitySlots} onChange={e => setForm({ ...form, availabilitySlots: e.target.value })} className="premium-input" />
                </div>
                <button type="submit" className="glow-button w-full py-3.5">Save Profile</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">My Appointments</h1>
            <p className="text-muted text-sm mb-8">Review and manage patient appointments</p>

            <div className="space-y-4">
              {loading ? (
                <div className="glass-panel p-12 text-center text-muted">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="glass-panel p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                  <p className="text-muted font-medium">No appointments yet.</p>
                </div>
              ) : (
                appointments.map(apt => (
                  <div key={apt._id} className="glass-panel p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white">{apt.patientId?.name || 'Unknown Patient'}</h3>
                        <p className="text-sm text-muted flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" /> {apt.date} at {apt.time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        apt.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        apt.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-muted mb-4">
                      <strong className="text-white/70">Symptoms:</strong> {apt.symptoms}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
                      <div className="flex-1 w-full">
                        <label className="text-xs font-semibold text-muted/70 mb-1.5 block uppercase tracking-wider">Internal Notes</label>
                        <textarea
                          defaultValue={apt.notes}
                          onBlur={(e) => {
                            if (e.target.value !== apt.notes) updateAppointmentNotes(apt._id, e.target.value);
                          }}
                          placeholder="Add notes..."
                          className="premium-input text-sm resize-none"
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {apt.status === 'pending' && (
                          <>
                            <button onClick={() => updateAppointmentStatus(apt._id, 'accepted')} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-sm font-medium rounded-xl transition">Accept</button>
                            <button onClick={() => updateAppointmentStatus(apt._id, 'rejected')} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium rounded-xl transition">Reject</button>
                          </>
                        )}
                        {apt.status === 'accepted' && (
                          <button onClick={() => updateAppointmentStatus(apt._id, 'completed')} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium rounded-xl transition">Mark Completed</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
