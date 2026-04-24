import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getMe, logoutUser } from '../lib/auth';
import {
  Stethoscope, Calendar, Pill, FileText,
  Shield, Zap, UserCheck, Lock,
  ChevronRight, ArrowRight, Activity,
  HeartPulse, Star,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────── */

const trustItems = [
  { icon: Shield, label: 'Secure & Encrypted' },
  { icon: Zap, label: 'AI-Powered' },
  { icon: UserCheck, label: 'Doctor-Backed' },
  { icon: Lock, label: 'Privacy-First' },
];

const features = [
  {
    icon: Stethoscope,
    title: 'Symptom Checker',
    desc: 'AI-guided triage that tells you exactly what to do next.',
    href: '/symptom-checker',
  },
  {
    icon: Calendar,
    title: 'Doctor Appointments',
    desc: 'Find and book verified doctors in minutes.',
    href: '/appointments',
  },
  {
    icon: Pill,
    title: 'Medicine Reminders',
    desc: 'Never miss a dose with smart medication alerts.',
    href: '/medicine-reminder',
  },
  {
    icon: FileText,
    title: 'Health Reports',
    desc: 'Store, access and share your health documents securely.',
    href: '/health-reports',
  },
];

const steps = [
  { num: '01', title: 'Enter Symptoms', desc: 'Describe how you feel in plain language.' },
  { num: '02', title: 'Get AI Insights', desc: 'Receive a triage result with urgency guidance.' },
  { num: '03', title: 'Book a Doctor', desc: 'Connect instantly with the right specialist.' },
  { num: '04', title: 'Track Your Health', desc: 'Monitor progress over time in your dashboard.' },
];

const testimonials = [
  {
    quote: "CareSphere flagged my symptoms as urgent. I went to the ER and it saved my life.",
    name: 'Priya S.',
    role: 'Patient',
  },
  {
    quote: "Booking my cardiologist used to take days. Now it takes 2 minutes.",
    name: 'Rahul M.',
    role: 'Working Professional',
  },
  {
    quote: "Finally a health app that doesn't overwhelm you. Clean, fast, and actually useful.",
    name: 'Ananya K.',
    role: 'College Student',
  },
];

/* ─── Decorative mock dashboard ───────────────────────── */
function MockDashboard() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glow backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/20 via-purple-500/10 to-transparent rounded-3xl blur-3xl" />

      {/* Card */}
      <div className="relative glass-panel p-6 space-y-4">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#00D4FF]" />
            <span className="text-white font-bold text-sm">CareSphere Dashboard</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Heart Rate', val: '72 bpm', color: 'text-[#00D4FF]' },
            { label: 'Stress', val: '3 / 10', color: 'text-emerald-400' },
            { label: 'Appointments', val: '2 today', color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Activity bars */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-widest">Weekly Activity</p>
          <div className="flex items-end gap-1.5 h-12">
            {[40, 70, 55, 90, 65, 80, 45].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-[#00D4FF]/60 to-[#00D4FF]/20"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted/50">
            {['M','T','W','T','F','S','S'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* Recent alert */}
        <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Activity className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-400">Triage Result</p>
            <p className="text-[10px] text-muted">Moderate urgency — book a GP appointment</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('caresphere_token');
    if (token) {
      getMe().then(res => {
        if (res.ok) {
          const role = localStorage.getItem('role') || 'user';
          if (role === 'admin') navigate('/admin/dashboard');
          else if (role === 'doctor') navigate('/doctor/dashboard');
          else navigate('/dashboard');
        } else {
          logoutUser();
        }
      });
    }
  }, [navigate]);

  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center pt-24 pb-20 px-6 overflow-hidden">
        {/* Radial glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#00D4FF]/[0.07] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-500/[0.06] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left – Text */}
          <div>
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/5 text-[#00D4FF] text-xs font-bold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
              AI Healthcare Platform
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6">
              Your Personal{' '}
              <span className="bg-gradient-to-r from-[#00D4FF] via-blue-400 to-violet-400 bg-clip-text text-transparent">
                AI Healthcare
              </span>{' '}
              Assistant
            </h1>

            <p className="text-lg text-muted leading-relaxed max-w-lg mb-10">
              Track symptoms, book doctors, manage medications, and get AI-powered health
              insights — all in one platform.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="glow-button px-7 py-3.5 text-base font-bold"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/symptom-checker"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/5 text-white font-bold text-base hover:bg-white/10 hover:border-white/25 transition-all duration-300"
              >
                Check Symptoms <ChevronRight className="w-5 h-5 text-muted" />
              </Link>
            </div>

            {/* Micro-stats */}
            <div className="flex flex-wrap gap-8 mt-12">
              {[['10,000+', 'Users'], ['50+', 'Verified Doctors'], ['4.9★', 'Rating']].map(([val, lbl]) => (
                <div key={lbl}>
                  <p className="text-2xl font-black text-white">{val}</p>
                  <p className="text-xs text-muted mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right – Mock Dashboard */}
          <div className="hidden lg:block">
            <MockDashboard />
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          2. TRUST BAR
      ══════════════════════════════════════════ */}
      <section className="border-y border-white/10 bg-white/[0.02] py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            <p className="text-sm font-bold text-muted uppercase tracking-widest shrink-0">Trusted by 10,000+ users</p>
            <div className="w-px h-5 bg-white/10 hidden sm:block" />
            {trustItems.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-muted text-sm font-medium">
                <Icon className="w-4 h-4 text-[#00D4FF]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          3. FEATURES (4 cards only)
      ══════════════════════════════════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#00D4FF] uppercase tracking-[0.2em] mb-3">Features</p>
            <h2 className="text-4xl font-black text-white tracking-tight">Everything you need,<br />nothing you don't.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, href }) => (
              <Link
                key={title}
                to={href}
                className="glass-panel p-6 group block hover:border-[#00D4FF]/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF] flex items-center justify-center mb-5 group-hover:bg-[#00D4FF]/20 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
                <div className="mt-5 flex items-center gap-1 text-[#00D4FF] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          4. HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#00D4FF] uppercase tracking-[0.2em] mb-3">How It Works</p>
            <h2 className="text-4xl font-black text-white tracking-tight">From symptom to solved,<br />in four steps.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connector line (desktop) */}
            <div className="absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent hidden lg:block pointer-events-none" />

            {steps.map(({ num, title, desc }) => (
              <div key={num} className="glass-panel p-6 text-center relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-purple-500/20 border border-[#00D4FF]/30 text-[#00D4FF] font-black text-sm mb-5 mx-auto">
                  {num}
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          5. PRODUCT SHOWCASE
      ══════════════════════════════════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <div>
            <p className="text-xs font-bold text-[#00D4FF] uppercase tracking-[0.2em] mb-4">AI Triage Engine</p>
            <h2 className="text-4xl font-black text-white tracking-tight leading-tight mb-6">
              AI Symptom Analysis that actually{' '}
              <span className="bg-gradient-to-r from-[#00D4FF] to-violet-400 bg-clip-text text-transparent">
                guides your next step.
              </span>
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-8">
              Don't just Google your symptoms. CareSphere's triage engine classifies
              urgency — Emergency, Urgent, Moderate, or Low — and tells you exactly
              what to do, from home care tips to the nearest ER.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                'Deterministic rule-based triage (no hallucinations)',
                'Condition-specific red flag warnings',
                'Instant routing to doctors or hospitals',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link to="/symptom-checker" className="glow-button px-6 py-3 text-sm font-bold inline-flex">
              Try Symptom Checker <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right – mini symptom checker preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-[#00D4FF]/10 rounded-3xl blur-3xl" />
            <div className="relative glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-[#00D4FF]" />
                <span className="text-white font-bold text-sm">AI Triage Result</span>
              </div>

              {/* Urgency badge */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <p className="text-amber-400 font-bold text-sm">Moderate Urgency</p>
                  <p className="text-muted text-xs mt-0.5">See a doctor within 24–48 hours</p>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <p className="text-xs text-muted font-semibold uppercase tracking-wider">Possible Conditions</p>
                {[
                  { name: 'Tension Headache', conf: 'Most likely', pct: 78 },
                  { name: 'Migraine', conf: 'Possible', pct: 45 },
                ].map(c => (
                  <div key={c.name} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-white text-xs font-bold">{c.name}</span>
                      <span className="text-[10px] text-muted">{c.conf}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1">
                      <div className="h-1 rounded-full bg-gradient-to-r from-[#00D4FF] to-blue-500" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-2">
                <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF]/20 to-blue-500/20 border border-[#00D4FF]/30 text-center text-sm font-bold text-[#00D4FF]">
                  Book a Doctor Appointment →
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          6. TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#00D4FF] uppercase tracking-[0.2em] mb-3">Testimonials</p>
            <h2 className="text-4xl font-black text-white tracking-tight">Real people. Real outcomes.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map(({ quote, name, role }) => (
              <div key={name} className="glass-panel p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed italic flex-1">"{quote}"</p>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D4FF]/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{name}</p>
                    <p className="text-muted text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          7. FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-[#00D4FF]/[0.06] rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF] mb-8 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
            <HeartPulse className="w-8 h-8" />
          </div>

          <h2 className="text-5xl font-black text-white tracking-tight mb-5">
            Take control of your<br />
            <span className="bg-gradient-to-r from-[#00D4FF] to-violet-400 bg-clip-text text-transparent">
              health today.
            </span>
          </h2>

          <p className="text-muted text-xl mb-10">
            Join thousands of users managing their health smarter with CareSphere.
          </p>

          <Link to="/register" className="glow-button px-10 py-4 text-lg font-black inline-flex mx-auto">
            Start Free Now <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="text-muted/50 text-xs mt-5">No credit card required. Free forever.</p>
        </div>
      </section>

    </div>
  );
}
