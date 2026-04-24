import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Menu, X, Shield, Bell, ChevronDown } from 'lucide-react';
import { logoutUser } from '../lib/auth';

const patientLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/symptom-checker', label: 'Symptom Checker' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/medicine-reminder', label: 'Medicine Reminder' },
  { to: '/stress-tracker', label: 'Stress Tracker' },
  { to: '/health-reports', label: 'Health Reports' },
  { to: '/profile', label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/doctors', label: 'Doctors' },
  { to: '/admin/appointments', label: 'Appointments' },
];

function getInitials(name: string) {
  if (!name || name.trim() === '') return 'U';
  return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem('caresphere_token');
  const userStr = localStorage.getItem('caresphere_user');
  
  let role = 'user';
  let userName = '';
  try {
    if (userStr) {
      const p = JSON.parse(userStr);
      role = p.role || 'user';
      userName = p.name || '';
    }
  } catch (e) {}

  const currentLinks = role === 'admin' 
    ? adminLinks 
    : role === 'doctor'
    ? [{ to: '/doctor', label: 'Doctor Dashboard' }]
    : patientLinks;

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/50 backdrop-blur-lg border-b border-white/10 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-primary font-semibold transition-transform hover:scale-105">
            <Activity className="w-8 h-8" />
            <span className="text-xl tracking-tight">CareSphere</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {currentLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-muted hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-muted hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="glow-button text-sm"
                >
                  Get Started
                </Link>
              </>
            ) : role === 'admin' ? (
              <div className="flex items-center gap-4 relative group cursor-pointer py-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4860a]/10 border border-[#d4860a]/20 transition-colors group-hover:border-[#d4860a]/40">
                  <Shield className="w-4 h-4 text-[#d4860a]" />
                  <span className="text-[13px] font-medium text-[#d4860a]">Admin Panel</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-[30px] h-[30px] rounded-full bg-[#2e1e08] flex items-center justify-center text-[#d4860a] text-[11px] font-medium border border-[#d4860a]/30">
                    {getInitials(userName)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted group-hover:text-white transition-colors" />
                </div>

                <div className="absolute right-0 top-[100%] w-48 bg-[#0B0F19] border border-[#1e2130] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 origin-top-right overflow-hidden">
                  <div className="p-2 flex flex-col">
                    <Link to="/profile" className="px-3 py-2 text-sm text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">My Profile</Link>
                    <div className="h-px w-full bg-[#1e2130] my-1" />
                    <button onClick={handleLogout} className="px-3 py-2 text-sm text-left text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors w-full">Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 relative group cursor-pointer py-2">
                <button className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-full transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-background"></span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-[30px] h-[30px] rounded-full bg-[#1a7fe0]/20 flex items-center justify-center text-[#1a7fe0] text-[11px] font-medium border border-[#1a7fe0]/30 shadow-inner">
                    {getInitials(userName)}
                  </div>
                  <span className="text-[14px] font-medium text-white/90">
                    {userName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted group-hover:text-white transition-colors ml-1" />
                </div>

                <div className="absolute right-0 top-[100%] w-48 bg-[#0B0F19] border border-[#1e2130] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 origin-top-right overflow-hidden">
                  <div className="p-2 flex flex-col">
                    <Link to="/profile" className="px-3 py-2 text-sm text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">My Profile</Link>
                    <div className="h-px w-full bg-[#1e2130] my-1" />
                    <button onClick={handleLogout} className="px-3 py-2 text-sm text-left text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors w-full">Logout</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-muted hover:bg-white/5 hover:text-white rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-white/10 bg-[#0B0F19]/95 backdrop-blur-xl absolute top-16 left-0 w-full shadow-2xl">
            <div className="flex flex-col gap-1 px-4">
              {currentLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-muted hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-[#1e2130] mt-2 pt-2 flex flex-col gap-2">
                {!isLoggedIn ? (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      Login
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="glow-button w-full text-center mt-2">
                      Get Started
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      {role === 'admin' ? (
                        <div className="w-[30px] h-[30px] rounded-full bg-[#2e1e08] flex items-center justify-center text-[#d4860a] text-[11px] font-medium border border-[#d4860a]/30">
                          {getInitials(userName)}
                        </div>
                      ) : (
                        <div className="w-[30px] h-[30px] rounded-full bg-[#1a7fe0]/20 flex items-center justify-center text-[#1a7fe0] text-[11px] font-medium border border-[#1a7fe0]/30">
                          {getInitials(userName)}
                        </div>
                      )}
                      <span className="text-[14px] font-medium text-white/90">{userName.split(' ')[0]}</span>
                    </div>
                    {role === 'admin' ? (
                      <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">My Profile</Link>
                    ) : (
                      <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">My Profile</Link>
                    )}
                    <button onClick={handleLogout} className="px-4 py-3 text-left text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors w-full">Logout</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
