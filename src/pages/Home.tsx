import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, Pill, Brain, BarChart3, ChevronRight, Shield, Heart } from 'lucide-react';

const features = [
  {
    icon: Stethoscope,
    title: 'AI Symptom Analysis',
    description: 'Get intelligent insights based on your symptoms. Our AI assists in understanding potential causes while recommending when to seek professional care.',
  },
  {
    icon: Calendar,
    title: 'Appointment Booking',
    description: 'Schedule and manage doctor appointments with ease. View upcoming visits and keep your healthcare calendar organized.',
  },
  {
    icon: Pill,
    title: 'Medication Management',
    description: 'Never miss a dose. Set reminders for your medications with customizable timing and dosage tracking.',
  },
  {
    icon: Brain,
    title: 'Stress & Wellness Tracking',
    description: 'Monitor your stress levels and mood over time. Receive personalized wellness tips to support your mental health.',
  },
  {
    icon: BarChart3,
    title: 'Health Insights Dashboard',
    description: 'Visualize your health trends, symptom history, and progress in one comprehensive overview.',
  },
];

const steps = [
  { num: 1, title: 'Create Account', desc: 'Sign up in seconds with your email' },
  { num: 2, title: 'Enter Symptoms', desc: 'Describe how you feel when needed' },
  { num: 3, title: 'Receive Insights', desc: 'Get AI-powered health guidance' },
  { num: 4, title: 'Manage Health Activities', desc: 'Book appointments, set reminders' },
  { num: 5, title: 'Track Progress', desc: 'Monitor your wellness journey' },
];

const testimonials = [
  {
    quote: 'CareSphere has transformed how I manage my health. The symptom checker helps me understand when to take action, and the medication reminders are a lifesaver.',
    author: 'Sarah M.',
    location: 'Chicago',
  },
  {
    quote: 'Finally, a healthcare app that feels designed for real people. Clean, fast, and actually helpful. The stress tracker has helped me become more mindful.',
    author: 'James K.',
    location: 'Austin',
  },
  {
    quote: 'The appointment booking is seamless, and having all my health information in one place gives me peace of mind. Highly recommend CareSphere.',
    author: 'Maria L.',
    location: 'Seattle',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-primary-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2314b8a6\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
              Your Personal AI Healthcare Assistant
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600">
              Take control of your preventive health. Track symptoms, manage medications, schedule appointments, and gain insights—all in one trusted platform designed for your wellbeing.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-soft"
              >
                Get Started
              </Link>
              <Link
                to="/symptom-checker"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-600 font-medium rounded-lg border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-colors"
              >
                Check Symptoms
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Everything You Need for Better Health</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              CareSphere brings together the tools you need to stay on top of your health—from symptom analysis to wellness tracking.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-soft hover:border-teal-100 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-slate-600 text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How CareSphere Works</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Get started in minutes and begin your journey toward proactive health management.
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex items-start gap-4 flex-1 min-w-[200px] max-w-[240px]">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
                  {num}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-teal-600 font-medium hover:underline"
            >
              Create your free account <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Trusted by Health-Conscious Users</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Join thousands who use CareSphere to stay proactive about their health.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map(({ quote, author, location }) => (
              <div key={author} className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-700 italic">&ldquo;{quote}&rdquo;</p>
                <p className="mt-4 font-medium text-slate-900">{author}</p>
                <p className="text-sm text-slate-500">{location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Support Banner */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Medical Emergency?</h3>
              <p className="text-sm text-slate-600">CareSphere is not a substitute for emergency care. Call 911 or your local emergency number immediately if you or someone else is in danger.</p>
            </div>
          </div>
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Heart className="w-4 h-4" /> Call Emergency
          </a>
        </div>
      </section>
    </div>
  );
}
