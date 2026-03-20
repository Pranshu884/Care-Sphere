import { useState, useEffect } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

const moods = [
  { id: 'great', label: 'Great', icon: Smile, color: 'green' },
  { id: 'good', label: 'Good', icon: Smile, color: 'teal' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'amber' },
  { id: 'low', label: 'Low', icon: Frown, color: 'orange' },
  { id: 'poor', label: 'Poor', icon: Frown, color: 'red' },
];

const wellnessTips = [
  'Take short breaks every hour when working.',
  'Practice deep breathing for 2-3 minutes.',
  'Stay hydrated throughout the day.',
  'Get 7-8 hours of sleep when possible.',
  'Take a short walk outside for fresh air.',
  'Connect with a friend or family member.',
  'Limit screen time before bed.',
  'Try a 5-minute stretching routine.',
];

interface StressEntry {
  id: number;
  mood: string;
  stressLevel: number;
  notes: string;
  date: string;
}

export default function StressTracker() {
  const [entries, setEntries] = useState<StressEntry[]>(() => {
    try {
      const saved = localStorage.getItem('caresphere_stress');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mood, setMood] = useState('');
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    localStorage.setItem('caresphere_stress', JSON.stringify(entries));
  }, [entries]);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood) return;
    setEntries((prev) => [
      ...prev,
      {
        id: Date.now(),
        mood,
        stressLevel,
        notes,
        date: new Date().toISOString().split('T')[0],
      },
    ]);
    setMood('');
    setStressLevel(5);
    setNotes('');
  };

  const avgStress = entries.length > 0
    ? (entries.reduce((a, e) => a + e.stressLevel, 0) / entries.length).toFixed(1)
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Stress Tracker</h1>
      <p className="text-slate-600 mt-1">Log your mood and stress levels to track your wellness over time.</p>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
            <h2 className="font-semibold text-slate-900 mb-4">Log Your Mood</h2>
            <form onSubmit={handleLog} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">How are you feeling?</label>
                <div className="flex flex-wrap gap-2">
                  {moods.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMood(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        mood === id
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stress Level (1-10): {stressLevel}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  placeholder="What's on your mind?"
                />
              </div>
              <button
                type="submit"
                disabled={!mood}
                className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Log Entry
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card">
            <h2 className="font-semibold text-slate-900 mb-4">Stress History</h2>
            {entries.length === 0 ? (
              <p className="text-slate-500">No entries yet. Log your first mood above.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[...entries].reverse().slice(0, 10).map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-medium text-slate-900 capitalize">{e.mood}</span>
                      {e.notes && <span className="text-slate-500 text-sm ml-2">— {e.notes}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">{e.date}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-sm">{e.stressLevel}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-card sticky top-24">
            {avgStress && (
              <div className="mb-6 p-4 rounded-lg bg-teal-50">
                <p className="text-sm text-slate-600">Average Stress (last entries)</p>
                <p className="text-2xl font-bold text-teal-700">{avgStress}/10</p>
              </div>
            )}
            <h2 className="font-semibold text-slate-900 mb-4">Wellness Tips</h2>
            <ul className="space-y-2">
              {wellnessTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="text-teal-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
