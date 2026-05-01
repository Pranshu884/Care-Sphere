import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, Activity, ChevronRight, Star, Plus } from 'lucide-react';
import { getMe } from '../lib/auth';
import { apiGet } from '../lib/api';

export default function Dashboard() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  
  // Real Data States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [stressEntries, setStressEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadDashboardData = async () => {
      try {
        const [meRes, aptRes, medRes, repRes] = await Promise.all([
          getMe(),
          apiGet('/api/user/appointments'),
          apiGet('/api/medicines'),
          apiGet('/api/reports')
        ]);
        
        if (!mounted) return;
        
        if (meRes.ok) setUser({ name: meRes.user.name });
        if (aptRes.ok && aptRes.data.success) setAppointments(aptRes.data.appointments || []);
        if (medRes.ok && medRes.data.success) setMedicines(medRes.data.medicines || []);
        if (repRes.ok && repRes.data.success) setReports(repRes.data.reports || []);

        try {
          const stressStr = localStorage.getItem('caresphere_stress');
          if (stressStr) setStressEntries(JSON.parse(stressStr));
        } catch (e) {}
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Compute live stats
  const pendingApts = appointments.filter(a => a.status === 'pending' || a.status === 'accepted');
  
  // Actually, backend enriching provides `todayStatus`
  const activeMedicines = medicines.filter(m => !m.isCompleted); 
  const todaysMedicines = activeMedicines.slice(0, 3); // Display up to 3 for the dashboard preview 

  // recent stress
  const recentStress = stressEntries.slice(-1)[0]?.stressLevel || 0;

  const stats = { 
    appointments: pendingApts.length, 
    medicines: activeMedicines.length, 
    stress: recentStress, 
    reports: reports.length 
  };

  if (loading) {
    return (
      <div className="w-full bg-[#0f1117] min-h-screen flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-[#1a7fe0]" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0f1117] min-h-full">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans text-white">
        
        {/* GREETING SECTION */}
        <div className="mb-8">
          <h1 className="text-[20px] font-medium text-white/90 tracking-tight">
            {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[13px] text-[#8b92a5] mt-1 font-medium">
            {dateString} · Here's your health overview for today
          </p>
        </div>

        {/* 4 CARDS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Appointments */}
          <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col hover:border-[#1a7fe0]/50 transition-colors h-[140px]">
            <div className="flex justify-between items-start mb-auto">
              <div className="w-10 h-10 rounded-[6px] bg-[#1a7fe0]/10 flex items-center justify-center text-[#1a7fe0]">
                <Clock className="w-5 h-5" />
              </div>
              {stats.appointments > 0 ? (
                <div className="px-3 py-1 rounded-full bg-[#d4860a]/10 text-[#d4860a] text-[11px] font-medium">Pending</div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-white/5 text-[#8b92a5] text-[11px] font-medium">No data</div>
              )}
            </div>
            {stats.appointments > 0 ? (
              <div>
                <p className="text-[22px] font-medium text-white/90 leading-none mb-1">{stats.appointments}</p>
                <p className="text-[12px] text-[#8b92a5]">Appointments</p>
              </div>
            ) : (
              <div>
                <p className="text-[22px] font-medium text-white/40 leading-none mb-1">—</p>
                <Link to="/appointments" className="text-[12px] text-[#1a7fe0] hover:underline flex items-center gap-1 group">
                  Book your first appointment <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Medicines */}
          <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col hover:border-[#2da65a]/50 transition-colors h-[140px]">
            <div className="flex justify-between items-start mb-auto">
              <div className="w-10 h-10 rounded-[6px] bg-[#2da65a]/10 flex items-center justify-center text-[#2da65a]">
                <Plus className="w-5 h-5" />
              </div>
              {stats.medicines > 0 ? (
                <div className="px-3 py-1 rounded-full bg-[#2da65a]/10 text-[#2da65a] text-[11px] font-medium">On track</div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-white/5 text-[#8b92a5] text-[11px] font-medium">No data</div>
              )}
            </div>
            {stats.medicines > 0 ? (
              <div>
                <p className="text-[22px] font-medium text-white/90 leading-none mb-1">{stats.medicines}</p>
                <p className="text-[12px] text-[#8b92a5]">Medicines today</p>
              </div>
            ) : (
              <div>
                <p className="text-[22px] font-medium text-white/40 leading-none mb-1">—</p>
                <Link to="/medicine-reminder" className="text-[12px] text-[#2da65a] hover:underline flex items-center gap-1 group">
                  Add your first reminder <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Stress */}
          <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col hover:border-[#d4860a]/50 transition-colors h-[140px]">
            <div className="flex justify-between items-start mb-auto">
              <div className="w-10 h-10 rounded-[6px] bg-[#d4860a]/10 flex items-center justify-center text-[#d4860a]">
                <Star className="w-5 h-5" />
              </div>
              {stats.stress > 0 ? (
                <div className="px-3 py-1 rounded-full bg-[#d4860a]/10 text-[#d4860a] text-[11px] font-medium">Active</div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-white/5 text-[#8b92a5] text-[11px] font-medium">No data</div>
              )}
            </div>
            {stats.stress > 0 ? (
              <div>
                <p className="text-[22px] font-medium text-white/90 leading-none mb-1">{stats.stress}/10</p>
                <p className="text-[12px] text-[#8b92a5]">Stress score</p>
              </div>
            ) : (
              <div>
                <p className="text-[22px] font-medium text-white/40 leading-none mb-1">—</p>
                <Link to="/stress-tracker" className="text-[12px] text-[#d4860a] hover:underline flex items-center gap-1 group">
                  Start your first check <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Health Reports */}
          <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col hover:border-[#9b82f5]/50 transition-colors h-[140px]">
            <div className="flex justify-between items-start mb-auto">
              <div className="w-10 h-10 rounded-[6px] bg-[#9b82f5]/10 flex items-center justify-center text-[#9b82f5]">
                <Activity className="w-5 h-5" />
              </div>
              {stats.reports > 0 ? (
                <div className="px-3 py-1 rounded-full bg-[#1a7fe0]/10 text-[#1a7fe0] text-[11px] font-medium">3 reports</div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-white/5 text-[#8b92a5] text-[11px] font-medium">No data</div>
              )}
            </div>
            {stats.reports > 0 ? (
              <div>
                <p className="text-[22px] font-medium text-white/90 leading-none mb-1">{stats.reports}</p>
                <p className="text-[12px] text-[#8b92a5]">Health reports</p>
              </div>
            ) : (
              <div>
                <p className="text-[22px] font-medium text-white/40 leading-none mb-1">—</p>
                <Link to="/health-reports" className="text-[12px] text-[#9b82f5] hover:underline flex items-center gap-1 group">
                  Upload your first report <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* MIDDLE SECTION 2x2 GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT: UPCOMING APPOINTMENTS & MEDICINES */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Appointments Panel */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1a7fe0]" />
                <h2 className="text-[13px] font-medium text-[#8b92a5]">Upcoming appointments</h2>
              </div>
              <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-2 flex flex-col">
                {pendingApts.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-[13px] text-[#8b92a5] mb-2">No upcoming appointments</p>
                  </div>
                ) : (
                  pendingApts.slice(0, 3).map((apt, idx) => (
                    <div key={apt._id || idx} className="flex items-center justify-between p-3 rounded-[8px] hover:bg-white/[0.02] transition-colors border border-transparent">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[6px] bg-[#1a7fe0]/10 flex items-center justify-center text-[#1a7fe0]">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-white/90">
                            {apt.doctorId?.name ? `Dr. ${apt.doctorId.name}` : 'Appointment'}
                          </p>
                          <p className="text-[12px] text-[#8b92a5]">
                            {apt.doctorId?.specialization || 'General'} · {apt.status === 'accepted' ? 'Confirmed' : 'Pending approval'}
                          </p>
                        </div>
                      </div>
                      <div className="text-[12px] text-[#8b92a5]">
                        {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br/>
                        <span className="text-[10px] opacity-70">{apt.time}</span>
                      </div>
                    </div>
                  ))
                )}

                <div className="mt-1 pt-2 pb-1 border-t border-[#1e2130]">
                  <Link to="/appointments" className="text-[13px] text-[#1a7fe0] inline-block w-full text-center hover:bg-[#1a7fe0]/5 rounded-[6px] py-2 transition-colors font-medium">
                    + Book new appointment
                  </Link>
                </div>
              </div>
            </div>

            {/* Medicines Panel */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2da65a]" />
                <h2 className="text-[13px] font-medium text-[#8b92a5]">Today's medicines</h2>
              </div>
              <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col gap-5">
                
                {todaysMedicines.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-[13px] text-[#8b92a5]">No medications scheduled</p>
                  </div>
                ) : (
                  todaysMedicines.map((med, idx) => {
                    const times = med.times || [];
                    const nextTime = med.nextDose || times[0] || '';
                    
                    let bgAccent = idx % 3 === 0 ? 'bg-[#1a7fe0]' : idx % 3 === 1 ? 'bg-[#d4860a]' : 'bg-[#9b82f5]';
                    
                    return (
                      <div key={med._id || idx}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-1.5 h-1.5 rounded-full ${bgAccent}`} />
                            <div>
                              <p className="text-[14px] font-medium text-white/90">{med.name} {med.dosage}</p>
                              <p className="text-[12px] text-[#8b92a5] mt-0.5">{nextTime ? `${nextTime} · ` : ''}{med.notes || 'Scheduled'}</p>
                            </div>
                          </div>
                          {med.todayStatus?.taken?.includes(nextTime) ? (
                            <div className="px-3 py-1 rounded-full bg-[#2da65a]/10 text-[#2da65a] text-[11px] font-medium">Taken</div>
                          ) : (
                            <div className="px-3 py-1 rounded-full bg-white/5 text-[#8b92a5] text-[11px] font-medium">Pending</div>
                          )}
                        </div>
                        {idx < todaysMedicines.length - 1 && <div className="w-full h-[1px] bg-[#1e2130] mt-5" />}
                      </div>
                    );
                  })
                )}

              </div>
            </div>

          </div>

          {/* RIGHT: QUICK ACTIONS & STRESS TREND */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9b82f5]" />
                <h2 className="text-[13px] font-medium text-[#8b92a5]">Quick actions</h2>
              </div>
              <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-2 flex flex-col gap-2">
                
                <Link to="/symptom-checker" className="flex items-center justify-between p-3 rounded-[8px] hover:bg-white/[0.03] transition-colors group border border-[#1e2130]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[6px] bg-[#1a7fe0]/10 flex items-center justify-center text-[#1a7fe0]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-[14px] font-medium text-white/90">Check symptoms</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8b92a5] group-hover:text-white transition-colors" />
                </Link>

                <Link to="/medicine-reminder" className="flex items-center justify-between p-3 rounded-[8px] hover:bg-white/[0.03] transition-colors group border border-[#1e2130]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[6px] bg-[#2da65a]/10 flex items-center justify-center text-[#2da65a]">
                      <Plus className="w-5 h-5" />
                    </div>
                    <p className="text-[14px] font-medium text-white/90">Add reminder</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8b92a5] group-hover:text-white transition-colors" />
                </Link>

                <Link to="/health-reports" className="flex items-center justify-between p-3 rounded-[8px] hover:bg-white/[0.03] transition-colors group border border-[#1e2130]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[6px] bg-[#9b82f5]/10 flex items-center justify-center text-[#9b82f5]">
                      <Activity className="w-5 h-5" />
                    </div>
                    <p className="text-[14px] font-medium text-white/90">Upload report</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8b92a5] group-hover:text-white transition-colors" />
                </Link>

                <Link to="/stress-tracker" className="flex items-center justify-between p-3 rounded-[8px] hover:bg-white/[0.03] transition-colors group border border-[#1e2130]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[6px] bg-[#d4860a]/10 flex items-center justify-center text-[#d4860a]">
                      <Star className="w-5 h-5" />
                    </div>
                    <p className="text-[14px] font-medium text-white/90">Log stress</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8b92a5] group-hover:text-white transition-colors" />
                </Link>

              </div>
            </div>

            {/* Stress Trend Chart */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d4860a]" />
                <h2 className="text-[13px] font-medium text-[#8b92a5]">Stress trend · this week</h2>
              </div>
              <div className="bg-[#13151e] border border-[#1e2130] rounded-[10px] p-6 flex flex-col justify-between min-h-[224px]">
                
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-[13px] text-[#8b92a5]">Today</span>
                  <div className="flex-1 h-2 rounded-full bg-[#1e2130] overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2da65a] to-[#d4860a] w-[42%]" />
                  </div>
                  <span className="text-[14px] font-medium text-[#d4860a]">4.2</span>
                </div>

                <div className="flex items-end justify-between gap-2 h-24 pt-4 mt-auto">
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-[#1a7fe0]/20 rounded-t-[4px] h-[30%]" />
                    <span className="text-[10px] text-[#8b92a5]">Mon</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-[#1a7fe0]/20 rounded-t-[4px] h-[55%] hover:bg-[#1a7fe0]/30 transition-colors" />
                    <span className="text-[10px] text-[#8b92a5]">Tue</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-[#1a7fe0]/20 rounded-t-[4px] h-[40%] hover:bg-[#1a7fe0]/30 transition-colors" />
                    <span className="text-[10px] text-[#8b92a5]">Wed</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-[#1a7fe0] shadow-[0_0_10px_rgba(26,127,224,0.3)] rounded-t-[4px] h-[85%]" />
                    <span className="text-[10px] text-[#8b92a5]">Thu</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-[#1a7fe0]/20 rounded-t-[4px] h-[45%] hover:bg-[#1a7fe0]/30 transition-colors" />
                    <span className="text-[10px] text-[#8b92a5]">Fri</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-[#1a7fe0]/20 rounded-t-[4px] h-[35%] hover:bg-[#1a7fe0]/30 transition-colors" />
                    <span className="text-[10px] text-[#8b92a5]">Sat</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-[#1a7fe0]/50 rounded-t-[4px] h-[65%] hover:bg-[#1a7fe0]/60 transition-colors" />
                    <span className="text-[10px] text-[#8b92a5]">Sun</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
