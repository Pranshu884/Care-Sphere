import { useState, useEffect } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

const moods = [
  { id: 'great', label: 'Great', icon: Smile },
  { id: 'good', label: 'Good', icon: Smile },
  { id: 'neutral', label: 'Neutral', icon: Meh },
  { id: 'low', label: 'Low', icon: Frown },
  { id: 'poor', label: 'Poor', icon: Frown },
];

const moodColors: Record<string, string> = {
  great: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  good: 'text-primary bg-primary/10 border-primary/30',
  neutral: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  poor: 'text-red-400 bg-red-500/10 border-red-500/30',
};

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
    try { const saved = localStorage.getItem('caresphere_stress'); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [mood, setMood] = useState('');
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');

  useEffect(() => { localStorage.setItem('caresphere_stress', JSON.stringify(entries)); }, [entries]);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood) return;
    setEntries(prev => [...prev, { id: Date.now(), mood, stressLevel, notes, date: new Date().toISOString().split('T')[0] }]);
    setMood(''); setStressLevel(5); setNotes('');
  };

  const avgStress = entries.length > 0
    ? (entries.reduce((a, e) => a + e.stressLevel, 0) / entries.length).toFixed(1)
    : null;

  const stressBarColor = avgStress
    ? Number(avgStress) <= 3 ? 'from-emerald-500 to-emerald-400'
    : Number(avgStress) <= 6 ? 'from-amber-500 to-amber-400'
    : 'from-red-500 to-red-400'
    : 'from-primary to-primary';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-white tracking-tight">Stress Tracker</h1>
      <p className="text-muted mt-1 mb-8">Log your mood and stress levels to track your wellness over time.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Log + History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Log Mood */}
          <div className="glass-panel p-6">
            <h2 className="font-semibold text-white mb-5 text-lg">Log Your Mood</h2>
            <form onSubmit={handleLog} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-3">How are you feeling?</label>
                <div className="flex flex-wrap gap-2">
                  {moods.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMood(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm border transition-all ${
                        mood === id
                          ? moodColors[id]
                          : 'bg-white/5 border-white/10 text-muted hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-3">
                  Stress Level (1–10): <span className="text-white font-bold">{stressLevel}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={e => setStressLevel(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D4FF]"
                />
                <div className="flex justify-between text-xs text-muted/50 mt-1">
                  <span>Low</span><span>High</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Notes <span className="text-muted/60">(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="premium-input resize-none"
                  placeholder="What's on your mind?"
                />
              </div>

              <button
                type="submit"
                disabled={!mood}
                className="glow-button px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Log Entry
              </button>
            </form>
          </div>

          {/* Stress History */}
          <div className="glass-panel p-6">
            <h2 className="font-semibold text-white mb-4 text-lg">Stress History</h2>
            {entries.length === 0 ? (
              <p className="text-muted text-sm">No entries yet. Log your first mood above.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[...entries].reverse().slice(0, 10).map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-0">
                    <div>
                      <span className={`text-sm font-bold capitalize px-2 py-0.5 rounded-full border ${moodColors[e.mood] || 'text-muted'}`}>{e.mood}</span>
                      {e.notes && <span className="text-muted text-xs ml-2">— {e.notes}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted/60">{e.date}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted text-xs font-bold">{e.stressLevel}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats + Tips */}
        <div>
          <div className="glass-panel p-6 sticky top-24">
            {avgStress && (
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">Avg. Stress Level</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stressBarColor} bg-clip-text text-transparent`}>{avgStress}<span className="text-lg text-muted">/10</span></p>
              </div>
            )}
            <h2 className="font-semibold text-white mb-4">Wellness Tips</h2>
            <ul className="space-y-2.5">
              {wellnessTips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-muted">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
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
