import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, Pill, Brain, TrendingUp, Plus } from 'lucide-react';
import { getMe } from '../lib/auth';

const summaryCards = [
  { to: '/symptom-checker', icon: Stethoscope, label: 'Recent Symptoms', value: 'No recent entries', color: 'teal' },
  { to: '/appointments', icon: Calendar, label: 'Upcoming Appointment', value: 'None scheduled', color: 'primary' },
  { to: '/medicine-reminder', icon: Pill, label: 'Next Medicine', value: 'No reminders set', color: 'green' },
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-slate-600 mt-1">Here&apos;s your health overview for today.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map(({ to, icon: Icon, label, value, color }) => (
          <Link
            key={label}
            to={to}
            className="block p-5 bg-white rounded-xl border border-slate-100 shadow-card hover:shadow-soft hover:border-teal-100 transition-all"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
              color === 'teal' ? 'bg-teal-100 text-teal-600' :
              color === 'primary' ? 'bg-primary-100 text-primary-600' :
              color === 'green' ? 'bg-green-100 text-green-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-medium text-slate-900 mt-1">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
            <h2 className="font-semibold text-slate-900 mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              <p className="text-slate-500 text-sm">No recent activity. Start by checking your symptoms or booking an appointment.</p>
              <Link
                to="/symptom-checker"
                className="inline-flex items-center gap-2 text-teal-600 font-medium hover:underline"
              >
                <Plus className="w-4 h-4" /> Log your first symptom
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
            <h2 className="font-semibold text-slate-900 mb-4">Health Trends</h2>
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center text-slate-500">
                <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">Track symptoms and stress over time to see trends here.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card sticky top-24">
            <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 text-slate-700 hover:text-teal-700 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
