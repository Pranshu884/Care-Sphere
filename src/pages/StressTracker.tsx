import { useState, useEffect, useMemo } from 'react';
import { Wind, Activity, TrendingUp, Calendar as CalIcon, Flame, HeartPulse, Brain, X, AlertCircle, Target, PlayCircle } from 'lucide-react';

/* ─── Definitions ────────────────────────────────────────────── */
const MOODS = [
  { id: 'great', label: 'Great', emoji: '😊', color: 'emerald', message: "That's wonderful to hear!" },
  { id: 'good', label: 'Good', emoji: '🙂', color: 'blue', message: "Keep up the good momentum!" },
  { id: 'okay', label: 'Okay', emoji: '😐', color: 'amber', message: "Steady and balanced." },
  { id: 'stressed', label: 'Stressed', emoji: '😟', color: 'orange', message: "Take a deep breath." },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😣', color: 'red', message: "We're here for you. Let's decompress." },
];

const CONTEXT_TAGS = ['Work', 'Sleep', 'Health', 'Relationships', 'Finance', 'Exercise', 'Family', 'Exams', 'Personal'];

interface StressEntry {
  id: number;
  mood: string;
  stressLevel: number;
  notes: string;
  date: string;
  timeTag: string;
  contextTags: string[];
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function getSystemTimeTag() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function getStressZone(lvl: number) {
  if (lvl <= 3) return { type: 'low', color: 'emerald', label: 'Low Stress', desc: 'Calm and relaxed' };
  if (lvl <= 6) return { type: 'mod', color: 'amber', label: 'Moderate', desc: 'Slightly elevated' };
  return { type: 'high', color: 'red', label: 'High Stress', desc: 'Critical tension' };
}

/* ══════════════════════════════════════════════════════════
   BREATHING EXERCISE OVERLAY
══════════════════════════════════════════════════════════ */
function BreathingExercise({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [timer, setTimer] = useState(4);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    let currentPhase = phase;
    let ticks = timer;

    const interval = setInterval(() => {
      ticks--;
      if (ticks > 0) {
        setTimer(ticks);
      } else {
        if (currentPhase === 'Inhale') { currentPhase = 'Hold'; ticks = 7; }
        else if (currentPhase === 'Hold') { currentPhase = 'Exhale'; ticks = 8; }
        else { currentPhase = 'Inhale'; ticks = 4; }
        setPhase(currentPhase);
        setTimer(ticks);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [active, phase, timer]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#131928] border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-white bg-white/5 rounded-full transition z-10"><X className="w-5 h-5"/></button>
        
        <div className="mb-6 relative z-10">
          <Wind className="w-10 h-10 text-[#00D4FF] mx-auto mb-2 opacity-50" />
          <h2 className="text-2xl font-black text-white">4-7-8 Breathing</h2>
          <p className="text-[#94A3B8] text-sm mt-1">A simple technique to rapidly reduce physical tension.</p>
        </div>

        {!active ? (
          <div className="py-10">
            <button onClick={() => setActive(true)} className="w-24 h-24 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 flex items-center justify-center mx-auto hover:bg-[#00D4FF]/20 transition-all shadow-[0_0_30px_rgba(0,212,255,0.2)]">
              <PlayCircle className="w-10 h-10" />
            </button>
            <p className="mt-6 text-[#94A3B8] font-medium text-sm tracking-wide uppercase">Start Session</p>
          </div>
        ) : (
          <div className="py-12 relative flex items-center justify-center">
            {/* Animated circle */}
            <div className={`absolute rounded-full border-4 transition-all ease-in-out duration-1000 ${
              phase === 'Inhale' ? 'w-48 h-48 border-[#00D4FF]/50 scale-125' : 
              phase === 'Hold' ? 'w-48 h-48 border-amber-500/50 scale-125 animate-pulse' : 
              'w-32 h-32 border-emerald-500/50 scale-100'
            }`} />
            
            <div className="relative z-10">
              <h3 className={`text-4xl font-black tracking-widest uppercase transition-colors duration-500 ${
                phase === 'Inhale' ? 'text-[#00D4FF]' : phase === 'Hold' ? 'text-amber-400' : 'text-emerald-400'
              }`}>{phase}</h3>
              <p className="text-5xl font-black text-white mt-4">{timer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════════════════ */
export default function StressTracker() {
  const [entries, setEntries] = useState<StressEntry[]>(() => {
    try { const saved = localStorage.getItem('caresphere_stress'); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });

  const [mood, setMood] = useState('');
  const [stressLevel, setStressLevel] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  const [showBreathing, setShowBreathing] = useState(false);
  const [recentHighStress, setRecentHighStress] = useState(false);

  useEffect(() => { localStorage.setItem('caresphere_stress', JSON.stringify(entries)); }, [entries]);

  const activeZone = getStressZone(stressLevel);
  const activeMoodDef = MOODS.find(m => m.id === mood);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood) return;
    
    // Auto Tagging Time
    const timeTag = getSystemTimeTag();

    const newEntry = { 
      id: Date.now(), 
      mood, 
      stressLevel, 
      notes, 
      date: new Date().toISOString().split('T')[0],
      timeTag,
      contextTags: selectedTags
    };
    
    setEntries(prev => [newEntry, ...prev]);
    
    // Trigger Breather check
    if (stressLevel >= 7) {
      setRecentHighStress(true);
      setShowBreathing(true);
    }
    
    // Reset
    setMood(''); setStressLevel(5); setNotes(''); setSelectedTags([]);
  };

  const toggleTag = (t: string) => {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  /* ─── Insights Engine ────────────────────────────────────── */
  const insights = useMemo(() => {
    if (entries.length < 3) return ["Please log more entries to unlock personalized emotional intelligence insights."];
    
    const logs = [...entries].reverse(); // oldest to newest
    const res = [];
    
    // Streak check
    res.push(`You've been tracking your wellness! Keep logging to build your profile.`);
    
    // Averages
    const morningStress = logs.filter(e => e.timeTag === 'Morning').reduce((a,b)=>a+b.stressLevel, 0) / (logs.filter(e => e.timeTag === 'Morning').length || 1);
    const eveningStress = logs.filter(e => e.timeTag === 'Evening').reduce((a,b)=>a+b.stressLevel, 0) / (logs.filter(e => e.timeTag === 'Evening').length || 1);
    
    if (morningStress > eveningStress + 2) res.push("Your stress peaks in the mornings. Consider a short meditation right after waking up.");
    if (eveningStress > morningStress + 2) res.push("Evenings show higher tension. A wind-down routine before sleep might be necessary.");
    
    // Tags
    const workStress = logs.filter(e => e.contextTags.includes('Work')).reduce((a,b)=>a+b.stressLevel, 0) / (logs.filter(e => e.contextTags.includes('Work')).length || 1);
    if (workStress > 6) res.push("Work appears to be a consistent primary stressor resulting in High Stress flags.");
    
    const exerciseLogs = logs.filter(e => e.contextTags.includes('Exercise'));
    if (exerciseLogs.length > 0) {
      const avgExc = exerciseLogs.reduce((a,b)=>a+b.stressLevel,0) / exerciseLogs.length;
      if (avgExc < 4) res.push("Your stress is notably reduced on days you log 'Exercise'. Keep moving!");
    }

    return res;
  }, [entries]);

  const streak = useMemo(() => {
    if (!entries.length) return 0;
    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    let d = new Date(today);
    while (true) {
      const dStr = d.toISOString().split('T')[0];
      if (entries.some(e => e.date === dStr)) count++;
      else if (dStr !== today) break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [entries]);

  
  /* ─── Chart Processing ──────────────────────────────────── */
  const chartDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for(let i=6; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const match = entries.find(e => e.date === dStr);
      days.push({
        dateInfo: dStr.slice(5).replace('-','/'), 
        val: match ? match.stressLevel : null,
        emoji: match ? MOODS.find(m => m.id === match.mood)?.emoji : null
      });
    }
    return days;
  }, [entries]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Mental Wellness</h1>
          <p className="text-[#94A3B8] mt-1 text-sm md:text-base">Understand your emotional patterns and take actionable control.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
            <Flame className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xs text-amber-500/80 font-bold uppercase tracking-wider leading-none">Daily Streak</p>
              <p className="text-lg font-black text-amber-500 leading-tight">{streak} Days</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 shadow-sm">
            <Target className="w-5 h-5 text-[#00D4FF]" />
            <div>
              <p className="text-xs text-[#00D4FF]/80 font-bold uppercase tracking-wider leading-none">Weekly Goal</p>
              <p className="text-lg font-black text-[#00D4FF] leading-tight">{Math.min(streak, 7)}/7</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 flex-1">
        
        {/* LEFT COLUMN: LOGGER */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* LOGGER WIDGET */}
          <div className="rounded-3xl border border-white/10 bg-[#131928] overflow-hidden shadow-lg">
            <div className={`p-1 h-2 w-full bg-${activeZone.color}-500 transition-colors duration-500`} />
            <form onSubmit={handleLog} className="p-7">
              <div className="flex items-center gap-2 mb-8">
                <Brain className="w-6 h-6 text-[#00D4FF]" />
                <h2 className="text-xl font-bold text-white">How are you feeling right now?</h2>
              </div>
              
              {/* MOOD CARDS */}
              <div className="grid grid-cols-5 gap-3 mb-10">
                {MOODS.map((m) => (
                  <button
                    key={m.id} type="button" onClick={() => setMood(m.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 transform outline-none ${
                        mood === m.id
                        ? `bg-${m.color}-500/15 border-${m.color}-500/40 shadow-[0_0_20px_rgba(0,0,0,0.1)] scale-105`
                        : `bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-[#64748B] hover:-translate-y-1`
                    }`}
                  >
                    <span className={`text-4xl mb-2 transition-transform ${mood === m.id ? 'scale-110' : 'grayscale opacity-60'}`}>{m.emoji}</span>
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide text-center ${mood === m.id ? `text-${m.color}-400` : ''}`}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* STRESS SLIDER */}
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <label className="block text-sm font-black text-white uppercase tracking-wider">
                    Stress & Tension
                  </label>
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-bold bg-${activeZone.color}-500/10 border-${activeZone.color}-500/20 text-${activeZone.color}-400 transition-colors duration-300`}>
                    Level {stressLevel} — {activeZone.label}
                  </div>
                </div>
                
                <div className="relative h-14 bg-white/5 rounded-2xl p-2 border border-white/5 flex items-center">
                  {/* Custom Gradient Track */}
                  <div className="absolute left-2 right-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-30 pointer-events-none" />
                  <div 
                    className="absolute left-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 pointer-events-none transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                    style={{ width: `calc(${(stressLevel - 1) / 9 * 100}% - 0px)` }} 
                  />
                  <input
                    type="range" min="1" max="10"
                    value={stressLevel} onChange={e => setStressLevel(Number(e.target.value))}
                    className="w-full h-full appearance-none bg-transparent cursor-pointer relative z-10 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(0,0,0,0.5)] [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#131928] [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                  />
                </div>
                {activeZone.type === 'high' && (
                  <p className="mt-3 text-sm text-red-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-4 h-4"/> Your stress is remarkably high. We strongly recommend taking action.
                  </p>
                )}
              </div>

              {/* CONTEXT TAGS */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-4">What's contributing to this?</label>
                <div className="flex flex-wrap gap-2">
                  {CONTEXT_TAGS.map(t => (
                    <button
                      key={t} type="button" onClick={() => toggleTag(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        selectedTags.includes(t)
                        ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30'
                        : 'bg-white/5 border-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* NOTES */}
              <div className="mb-8 relative">
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Personal Notes</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} placeholder="Write down your thoughts..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-[#475569] focus:outline-none focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 transition resize-none"
                />
              </div>

              <div className="flex items-center gap-4 border-t border-white/10 pt-6 mt-2">
                <button
                  type="submit" disabled={!mood}
                  className="w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-[#00D4FF] text-white tracking-wide shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                >
                  Save Mental Log
                </button>
                {activeMoodDef && <span className={`text-sm font-bold text-${activeMoodDef.color}-400 italic flex-1 text-right hidden sm:block`}>"{activeMoodDef.message}"</span>}
              </div>
            </form>
          </div>

        </div>


        {/* RIGHT COLUMN: INTELLIGENCE & HISTORY */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* AI INSIGHTS PANEL */}
          <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-[#131928] to-purple-500/[0.04] p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Wellness Intelligence</h2>
                <p className="text-xs text-purple-400/80 uppercase font-bold tracking-widest">Personalized AI Insights</p>
              </div>
            </div>
            <div className="space-y-4">
              {insights.map((msg, i) => (
                <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-[#cbd5e1] leading-relaxed shadow-sm">
                  <span className="text-purple-400 mt-1 shrink-0">✦</span>
                  <p>{msg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RELIEF TOOLS (Auto-suggests if recent high stress) */}
           <div className={`rounded-3xl border transition-colors duration-500 p-6 ${recentHighStress ? 'border-amber-500/40 bg-amber-500/[0.03] shadow-[0_0_30px_rgba(245,158,11,0.05)]' : 'border-white/10 bg-[#131928]'}`}>
            <h2 className="text-lg font-bold text-white mb-1"><HeartPulse className="w-5 h-5 inline-block mr-2 text-[#00D4FF] mb-1"/>Relief Actions</h2>
            <p className="text-sm text-[#94A3B8] mb-5">Immediate techniques to restore balance.</p>
            
            <div className="space-y-3">
              <button onClick={() => setShowBreathing(true)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-[#00D4FF]/10 hover:border-[#00D4FF]/30 border border-white/5 transition-all text-left group">
                <div>
                  <h4 className="text-white font-bold mb-1 group-hover:text-[#00D4FF] transition-colors">4-7-8 Breathing</h4>
                  <p className="text-xs text-[#64748B]">Rapid tension release (2 mins)</p>
                </div>
                <PlayCircle className="w-6 h-6 text-[#94A3B8] group-hover:text-[#00D4FF] transition-colors" />
              </button>
            </div>
          </div>
          

          {/* 7-DAY TREND GRAPH */}
          <div className="rounded-3xl border border-white/10 bg-[#131928] p-6 shadow-lg flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#00D4FF]"/>7-Day Stress Impact</h2>
            
            <div className="flex items-end justify-between gap-1 flex-1 min-h-[140px] pt-8 border-b border-white/10 pb-2 relative">
              {/* Y Axis Guides */}
              <div className="absolute inset-x-0 bottom-1/2 border-b border-dashed border-white/5" />
              <div className="absolute inset-x-0 top-6 border-b border-dashed border-white/5" />

              {chartDays.map((d, i) => {
                const h = Math.max(10, ((d.val || 0) / 10) * 100);
                const isNull = d.val === null;
                const stressColor = d.val ? (d.val <= 3 ? 'bg-emerald-500 shadow-emerald-500/50' : d.val <= 6 ? 'bg-amber-500 shadow-amber-500/50' : 'bg-red-500 shadow-red-500/50') : 'bg-white/10';

                return (
                  <div key={i} className="flex flex-col items-center gap-3 w-full group relative">
                    {/* Tooltip / Emoji */}
                    {!isNull && <div className="absolute -top-7 text-lg group-hover:scale-125 transition-transform z-10">{d.emoji}</div>}
                    
                    {/* Bar */}
                    <div className="w-full max-w-[24px] bg-[#1e293b] rounded-t-lg relative flex items-end overflow-visible h-[100px]">
                       <div className={`w-full rounded-t-lg transition-all duration-1000 ease-out shadow-sm origin-bottom ${stressColor}`} style={{ height: `${isNull ? 0 : h}%` }} />
                    </div>
                    {/* Date label */}
                    <p className={`text-[10px] font-bold tracking-wider ${i === 6 ? 'text-white' : 'text-[#64748B]'}`}>{d.dateInfo}</p>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-[#64748B] font-medium"><CalIcon className="w-3.5 h-3.5 inline mr-1 mb-0.5 opacity-50"/> Last 7 Days History</p>
              <button className="text-xs font-bold text-[#00D4FF] hover:text-white transition">View Logbook →</button>
            </div>
          </div>
          

        </div>
      </div>

      {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
    </div>
  );
}
