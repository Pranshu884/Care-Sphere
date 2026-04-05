import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Stethoscope, Calendar, Pill, Brain, FileText, User } from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/symptom-checker', label: 'Symptom Checker', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', icon: Calendar },
  { to: '/medicine-reminder', label: 'Medicine Reminder', icon: Pill },
  { to: '/stress-tracker', label: 'Stress Tracker', icon: Brain },
  { to: '/health-reports', label: 'Health Reports', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 min-h-[calc(100vh-4rem)] bg-white/[0.02] border-r border-white/10 hidden lg:block flex-shrink-0">
      <nav className="p-3 space-y-1 sticky top-16">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20'
                  : 'text-muted hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
