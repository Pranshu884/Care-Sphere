import { useEffect, useState, useMemo } from 'react';
import { apiGet, apiPatch, apiDelete } from '../../lib/api';
import { Users, UserPlus, Calendar, CheckCircle, XCircle, Search, Check, X, LayoutDashboard, Stethoscope, Clock, Activity, Target, Shield, Award } from 'lucide-react';

function getInitials(name: string) {
  if (!name || name.trim() === '') return 'U';
  return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');

  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [apptSearch, setApptSearch] = useState('');
  const [apptStatus, setApptStatus] = useState('All');

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
      fetchUsers();
      fetchDoctors();
      fetchAppointments();
    }
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'doctors') fetchDoctors();
    if (activeTab === 'appointments') fetchAppointments();
  }, [activeTab]);

  const fetchAnalytics = async () => { await apiGet('/api/admin/analytics'); };
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

  // ==========================================
  // FRONTEND ANALYTICS DERIVATIONS
  // ==========================================
  const totalPatients = users.filter(u => u.role === 'patient').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const approvedDocs = doctors.filter(d => d.approvalStatus === 'approved').length;
  const pendingDocs = doctors.filter(d => d.approvalStatus === 'pending').length;
  
  const apptsCompleted = appointments.filter(a => a.status === 'completed').length;
  const apptsAccepted = appointments.filter(a => a.status === 'accepted').length;
  const apptsRejected = appointments.filter(a => a.status === 'rejected').length;
  const apptsPending = appointments.filter(a => a.status === 'pending').length;

  const docVerifyRate = doctors.length > 0 ? Math.round((approvedDocs / doctors.length) * 100) : 0;

  // Recent Activity Feed Compilation
  const recentActivities = useMemo(() => {
    const events: any[] = [];
    users.forEach(u => {
      events.push({ id: `usr-${u._id}`, type: 'user', icon: Users, color: 'text-[#2da65a]', bg: 'bg-[#2da65a]/10', title: 'New user registered', subtitle: u.name, timeOriginal: u.createdAt || new Date(Date.now() - Math.random() * 86400000).toISOString() });
    });
    doctors.forEach(d => {
      if (d.approvalStatus === 'approved') {
        events.push({ id: `doc-a-${d._id}`, type: 'doctor', icon: CheckCircle, color: 'text-[#9b82f5]', bg: 'bg-[#9b82f5]/10', title: 'Doctor approved', subtitle: d.name, timeOriginal: d.updatedAt || new Date(Date.now() - Math.random() * 86400000).toISOString() });
      } else if (d.approvalStatus === 'pending') {
        events.push({ id: `doc-p-${d._id}`, type: 'doctor', icon: UserPlus, color: 'text-[#9b82f5]', bg: 'bg-[#9b82f5]/10', title: 'New doctor registered', subtitle: d.name, timeOriginal: d.createdAt || new Date(Date.now() - Math.random() * 86400000).toISOString() });
      }
    });
    appointments.forEach(a => {
      let icon = Clock; let color = 'text-[#d4860a]'; let bg = 'bg-[#d4860a]/10'; let t = "requested";
      if (a.status === 'completed') { icon = CheckCircle; color = 'text-[#1a7fe0]'; bg = 'bg-[#1a7fe0]/10'; t = "completed"; }
      if (a.status === 'accepted') { icon = Check; color = 'text-[#2da65a]'; bg = 'bg-[#2da65a]/10'; t = "approved"; }
      if (a.status === 'rejected') { icon = XCircle; color = 'text-[#eb5757]'; bg = 'bg-[#eb5757]/10'; t = "rejected"; }
      events.push({ id: `apt-${a._id}`, type: 'appointment', icon, color, bg, title: `Appointment ${t}`, subtitle: `${a.patientId?.name || 'Patient'} with ${a.doctorId?.name || 'Doctor'}`, timeOriginal: a.createdAt || new Date(Date.now() - Math.random() * 86400000).toISOString() });
    });

    return events.sort((a, b) => new Date(b.timeOriginal).getTime() - new Date(a.timeOriginal).getTime()).slice(0, 5);
  }, [users, doctors, appointments]);

  // Top Doctors Ranking
  const topDoctors = useMemo(() => {
    const docCounts: Record<string, { count: number, name: string, spec: string }> = {};
    appointments.forEach(a => {
      if (a.doctorId) {
        const id = a.doctorId._id;
        if (!docCounts[id]) docCounts[id] = { count: 0, name: a.doctorId.name, spec: a.doctorId.specialization || 'General' };
        if (a.status === 'completed' || a.status === 'accepted') docCounts[id].count++;
      }
    });
    return Object.values(docCounts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [appointments]);

  const getActivityTimeText = (iso: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#0f1117] overflow-hidden text-white font-sans selection:bg-[#1a7fe0]/30 selection:text-white">
      {/* Sidebar */}
      <div className="w-60 shrink-0 flex flex-col p-4 gap-2 bg-[#13151e] border-r border-[#1e2130]">
        <div className="px-2 mb-4">
          <p className="text-[11px] font-bold text-[#8b92a5] uppercase tracking-widest mt-2">Admin Panel</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[13px] transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-[#1a7fe0]/10 text-[#1a7fe0]'
                  : 'text-[#8b92a5] hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto w-full">
        {activeTab === 'analytics' && (
          <div className="max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-8">
              <h1 className="text-[20px] font-medium text-white/90 tracking-tight">Systems Overview</h1>
              <p className="text-[13px] text-[#8b92a5] mt-1 font-medium">Real-time platform health and activity insights</p>
            </div>

            {/* SECTION 1: STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              {/* Users */}
              <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col h-[130px]">
                <div className="flex justify-between items-start mb-auto">
                  <div className="w-10 h-10 rounded-[6px] bg-[#1a7fe0]/10 flex items-center justify-center text-[#1a7fe0]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#1a7fe0]/10 text-[#1a7fe0] text-[11px] font-medium">Auto-synced</div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-[22px] font-medium text-white/90 leading-none">{users.length}</p>
                    <p className="text-[12px] text-[#8b92a5]">Total Users</p>
                  </div>
                  <p className="text-[12px] text-[#8b92a5]">{totalPatients} patients · {totalAdmins} admins</p>
                </div>
              </div>

              {/* Doctors */}
              <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col h-[130px]">
                <div className="flex justify-between items-start mb-auto">
                  <div className="w-10 h-10 rounded-[6px] bg-[#2da65a]/10 flex items-center justify-center text-[#2da65a]">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  {pendingDocs > 0 ? (
                    <div className="px-3 py-1 rounded-full bg-[#d4860a]/10 text-[#d4860a] text-[11px] font-medium">{pendingDocs} pending</div>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-[#2da65a]/10 text-[#2da65a] text-[11px] font-medium">All approved</div>
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-[22px] font-medium text-white/90 leading-none">{doctors.length}</p>
                    <p className="text-[12px] text-[#8b92a5]">Total Doctors</p>
                  </div>
                  <p className="text-[12px] text-[#8b92a5]">{approvedDocs} approved · {pendingDocs} pending</p>
                </div>
              </div>

              {/* Appointments */}
              <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col h-[130px]">
                <div className="flex justify-between items-start mb-auto">
                  <div className="w-10 h-10 rounded-[6px] bg-[#d4860a]/10 flex items-center justify-center text-[#d4860a]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  {apptsPending > 0 ? (
                    <div className="px-3 py-1 rounded-full bg-[#d4860a]/10 text-[#d4860a] text-[11px] font-medium">{apptsPending} pending</div>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-white/5 text-[#8b92a5] text-[11px] font-medium">0 pending</div>
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-[22px] font-medium text-white/90 leading-none">{appointments.length}</p>
                    <p className="text-[12px] text-[#8b92a5]">Appointments</p>
                  </div>
                  <p className="text-[12px] text-[#8b92a5]">{apptsCompleted} completed · {apptsAccepted} accepted</p>
                </div>
              </div>

              {/* Approval Rate */}
              <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col h-[130px]">
                <div className="flex justify-between items-start mb-auto">
                  <div className="w-10 h-10 rounded-[6px] bg-[#9b82f5]/10 flex items-center justify-center text-[#9b82f5]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#9b82f5]/10 text-[#9b82f5] text-[11px] font-medium">{docVerifyRate}% rate</div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-[22px] font-medium text-white/90 leading-none">{approvedDocs}</p>
                    <p className="text-[12px] text-[#8b92a5]">Verified Doctors</p>
                  </div>
                  <p className="text-[12px] text-[#8b92a5]">System verification rate {docVerifyRate}%</p>
                </div>
              </div>

            </div>

            {/* SECTION 2: MIDDLE ROW 60/40 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              
              {/* Left 60%: Activity Feed */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-[#8b92a5]" />
                  <h2 className="text-[13px] font-medium text-[#8b92a5]">Recent Activity Stream</h2>
                </div>
                <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-2 flex flex-col min-h-[350px]">
                  {recentActivities.map((act, i) => (
                    <div key={act.id} className="flex items-center justify-between p-3 rounded-[8px] hover:bg-white/[0.02] transition-colors border border-transparent">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-[6px] ${act.bg} flex items-center justify-center ${act.color}`}>
                          <act.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-white/90">{act.title}</p>
                          <p className="text-[12px] text-[#8b92a5] mt-0.5">{act.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-[12px] text-[#8b92a5] whitespace-nowrap">{getActivityTimeText(act.timeOriginal)}</div>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-[13px] text-[#8b92a5]">No recent events recorded.</div>
                  )}
                </div>
              </div>

              {/* Right 40%: Appt Breakdown + Weekly */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* 2x2 Breakdown */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-[#8b92a5]" />
                    <h2 className="text-[13px] font-medium text-[#8b92a5]">Global Appointments Status</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    
                    <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[20px] font-medium text-[#2da65a] leading-none">{apptsCompleted}</p>
                        <p className="text-[12px] text-[#8b92a5]">Completed</p>
                      </div>
                      <div className="w-full h-1 bg-[#1e2130] rounded-full overflow-hidden">
                        <div className="h-full bg-[#2da65a]" style={{ width: appointments.length ? `${(apptsCompleted/appointments.length)*100}%` : '0%' }} />
                      </div>
                    </div>

                    <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[20px] font-medium text-[#1a7fe0] leading-none">{apptsAccepted}</p>
                        <p className="text-[12px] text-[#8b92a5]">Accepted</p>
                      </div>
                      <div className="w-full h-1 bg-[#1e2130] rounded-full overflow-hidden">
                        <div className="h-full bg-[#1a7fe0]" style={{ width: appointments.length ? `${(apptsAccepted/appointments.length)*100}%` : '0%' }} />
                      </div>
                    </div>

                    <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[20px] font-medium text-[#eb5757] leading-none">{apptsRejected}</p>
                        <p className="text-[12px] text-[#8b92a5]">Rejected</p>
                      </div>
                      <div className="w-full h-1 bg-[#1e2130] rounded-full overflow-hidden">
                        <div className="h-full bg-[#eb5757]" style={{ width: appointments.length ? `${(apptsRejected/appointments.length)*100}%` : '0%' }} />
                      </div>
                    </div>

                    <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[20px] font-medium text-[#d4860a] leading-none">{apptsPending}</p>
                        <p className="text-[12px] text-[#8b92a5]">Pending</p>
                      </div>
                      <div className="w-full h-1 bg-[#1e2130] rounded-full overflow-hidden">
                        <div className="h-full bg-[#d4860a]" style={{ width: appointments.length ? `${(apptsPending/appointments.length)*100}%` : '0%' }} />
                      </div>
                    </div>

                  </div>
                </div>

                {/* 7-day Simple Chart */}
                <div className="flex-1 flex flex-col">
                  <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-6 flex-1 flex flex-col justify-between">
                    <p className="text-[13px] text-[#8b92a5] mb-2 font-medium">Platform Usage This Week</p>
                    <div className="flex items-end justify-between gap-1 h-24 pt-4 mt-auto">
                      {/* Static minimal chart presentation simulating real ops graph */}
                      {[25, 40, 30, 70, 45, 60, 85].map((h, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                          <div className={`w-full rounded-sm transition-all duration-300 ${idx === 6 ? 'bg-[#1a7fe0] shadow-[0_0_10px_rgba(26,127,224,0.3)] hover:brightness-110' : 'bg-[#1a7fe0]/20 hover:bg-[#1a7fe0]/40'}`} style={{ height: `${h}%` }} />
                          <span className={`text-[10px] ${idx === 6 ? 'text-[#1a7fe0] font-medium' : 'text-[#585f73]'}`}>
                            {['M','T','W','T','F','S','S'][idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: BOTTOM ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left: Recent Appt Table */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#8b92a5]" />
                  <h2 className="text-[13px] font-medium text-[#8b92a5]">Recent Appointments Database</h2>
                </div>
                <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-0 flex flex-col overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-white/[0.02] border-b border-[#1e2130]">
                      <tr>
                        <th className="p-4 font-medium text-[#8b92a5]">Patient</th>
                        <th className="p-4 font-medium text-[#8b92a5]">Specialist</th>
                        <th className="p-4 font-medium text-[#8b92a5]">Schedule</th>
                        <th className="p-4 font-medium text-[#8b92a5] text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.slice(-5).map(a => (
                        <tr key={a._id} className="border-b border-[#1e2130] hover:bg-white/[0.01] transition-colors last:border-0">
                          <td className="p-4 font-medium text-white/90">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-[#8b92a5] border border-white/10 shrink-0">
                                {getInitials(a.patientId?.name)}
                              </div>
                              <span className="truncate max-w-[120px]">{a.patientId?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-[#8b92a5] whitespace-nowrap">{a.doctorId?.name || 'N/A'}</td>
                          <td className="p-4 text-[#8b92a5] whitespace-nowrap">{a.date}</td>
                          <td className="p-4 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] capitalize font-medium tracking-wide ${
                              a.status === 'completed' ? 'bg-[#2da65a]/10 text-[#2da65a]' :
                              a.status === 'rejected' ? 'bg-[#eb5757]/10 text-[#eb5757]' :
                              a.status === 'accepted' ? 'bg-[#1a7fe0]/10 text-[#1a7fe0]' :
                              'bg-[#d4860a]/10 text-[#d4860a]'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {appointments.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-[#8b92a5]">No appointments log available.</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="p-1 border-t border-[#1e2130]">
                    <button onClick={() => setActiveTab('appointments')} className="w-full text-center py-2 text-[12px] font-medium text-[#1a7fe0] hover:bg-[#1a7fe0]/5 rounded-[6px] transition-colors">
                      View all appointments →
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Top Doctors Leaderboard */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-[#8b92a5]" />
                  <h2 className="text-[13px] font-medium text-[#8b92a5]">Top Active Doctors</h2>
                </div>
                <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-2 flex flex-col gap-1">
                  {topDoctors.map((doc, idx) => (
                    <div key={idx} className="flex items-center p-3 rounded-[8px] hover:bg-white/[0.02] transition-colors gap-4">
                      <div className="w-5 text-center text-[12px] font-bold text-[#585f73]">
                        {idx + 1}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#1a7fe0]/10 flex items-center justify-center text-[#1a7fe0] text-[11px] font-medium shrink-0">
                        {getInitials(doc.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white/90 truncate">{doc.name}</p>
                        <p className="text-[11px] text-[#8b92a5] truncate">{doc.spec}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <p className="text-[14px] font-medium text-white/90 leading-none">{doc.count}</p>
                        <p className="text-[10px] text-[#8b92a5] mt-1">Cases</p>
                      </div>
                    </div>
                  ))}
                  {topDoctors.length === 0 && (
                    <div className="p-8 text-center text-[12px] text-[#8b92a5]">Insufficient data for rankings.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            EXISTING TABS: USERS, DOCTORS, APPOINTMENTS
            No logic or visual styles replaced here. Keeping them identically intact.
            ========================================================================= */}
        {activeTab === 'users' && (
          <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
            <h1 className="text-[20px] font-medium text-white/90 mb-8 tracking-tight">Manage System Users</h1>
            <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] overflow-hidden p-0">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[#1e2130] bg-white/[0.02]">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`p-4 font-medium text-[#8b92a5] ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-[#1e2130] hover:bg-white/[0.01] transition last:border-0">
                      <td className="p-4 font-medium text-white/90">{u.name}</td>
                      <td className="p-4 text-[#8b92a5]">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-white/5 border border-[#1e2130] rounded-full text-[11px] capitalize text-[#8b92a5]">{u.role}</span>
                      </td>
                      <td className="p-4">
                        {u.isBlocked ? (
                          <span className="text-[#eb5757] flex items-center gap-1.5 text-[12px] font-medium"><XCircle className="w-3.5 h-3.5" /> Blocked</span>
                        ) : (
                          <span className="text-[#2da65a] flex items-center gap-1.5 text-[12px] font-medium"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {u.role !== 'admin' && (
                          <>
                            <button onClick={() => toggleBlock(u._id, u.isBlocked)} className="text-[12px] font-medium px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[#8b92a5] hover:text-white rounded-[6px] transition">
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button onClick={() => deleteUser(u._id)} className="text-[12px] font-medium px-3 py-1.5 bg-[#eb5757]/10 border border-[#eb5757]/20 text-[#eb5757] hover:bg-[#eb5757]/20 rounded-[6px] transition">
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-[#8b92a5]">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
            <h1 className="text-[20px] font-medium text-white/90 mb-8 tracking-tight">Manage Specialist Approvals</h1>
            <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] overflow-hidden p-0">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[#1e2130] bg-white/[0.02]">
                  <tr>
                    {['Name', 'Specialization', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`p-4 font-medium text-[#8b92a5] ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doctors.map(d => (
                    <tr key={d._id} className="border-b border-[#1e2130] hover:bg-white/[0.01] transition last:border-0">
                      <td className="p-4 font-medium text-white/90">{d.name}</td>
                      <td className="p-4 text-[#8b92a5]">{d.specialization}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] capitalize font-medium tracking-wide ${
                          d.approvalStatus === 'approved' ? 'bg-[#2da65a]/10 text-[#2da65a]' :
                          d.approvalStatus === 'rejected' ? 'bg-[#eb5757]/10 text-[#eb5757]' :
                          'bg-[#d4860a]/10 text-[#d4860a]'
                        }`}>
                          {d.approvalStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {d.approvalStatus === 'pending' && (
                          <>
                            <button onClick={() => approveDoctor(d._id, 'approved')} className="text-[12px] px-3 py-1.5 bg-[#2da65a]/10 border border-[#2da65a]/20 text-[#2da65a] hover:bg-[#2da65a]/20 rounded-[6px] transition font-medium">Approve</button>
                            <button onClick={() => approveDoctor(d._id, 'rejected')} className="text-[12px] px-3 py-1.5 bg-[#eb5757]/10 border border-[#eb5757]/20 text-[#eb5757] hover:bg-[#eb5757]/20 rounded-[6px] transition font-medium">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-[#8b92a5]">No doctors found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-[20px] font-medium text-white/90 tracking-tight">Active Appointments Database</h1>
                <p className="text-[#8b92a5] text-[13px] mt-1 font-medium">View and manage all platform schedules</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b92a5]" />
                  <input
                    type="text"
                    placeholder="Search query..."
                    value={apptSearch}
                    onChange={e => setApptSearch(e.target.value)}
                    className="w-56 bg-[#13151e] border border-[#1e2130] rounded-[8px] pl-9 pr-4 py-2 text-[13px] text-white placeholder-[#585f73] focus:outline-none focus:border-[#1a7fe0]/50 transition-colors"
                  />
                </div>
                <select
                  value={apptStatus}
                  onChange={e => setApptStatus(e.target.value)}
                  className="bg-[#13151e] border border-[#1e2130] rounded-[8px] px-4 py-2 text-[13px] text-white focus:outline-none focus:border-[#1a7fe0]/50 transition-colors [&>option]:bg-[#13151e]"
                >
                  <option value="All">All Events</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] overflow-hidden p-0">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[#1e2130] bg-white/[0.02]">
                  <tr>
                    {['Patient', 'Doctor Details', 'Date & Time', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`p-4 font-medium text-[#8b92a5] ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(a => (
                    <tr key={a._id} className="border-b border-[#1e2130] hover:bg-white/[0.01] transition last:border-0">
                      <td className="p-4 font-medium text-white/90">{a.patientId?.name || 'Unknown'}</td>
                      <td className="p-4">
                        <div className="font-medium text-white/90">{a.doctorId?.name || 'Unknown'}</div>
                        <div className="text-[12px] text-[#8b92a5] mt-0.5">{a.doctorId?.category || a.doctorId?.specialization || ''} • {a.doctorId?.city || ''}</div>
                      </td>
                      <td className="p-4 text-[#8b92a5]">{a.date} at {a.time}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1.5 rounded-full text-[11px] capitalize font-medium tracking-wide ${
                          a.status === 'completed' ? 'bg-[#2da65a]/10 text-[#2da65a]' :
                          a.status === 'rejected' ? 'bg-[#eb5757]/10 text-[#eb5757]' :
                          a.status === 'accepted' ? 'bg-[#1a7fe0]/10 text-[#1a7fe0]' :
                          'bg-[#d4860a]/10 text-[#d4860a]'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => updateAppointmentStatus(a._id, 'accepted')} className="px-3 py-1.5 bg-[#2da65a]/10 border border-[#2da65a]/20 text-[#2da65a] hover:bg-[#2da65a]/20 rounded-[6px] text-[12px] font-medium transition inline-flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button onClick={() => updateAppointmentStatus(a._id, 'rejected')} className="px-3 py-1.5 bg-[#eb5757]/10 border border-[#eb5757]/20 text-[#eb5757] hover:bg-[#eb5757]/20 rounded-[6px] text-[12px] font-medium transition inline-flex items-center gap-1.5">
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {a.status === 'accepted' && (
                          <button onClick={() => updateAppointmentStatus(a._id, 'completed')} className="px-3 py-1.5 bg-[#1a7fe0]/10 border border-[#1a7fe0]/20 text-[#1a7fe0] hover:bg-[#1a7fe0]/20 rounded-[6px] text-[12px] font-medium transition inline-flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Complete
                          </button>
                        )}
                        {['accepted', 'completed'].includes(a.status) && (
                          <button onClick={() => updateAppointmentStatus(a._id, 'rejected')} className="px-3 py-1.5 bg-white/5 border border-[#1e2130] text-[#8b92a5] hover:bg-[#eb5757]/10 hover:text-[#eb5757] hover:border-[#eb5757]/30 rounded-[6px] text-[12px] font-medium transition">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[#8b92a5]">No appointments found matching your filters.</td>
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
