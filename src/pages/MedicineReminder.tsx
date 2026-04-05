import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import {
  Pill, Plus, X, Check, AlertCircle, Clock,
  ChevronDown, ChevronUp, Edit2, Trash2,
  CheckCircle, XCircle, PauseCircle, PlayCircle,
  Calendar, RotateCcw
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────── */
interface Medicine {
  _id: string;
  name: string;
  dosage: string;
  times: string[];
  reminderType: 'daily' | 'days' | 'range';
  days: string[];
  startDate?: string;
  endDate?: string;
  notes: string;
  isActive: boolean;
  isCompleted?: boolean;
  nextDose?: string;
  todayStatus?: { taken: string[]; missed: string[]; upcoming: string[] };
}

type ReminderType = 'daily' | 'days' | 'range';

/* ─── Constants ──────────────────────────────────────── */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ─── Helpers ────────────────────────────────────────── */
function fmt12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function typeLabel(med: Medicine) {
  if (med.reminderType === 'days') return med.days.join(', ');
  if (med.reminderType === 'range') {
    const s = med.startDate ? new Date(med.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
    const e = med.endDate   ? new Date(med.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'ongoing';
    return `${s} – ${e}`;
  }
  return 'Every day';
}

function getTimeStatus(med: Medicine, time: string): 'taken' | 'missed' | 'upcoming' {
  if (med.todayStatus?.taken.includes(time))  return 'taken';
  if (med.todayStatus?.missed.includes(time)) return 'missed';
  return 'upcoming';
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/* ─── Default form ───────────────────────────────────── */
const defaultForm = () => ({
  name: '',
  dosage: '',
  times: ['09:00'] as string[],
  reminderType: 'daily' as ReminderType,
  days: [] as string[],
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  notes: '',
});

/* ═══════════════════════════════════════════════════════
   ADD / EDIT MODAL
═══════════════════════════════════════════════════════ */
function MedicineModal({
  initial, onSave, onClose,
}: {
  initial?: Medicine | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial
    ? { name: initial.name, dosage: initial.dosage, times: [...initial.times],
        reminderType: initial.reminderType, days: [...(initial.days || [])],
        startDate: initial.startDate || new Date().toISOString().split('T')[0],
        endDate: initial.endDate || '', notes: initial.notes || '' }
    : defaultForm()
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addTime = () => setField('times', [...form.times, '12:00']);
  const removeTime = (i: number) => setField('times', form.times.filter((_, idx) => idx !== i));
  const setTime = (i: number, v: string) => setField('times', form.times.map((t, idx) => idx === i ? v : t));
  const toggleDay = (d: string) => setField('days', form.days.includes(d) ? form.days.filter(x => x !== d) : [...form.days, d]);
  const setType = (t: ReminderType) => setField('reminderType', t);

  const validate = () => {
    if (!form.name.trim())    return 'Medicine name is required.';
    if (!form.dosage.trim())  return 'Dosage is required.';
    if (!form.times.length)   return 'Add at least one time.';
    if (form.reminderType === 'days' && !form.days.length) return 'Select at least one weekday.';
    if (form.reminderType === 'range' && !form.startDate)  return 'Start date is required.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-[#131928] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{initial ? 'Edit Medicine' : 'Add New Medicine'}</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-xl transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Name + Dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Medicine Name *</label>
              <input
                required type="text" value={form.name}
                onChange={e => setField('name', e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF]/50 transition"
                placeholder="e.g. Paracetamol"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Dosage *</label>
              <input
                required type="text" value={form.dosage}
                onChange={e => setField('dosage', e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF]/50 transition"
                placeholder="e.g. 500mg"
              />
            </div>
          </div>

          {/* Times */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Intake Times *</label>
              <button type="button" onClick={addTime} className="text-xs font-bold text-[#00D4FF] hover:text-white flex items-center gap-1 transition">
                <Plus className="w-3.5 h-3.5" /> Add time
              </button>
            </div>
            <div className="space-y-2">
              {form.times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time" value={t}
                    onChange={e => setTime(i, e.target.value)}
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF]/50 transition [color-scheme:dark]"
                  />
                  {form.times.length > 1 && (
                    <button type="button" onClick={() => removeTime(i)} className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reminder Type */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Reminder Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['daily', 'days', 'range'] as ReminderType[]).map(t => (
                <button
                  key={t} type="button" onClick={() => setType(t)}
                  className={`py-3 px-2 rounded-xl font-bold text-sm border transition-all ${
                    form.reminderType === t
                      ? 'bg-[#00D4FF]/10 border-[#00D4FF]/30 text-[#00D4FF]'
                      : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t === 'daily' ? 'Daily' : t === 'days' ? 'Specific Days' : 'Date Range'}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional: Specific Days */}
          {form.reminderType === 'days' && (
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Select Days *</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(d => (
                  <button
                    key={d} type="button" onClick={() => toggleDay(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      form.days.includes(d)
                        ? 'bg-[#00D4FF]/10 border-[#00D4FF]/30 text-[#00D4FF]'
                        : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conditional: Date Range */}
          {form.reminderType === 'range' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Start Date *</label>
                <input
                  type="date" required value={form.startDate}
                  onChange={e => setField('startDate', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">End Date <span className="text-[#475569] normal-case font-normal">(optional)</span></label>
                <input
                  type="date" value={form.endDate}
                  onChange={e => setField('endDate', e.target.value)}
                  min={form.startDate}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 transition"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Notes <span className="text-[#475569] normal-case font-normal">(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF]/50 transition resize-none"
              placeholder="e.g. After food, with water..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(0,212,255,0.25)] hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Medicine'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-white/10 text-[#94A3B8] hover:bg-white/5 hover:text-white text-sm font-medium transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MEDICINE CARD
═══════════════════════════════════════════════════════ */
function MedicineCard({
  med, onEdit, onDelete, onToggleActive, onTaken, onMissed
}: {
  med: Medicine;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onTaken: (time: string) => void;
  onMissed: (time: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const now = nowHHMM();

  const allTaken   = med.times.length > 0 && med.times.every(t => med.todayStatus?.taken.includes(t));
  const hasMissed  = (med.todayStatus?.missed.length || 0) > 0;
  const isComplete = med.isCompleted;

  const statusBadge = isComplete
    ? { label: 'Completed', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
    : !med.isActive
      ? { label: 'Paused', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
      : allTaken
        ? { label: 'All Taken ✓', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
        : hasMissed
          ? { label: 'Missed', cls: 'bg-red-500/10 text-red-400 border-red-500/20' }
          : { label: 'Active', cls: 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20' };

  return (
    <div className={`rounded-2xl border bg-[#131928] transition-all duration-300 ${med.isActive && !isComplete ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${med.isActive ? 'bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF]' : 'bg-white/5 border border-white/10 text-[#475569]'}`}>
            <Pill className="w-5 h-5" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-base leading-tight">{med.name}</h3>
                <p className="text-sm text-[#94A3B8] mt-0.5">{med.dosage}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${statusBadge.cls}`}>{statusBadge.label}</span>
            </div>

            {/* Times */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {med.times.map(t => {
                const status = getTimeStatus(med, t);
                return (
                  <span key={t} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    status === 'taken'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    status === 'missed'  ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    t === med.nextDose   ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20' :
                    'bg-white/5 text-[#94A3B8] border-white/10'
                  }`}>
                    <Clock className="w-3 h-3" /> {fmt12(t)}
                  </span>
                );
              })}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-[#475569]">
                <Calendar className="w-3.5 h-3.5" />{typeLabel(med)}
              </span>
              {med.nextDose && med.isActive && !isComplete && (
                <span className="text-xs text-[#00D4FF] font-medium">Next: {fmt12(med.nextDose)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex gap-1">
            <button onClick={onEdit} title="Edit" className="p-2 text-[#94A3B8] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 rounded-xl transition">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onToggleActive} title={med.isActive ? 'Pause' : 'Resume'} className="p-2 text-[#94A3B8] hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition">
              {med.isActive ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            </button>
            <button onClick={onDelete} title="Delete" className="p-2 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#94A3B8] hover:text-white hover:bg-white/5 rounded-xl transition"
          >
            Today {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded: Today's doses */}
      {expanded && (
        <div className="px-5 pb-5 space-y-2 border-t border-white/[0.06] pt-4">
          <p className="text-[11px] font-bold text-[#475569] uppercase tracking-widest mb-3">Today's Doses</p>
          {med.times.map(time => {
            const status = getTimeStatus(med, time);
            return (
              <div key={time} className={`flex items-center justify-between p-3 rounded-xl border ${
                status === 'taken'   ? 'bg-emerald-500/5 border-emerald-500/15' :
                status === 'missed'  ? 'bg-red-500/5 border-red-500/15' :
                'bg-white/[0.03] border-white/[0.08]'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${status === 'taken' ? 'bg-emerald-400' : status === 'missed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-sm font-bold text-white">{fmt12(time)}</span>
                  <span className={`text-xs capitalize font-medium ${status === 'taken' ? 'text-emerald-400' : status === 'missed' ? 'text-red-400' : 'text-amber-400'}`}>
                    {status}
                  </span>
                </div>
                {status === 'upcoming' && med.isActive && (
                  <div className="flex gap-2">
                    <button onClick={() => onTaken(time)} className="px-3 py-1.5 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Taken
                    </button>
                    <button onClick={() => onMissed(time)} className="px-3 py-1.5 text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Missed
                    </button>
                  </div>
                )}
                {status !== 'upcoming' && (
                  status === 'taken'
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TODAY'S TIMELINE
═══════════════════════════════════════════════════════ */
function TodayTimeline({ medicines }: { medicines: Medicine[] }) {
  const slots = medicines
    .filter(m => m.isActive && !m.isCompleted)
    .flatMap(med => med.times.map(time => ({ med, time, status: getTimeStatus(med, time) })))
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!slots.length) return (
    <div className="rounded-2xl border border-white/10 bg-[#131928] p-12 text-center">
      <Pill className="w-10 h-10 text-[#1E293B] mx-auto mb-3" />
      <p className="text-[#94A3B8] text-sm">No doses scheduled for today.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {slots.map(({ med, time, status }, i) => (
        <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
          status === 'taken'  ? 'bg-emerald-500/[0.04] border-emerald-500/10' :
          status === 'missed' ? 'bg-red-500/[0.04] border-red-500/10' :
          'bg-white/[0.025] border-white/[0.08]'
        }`}>
          <span className="text-sm font-bold text-[#64748B] w-20 shrink-0 tabular-nums">{fmt12(time)}</span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${status === 'taken' ? 'bg-emerald-400' : status === 'missed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{med.name}</p>
            <p className="text-xs text-[#64748B]">{med.dosage}</p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize shrink-0 ${
            status === 'taken'  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            status === 'missed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>{status}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function MedicineReminder() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'today' | 'all'>('today');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Medicine | null>(null);

  /* Fetch */
  const fetchMedicines = useCallback(async () => {
    const res = await apiGet('/api/medicines');
    if (res.ok && res.data?.medicines) setMedicines(res.data.medicines);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  /* Save (add / edit) */
  const handleSave = async (form: any) => {
    if (editTarget) {
      const res = await apiPut(`/api/medicines/${editTarget._id}`, form);
      if (res.ok) {
        setMedicines(ms => ms.map(m => m._id === editTarget._id ? { ...m, ...res.data.medicine } : m));
      }
    } else {
      const res = await apiPost('/api/medicines', form);
      if (res.ok) {
        setMedicines(ms => [res.data.medicine, ...ms]); // optimistic: prepend instantly
      }
    }
    setShowModal(false);
    setEditTarget(null);
    // Re-fetch for todayStatus enrichment
    fetchMedicines();
  };

  /* Delete */
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this medicine reminder?')) return;
    setMedicines(ms => ms.filter(m => m._id !== id));    // optimistic
    await apiDelete(`/api/medicines/${id}`);
  };

  /* Toggle active */
  const handleToggle = async (med: Medicine) => {
    const updated = { ...med, isActive: !med.isActive };
    setMedicines(ms => ms.map(m => m._id === med._id ? updated : m)); // optimistic
    await apiPut(`/api/medicines/${med._id}`, { isActive: !med.isActive });
  };

  /* Taken / Missed */
  const handleTaken = async (id: string, time: string) => {
    setMedicines(ms => ms.map(m => {
      if (m._id !== id) return m;
      const ts = m.todayStatus || { taken: [], missed: [], upcoming: [] };
      return { ...m, todayStatus: { ...ts, taken: [...ts.taken, time], upcoming: ts.upcoming.filter(t => t !== time) } };
    }));
    await apiPost(`/api/medicines/${id}/taken`, { time });
  };

  const handleMissed = async (id: string, time: string) => {
    setMedicines(ms => ms.map(m => {
      if (m._id !== id) return m;
      const ts = m.todayStatus || { taken: [], missed: [], upcoming: [] };
      return { ...m, todayStatus: { ...ts, missed: [...ts.missed, time], upcoming: ts.upcoming.filter(t => t !== time) } };
    }));
    await apiPost(`/api/medicines/${id}/missed`, { time });
  };

  /* Stats */
  const activeMeds     = medicines.filter(m => m.isActive && !m.isCompleted);
  const totalDosesToday = medicines.reduce((a, m) => a + (m.times?.length || 0), 0);
  const takenToday     = medicines.reduce((a, m) => a + (m.todayStatus?.taken.length || 0), 0);
  const missedToday    = medicines.reduce((a, m) => a + (m.todayStatus?.missed.length || 0), 0);

  const openAdd = () => { setEditTarget(null); setShowModal(true); };
  const openEdit = (med: Medicine) => { setEditTarget(med); setShowModal(true); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Medicine Reminder</h1>
          <p className="text-[#94A3B8] mt-1">Track and manage your daily medications</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchMedicines} className="p-2.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-xl border border-white/10 transition" title="Refresh">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="glow-button inline-flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active',   val: activeMeds.length,    cls: 'text-[#00D4FF]  bg-[#00D4FF]/10  border-[#00D4FF]/20' },
          { label: 'Taken',    val: takenToday,           cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Missed',   val: missedToday,          cls: 'text-red-400     bg-red-500/10     border-red-500/20' },
          { label: "Today's",  val: `${takenToday}/${totalDosesToday}`, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-[#131928] p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${s.cls}`}>
              <Pill className="w-4 h-4" />
            </div>
            <div><p className="text-lg font-black text-white leading-tight">{s.val}</p><p className="text-xs text-[#475569]">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Missed Banner */}
      {missedToday > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          You missed <strong className="text-red-300">{missedToday} dose{missedToday > 1 ? 's' : ''}</strong> today. Consult your doctor if needed.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['today', "Today's Schedule"], ['all', 'All Medicines']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as 'today' | 'all')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm border transition-all ${tab === t ? 'bg-[#00D4FF]/10 border-[#00D4FF]/20 text-[#00D4FF]' : 'bg-white/[0.03] border-white/[0.07] text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#131928] p-12 text-center text-[#94A3B8]">Loading reminders...</div>
      ) : medicines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#131928] p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00D4FF]/5 border border-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF]/30">
            <Pill className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No medicines added yet</h3>
          <p className="text-[#94A3B8] text-sm mb-6">Add your first medicine reminder to get started.</p>
          <button onClick={openAdd} className="glow-button px-6 py-2.5 text-sm inline-flex mx-auto">
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>
      ) : tab === 'today' ? (
        <TodayTimeline medicines={medicines} />
      ) : (
        <div className="space-y-4">
          {medicines.map(med => (
            <MedicineCard
              key={med._id}
              med={med}
              onEdit={() => openEdit(med)}
              onDelete={() => handleDelete(med._id)}
              onToggleActive={() => handleToggle(med)}
              onTaken={t => handleTaken(med._id, t)}
              onMissed={t => handleMissed(med._id, t)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MedicineModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
