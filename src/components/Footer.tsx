import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const footerLinks = {
  product: [
    { to: '/symptom-checker', label: 'Symptom Checker' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/medicine-reminder', label: 'Medicine Reminder' },
    { to: '/stress-tracker', label: 'Stress Tracker' },
    { to: '/health-reports', label: 'Health Reports' },
  ],
  company: [
    { to: '/', label: 'About' },
    { to: '/', label: 'Contact' },
    { to: '/', label: 'Privacy Policy' },
    { to: '/', label: 'Terms of Service' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-background/80 backdrop-blur-lg border-t border-white/10 text-muted mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-semibold transition-transform hover:scale-105 inline-flex">
              <Activity className="w-8 h-8 text-primary" />
              <span className="text-xl tracking-tight">CareSphere</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Your Personal AI Healthcare Assistant. Preventive care, symptom tracking, and wellness management in one premium platform.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <p className="text-sm leading-relaxed text-muted">
              In case of emergency, call 911 or your local emergency services immediately. CareSphere does not replace professional medical advice.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-muted/60">
          &copy; {new Date().getFullYear()} CareSphere. All rights reserved. Healthcare data is encrypted and secure.
        </div>
      </div>
    </footer>
  );
}
