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
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('caresphere_token');
    localStorage.removeItem('caresphere_user');
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-teal-600 font-semibold">
            <Activity className="w-8 h-8" />
            <span className="text-xl">CareSphere</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-slate-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-slate-200 mt-2 pt-2 flex flex-col gap-1">
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-600 hover:bg-teal-50 rounded-lg">
                      Login
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="px-4 py-3 bg-teal-600 text-white rounded-lg text-center">
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
