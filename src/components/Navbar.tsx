import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Menu, X, Shield, ChevronDown } from 'lucide-react';
import { logoutUser } from '../lib/auth';

const guestLinks = [
  { to: '/', label: 'Home' },
];

const patientLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/symptom-checker', label: 'Symptoms' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/medicine-reminder', label: 'Reminders' },
  { to: '/stress-tracker', label: 'Stress' },
  { to: '/health-reports', label: 'Reports' },
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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  let currentLinks = patientLinks;
  if (!isLoggedIn) {
    currentLinks = guestLinks;
  } else if (role === 'admin') {
    currentLinks = adminLinks;
  } else if (role === 'doctor') {
    currentLinks = [{ to: '/doctor', label: 'Doctor Dashboard' }];
  }

  const handleLogout = () => {
    logoutUser();
  };

  const getHomeRoute = () => {
    if (!isLoggedIn) return '/';
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'doctor') return '/doctor/dashboard';
    return '/dashboard';
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0f1117]/80 backdrop-blur-[12px] border-b border-[#1e2130]' : 'bg-[#0f1117] border-b border-transparent'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={getHomeRoute()} className="flex items-center gap-3 text-primary font-semibold transition-transform hover:scale-105">
            <Activity className="w-7 h-7 text-[#00BCD4]" />
            <span className="text-xl tracking-tight text-white">CareSphere</span>
          </Link>

          <div className="hidden lg:flex items-center h-16 gap-1">
            {currentLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 h-full flex items-center text-sm font-medium transition-all duration-150 border-b-2 
                    ${isActive 
                      ? 'text-[#00BCD4] border-[#00BCD4]' 
                      : 'text-gray-400 border-transparent hover:text-[#00BCD4]'}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center h-16 gap-5">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-[#00BCD4] transition-colors duration-150 text-sm font-medium focus:outline-none"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[#00BCD4] hover:bg-[#00a5bb] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="flex items-center h-full gap-5">
                {role === 'user' && (
                  <Link
                    to="/appointments"
                    className="bg-[#00BCD4] hover:bg-[#00a5bb] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none"
                  >
                    Book Appointment
                  </Link>
                )}



                {role === 'admin' ? (
                  <div className="relative group cursor-pointer flex items-center h-full">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4860a]/10 border border-[#d4860a]/20 transition-colors group-hover:border-[#d4860a]/40 focus:outline-none">
                      <Shield className="w-4 h-4 text-[#d4860a]" />
                      <span className="text-[13px] font-medium text-[#d4860a]">Admin Panel</span>
                    </div>
                    
                    <div className="absolute right-0 top-[100%] w-48 bg-[#13151e] border border-[#1e2130] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 origin-top-right overflow-hidden focus:outline-none">
                      <div className="p-1.5 flex flex-col">
                        <Link to="/profile" className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">My Profile</Link>
                        <div className="h-px w-full bg-[#1e2130] my-1" />
                        <button onClick={handleLogout} className="px-3 py-2 text-sm text-left text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors w-full focus:outline-none">Logout</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative group cursor-pointer flex items-center h-full">
                    <div className="flex items-center gap-2 focus:outline-none">
                      <div className="w-8 h-8 rounded-full bg-[#1a7fe0]/20 flex items-center justify-center text-[#1a7fe0] text-xs font-medium border border-[#1a7fe0]/30 shadow-inner">
                        {getInitials(userName)}
                      </div>
                      <span className="text-sm font-medium text-white/90">
                        {userName.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>

                    <div className="absolute right-0 top-[100%] w-48 bg-[#13151e] border border-[#1e2130] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 origin-top-right overflow-hidden focus:outline-none">
                      <div className="p-1.5 flex flex-col">
                        <Link to="/profile" className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">My Profile</Link>
                        <div className="h-px w-full bg-[#1e2130] my-1" />
                        <button onClick={handleLogout} className="px-3 py-2 text-sm text-left text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors w-full focus:outline-none">Logout</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-[#1e2130] bg-[#0f1117]/95 backdrop-blur-xl absolute top-16 left-0 w-full shadow-2xl">
            <div className="flex flex-col gap-1 px-4">
              {currentLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 rounded-lg transition-colors duration-150 font-medium
                      ${isActive ? 'bg-[#00BCD4]/10 text-[#00BCD4]' : 'text-gray-400 hover:bg-white/5 hover:text-[#00BCD4]'}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="border-t border-[#1e2130] mt-2 pt-4 flex flex-col gap-2">
                {!isLoggedIn ? (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-gray-400 hover:text-[#00BCD4] rounded-lg transition-colors font-medium">
                      Login
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="bg-[#00BCD4] hover:bg-[#00a5bb] text-white text-center py-3 rounded-md font-medium mt-2 transition-colors">
                      Get Started
                    </Link>
                  </>
                ) : (
                  <>
                    {role === 'user' && (
                      <Link to="/appointments" onClick={() => setMobileOpen(false)} className="bg-[#00BCD4] hover:bg-[#00a5bb] text-white text-center py-3 rounded-md font-medium mb-2 transition-colors">
                        Book Appointment
                      </Link>
                    )}
                    <div className="flex items-center gap-3 px-4 py-2">
                      {role === 'admin' ? (
                        <div className="w-[30px] h-[30px] rounded-full bg-[#2e1e08] flex items-center justify-center text-[#d4860a] text-[11px] font-medium border border-[#d4860a]/30">
                          {getInitials(userName)}
                        </div>
                      ) : (
                        <div className="w-[30px] h-[30px] rounded-full bg-[#1a7fe0]/20 flex items-center justify-center text-[#1a7fe0] text-[11px] font-medium border border-[#1a7fe0]/30">
                          {getInitials(userName)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-white/90">{userName.split(' ')[0]}</span>
                    </div>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">My Profile</Link>
                    <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="px-4 py-3 text-left text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors w-full focus:outline-none">Logout</button>
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
