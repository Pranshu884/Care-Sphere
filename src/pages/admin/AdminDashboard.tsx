import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiDelete } from '../../lib/api';
import { Users, UserPlus, Calendar, CheckCircle, XCircle, Search, Check, X, LayoutDashboard, Stethoscope } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');

  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [apptSearch, setApptSearch] = useState('');
  const [apptStatus, setApptStatus] = useState('All');

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'doctors') fetchDoctors();
    if (activeTab === 'appointments') fetchAppointments();
  }, [activeTab]);

  const fetchAnalytics = async () => { const res = await apiGet('/api/admin/analytics'); if (res.ok) setAnalytics(res.data.data); };
  const fetchUsers = async () => { const res = await apiGet('/api/admin/users'); if (res.ok) setUsers(res.data.users); };
  const fetchDoctors = async () => { const res = await apiGet('/api/admin/doctors'); if (res.ok) setDoctors(res.data.doctors); };
  const fetchAppointments = async () => { const res = await apiGet('/api/admin/appointments'); if (res.ok) setAppointments(res.data.appointments); };

  const toggleBlock = async (id: string, current: boolean) => { await apiPatch(`/api/admin/users/${id}/block`, { isBlocked: !current }); fetchUsers(); };
  const deleteUser = async (id: string) => { if (!window.confirm('Are you sure?')) return; await apiDelete(`/api/admin/users/${id}`); fetchUsers(); };
  const approveDoctor = async (id: string, status: string) => { await apiPatch(`/api/admin/doctors/${id}/approve`, { approvalStatus: status }); fetchDoctors(); };
  const updateAppointmentStatus = async (id: string, status: string) => { const res = await apiPatch(`/api/admin/appointments/${id}/status`, { status }); if (res.ok) fetchAppointments(); };

  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = apptStatus === 'All' || a.status === apptStatus.toLowerCase();
    const matchesSearch =
      (a.patientId?.name || '').toLowerCase().includes(apptSearch.toLowerCase()) ||
      (a.doctorId?.name || '').toLowerCase().includes(apptSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const navItems = [
    { id: 'analytics', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'doctors', label: 'Doctors', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 shrink-0 flex flex-col p-4 gap-2 border-r border-white/10 bg-white/[0.02]">
        <div className="px-2 mb-4">
          <p className="text-xs font-bold text-muted/60 uppercase tracking-widest">Admin Panel</p>
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
        {activeTab === 'analytics' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Overview</h1>
            <p className="text-muted text-sm mb-8">Platform statistics at a glance</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard title="Total Users" value={analytics?.totalUsers || 0} icon={<Users className="w-5 h-5" />} color="cyan" />
              <StatCard title="Total Doctors" value={analytics?.totalDoctors || 0} icon={<UserPlus className="w-5 h-5" />} color="violet" />
              <StatCard title="Approved Doctors" value={analytics?.approvedDoctors || 0} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
              <StatCard title="Appointments" value={analytics?.totalAppointments || 0} icon={<Calendar className="w-5 h-5" />} color="amber" />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-8 tracking-tight">Manage Users</h1>
            <div className="glass-panel overflow-hidden p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`p-4 font-semibold text-muted text-xs uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 font-medium text-white">{u.name}</td>
                      <td className="p-4 text-muted">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs capitalize text-muted">{u.role}</span>
                      </td>
                      <td className="p-4">
                        {u.isBlocked ? (
                          <span className="text-red-400 flex items-center gap-1 text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> Blocked</span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {u.role !== 'admin' && (
                          <>
                            <button onClick={() => toggleBlock(u._id, u.isBlocked)} className="text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-muted rounded-lg transition">
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button onClick={() => deleteUser(u._id)} className="text-xs font-medium px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition">
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-8 tracking-tight">Manage Doctors</h1>
            <div className="glass-panel overflow-hidden p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    {['Name', 'Specialization', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`p-4 font-semibold text-muted text-xs uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doctors.map(d => (
                    <tr key={d._id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 font-medium text-white">{d.name}</td>
                      <td className="p-4 text-muted">{d.specialization}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs capitalize font-bold tracking-wide ${
                          d.approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          d.approvalStatus === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {d.approvalStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {d.approvalStatus === 'pending' && (
                          <>
                            <button onClick={() => approveDoctor(d._id, 'approved')} className="text-xs px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition font-medium">Approve</button>
                            <button onClick={() => approveDoctor(d._id, 'rejected')} className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition font-medium">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">All Appointments</h1>
                <p className="text-muted text-sm mt-1">View and manage all platform appointments</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
                  <input
                    type="text"
                    placeholder="Search patient or doctor..."
                    value={apptSearch}
                    onChange={e => setApptSearch(e.target.value)}
                    className="premium-input pl-9 py-2 text-sm w-56"
                  />
                </div>
                <select
                  value={apptStatus}
                  onChange={e => setApptStatus(e.target.value)}
                  className="premium-input py-2 text-sm [&>option]:text-slate-900"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="glass-panel overflow-hidden p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    {['Patient', 'Doctor Details', 'Date & Time', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`p-4 font-semibold text-muted text-xs uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(a => (
                    <tr key={a._id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 font-medium text-white">{a.patientId?.name || 'Unknown'}</td>
                      <td className="p-4">
                        <div className="font-medium text-white">{a.doctorId?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted">{a.doctorId?.category || a.doctorId?.specialization || ''} • {a.doctorId?.city || ''}</div>
                      </td>
                      <td className="p-4 text-muted">{a.date} at {a.time}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs capitalize font-bold tracking-wide ${
                          a.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          a.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          a.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => updateAppointmentStatus(a._id, 'accepted')} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button onClick={() => updateAppointmentStatus(a._id, 'rejected')} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition inline-flex items-center gap-1">
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {a.status === 'accepted' && (
                          <button onClick={() => updateAppointmentStatus(a._id, 'completed')} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-bold transition inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Complete
                          </button>
                        )}
                        {['accepted', 'completed'].includes(a.status) && (
                          <button onClick={() => updateAppointmentStatus(a._id, 'rejected')} className="px-3 py-1.5 bg-white/5 border border-white/10 text-muted hover:bg-red-500/10 hover:text-red-400 rounded-lg text-xs font-bold transition">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted">No appointments found matching your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: Record<string, string> = {
    cyan: 'text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <div className="glass-panel p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorMap[color] || colorMap.cyan}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted font-medium">{title}</p>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
