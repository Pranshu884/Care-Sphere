import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, Pill, Brain, TrendingUp, Plus } from 'lucide-react';
import { getMe } from '../lib/auth';

const summaryCards = [
  { to: '/symptom-checker', icon: Stethoscope, label: 'Recent Symptoms', value: 'No recent entries', color: 'primary' },
  { to: '/appointments', icon: Calendar, label: 'Upcoming Appointment', value: 'None scheduled', color: 'purple' },
  { to: '/medicine-reminder', icon: Pill, label: 'Next Medicine', value: 'No reminders set', color: 'teal' },
  { to: '/stress-tracker', icon: Brain, label: 'Stress Status', value: 'Track your mood', color: 'amber' },
];

const quickActions = [
  { to: '/symptom-checker', label: 'Check Symptoms', icon: Stethoscope },
  { to: '/appointments', label: 'Book Appointment', icon: Calendar },
  { to: '/medicine-reminder', label: 'Add Reminder', icon: Pill },
  { to: '/stress-tracker', label: 'Log Stress', icon: Brain },
];

export default function Dashboard() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getMe();
      if (!mounted) return;
      if (res.ok) setUser({ name: res.user.name });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted mt-2 text-lg">Here&apos;s your premium health overview for today.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {summaryCards.map(({ to, icon: Icon, label, value, color }) => (
          <Link
            key={label}
            to={to}
            className="glass-panel p-6 block group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-glow ${
              color === 'primary' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30' :
              color === 'purple' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
              color === 'teal' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted uppercase tracking-wider">{label}</p>
            <p className="font-semibold text-white/90 mt-2 text-xl tracking-tight">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <ActivityTimelineIcon />
              Activity Timeline
            </h2>
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <p className="text-muted mb-4 text-lg">No recent activity. Start by checking your symptoms or booking an appointment.</p>
                <Link
                  to="/symptom-checker"
                  className="glow-button inline-flex mx-auto"
                >
                  <Plus className="w-5 h-5" /> Log your first symptom
                </Link>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Health Trends
            </h2>
            <div className="h-64 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl">
              <div className="text-center text-muted">
                <TrendingUp className="w-16 h-16 mx-auto text-white/10 mb-4" />
                <p className="text-lg">Track symptoms and stress over time to see trends here.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="glass-panel p-8 sticky top-28">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Plus className="w-6 h-6 text-[#00D4FF]" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-white transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-lg">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTimelineIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
      <div className="w-2 h-2 rounded-full bg-teal-400" />
    </div>
  );
}
