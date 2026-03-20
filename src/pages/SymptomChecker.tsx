import { useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';

const symptomSuggestions = ['Headache', 'Fever', 'Fatigue', 'Cough', 'Nausea', 'Dizziness', 'Chest pain', 'Shortness of breath', 'Stomach pain', 'Sore throat'];
const severityLevels = ['Mild', 'Moderate', 'Severe'];
const durations = ['Less than 1 day', '1-3 days', '4-7 days', '1-2 weeks', 'More than 2 weeks'];

export default function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [duration, setDuration] = useState('');
  const [results, setResults] = useState<{ conditions: string[]; risk: string; steps: string[] } | null>(null);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addCustomSymptom = () => {
    const trimmed = search.trim();
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      setSelectedSymptoms((prev) => [...prev, trimmed]);
      setSearch('');
    }
  };

  const handleAnalyze = () => {
    if (selectedSymptoms.length === 0) return;
    setResults({
      conditions: ['Possible causes based on your symptoms. Consult a healthcare professional for diagnosis.'],
      risk: severity === 'Severe' ? 'high' : severity === 'Moderate' ? 'medium' : 'low',
      steps: [
        'Rest and stay hydrated',
        'Monitor your symptoms',
        'Seek medical care if symptoms worsen or persist',
        'Do not use this tool as a substitute for professional diagnosis',
      ],
    });
  };

  return (
    <div className="relative p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22640%22 viewBox=%220 0 640 640%22%3E%3Cg fill=%22none%22 stroke=%22%230d9488%22 stroke-opacity=%220.12%22 stroke-width=%222%22%3E%3Cpath d=%22M320 40v560%22/%3E%3Cpath d=%22M40 320h560%22/%3E%3Cpath d=%22M180 180c60-60 220-60 280 0s60 220 0 280-220 60-280 0-60-220 0-280z%22/%3E%3C/g%3E%3C/svg%3E')] bg-cover opacity-30 pointer-events-none"
      />

      <h1 className="text-2xl font-bold text-slate-900">Symptom Checker</h1>
      <p className="text-slate-600 mt-1">Describe your symptoms for non-diagnostic insights. Always consult a healthcare provider for medical advice.</p>

      <div className="mt-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
          <h2 className="font-semibold text-slate-900 mb-4">Select Symptoms</h2>
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search or type a symptom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSymptom())}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={addCustomSymptom}
              disabled={!search.trim()}
              className="px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={selectedSymptoms.length === 0}
              className="px-6 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Insights
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {symptomSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSymptoms.includes(s)
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {selectedSymptoms.length > 0 && (
            <p className="mt-4 text-sm text-slate-500">Selected: {selectedSymptoms.join(', ')}</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
            <h2 className="font-semibold text-slate-900 mb-4">Severity</h2>
            <div className="space-y-2">
              {severityLevels.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    value={s}
                    checked={severity === s}
                    onChange={() => setSeverity(s)}
                    className="text-teal-600"
                  />
                  <span className="text-slate-700">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
            <h2 className="font-semibold text-slate-900 mb-4">Duration</h2>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select duration</option>
              {durations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {results && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Medical Disclaimer:</strong> This tool provides general information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider.
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Possible Conditions</h2>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                {results.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Risk Level</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                results.risk === 'high' ? 'bg-red-100 text-red-700' :
                results.risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                {results.risk.charAt(0).toUpperCase() + results.risk.slice(1)}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Suggested Next Steps</h2>
              <ul className="space-y-2">
                {results.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-600 font-medium">{i + 1}.</span>
                    <span className="text-slate-700">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
