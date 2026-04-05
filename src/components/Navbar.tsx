import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/symptom-checker', label: 'Symptom Checker' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/medicine-reminder', label: 'Medicine Reminder' },
  { to: '/stress-tracker', label: 'Stress Tracker' },
  { to: '/health-reports', label: 'Health Reports' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem('caresphere_token');
  const userStr = localStorage.getItem('caresphere_user');
  let role = 'user';
  try {
    if (userStr) role = JSON.parse(userStr).role || 'user';
  } catch (e) {}
  const navigate = useNavigate();

  const currentLinks = role === 'admin' 
    ? [{ to: '/admin', label: 'Admin Panel' }] 
    : role === 'doctor'
    ? [{ to: '/doctor', label: 'Doctor Dashboard' }]
    : navLinks;

  const handleLogout = () => {
    localStorage.removeItem('caresphere_token');
    localStorage.removeItem('caresphere_user');
    navigate('/');
    setMobileOpen(false);
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
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-all duration-300"
              >
                Logout
              </button>
            ) : (
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
              <div className="border-t border-white/10 mt-2 pt-2 flex flex-col gap-2">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      Login
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="glow-button w-full text-center mt-2">
                      Get Started
                    </Link>
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
