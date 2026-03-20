import { useState } from 'react';
import { Download, Stethoscope, Calendar, Pill, Brain } from 'lucide-react';

const reportSections = [
  {
    icon: Stethoscope,
    title: 'Symptom History',
    desc: 'Overview of symptoms logged over time. Track patterns and recurrence.',
  },
  {
    icon: Calendar,
    title: 'Appointment History',
    desc: 'Record of past and upcoming doctor visits.',
  },
  {
    icon: Pill,
    title: 'Medication Adherence',
    desc: 'Summary of medication reminders and compliance.',
  },
  {
    icon: Brain,
    title: 'Stress Trends',
    desc: 'Mood and stress level trends over time.',
  },
];

export default function HealthReports() {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    const data = {
      generated: new Date().toISOString(),
      symptomHistory: 'No symptom data recorded.',
      appointmentHistory: 'No appointments recorded.',
      medicationAdherence: 'No medication reminders set.',
      stressTrends: 'No stress entries recorded.',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caresphere-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Reports</h1>
          <p className="text-slate-600 mt-1">Comprehensive overview of your health data</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-70"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="space-y-6">
        {reportSections.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{title}</h2>
                <p className="text-slate-600 text-sm mt-1">{desc}</p>
                <div className="mt-4 p-4 rounded-lg bg-slate-50 text-slate-500 text-sm">
                  Data will appear here as you use CareSphere. Log symptoms, book appointments, set medication reminders, and track stress to build your report.
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Note:</strong> Health reports are for personal reference only. Share with healthcare providers as needed. Data is stored locally and can be exported in JSON format.
        </p>
      </div>
    </div>
  );
}
