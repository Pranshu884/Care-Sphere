import { useState, useEffect } from 'react';
import { Pill, Plus, Bell } from 'lucide-react';

interface Reminder {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  startDate: string;
  endDate: string;
}

export default function MedicineReminder() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem('caresphere_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    time: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    localStorage.setItem('caresphere_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'Every 6 hours', 'As needed'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dosage || !form.frequency || !form.time || !form.startDate) return;
    setReminders((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...form,
        endDate: form.endDate || form.startDate,
      },
    ]);
    setForm({ name: '', dosage: '', frequency: '', time: '', startDate: '', endDate: '' });
    setShowForm(false);
  };

  const removeReminder = (id: number) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Reminder</h1>
          <p className="text-slate-600 mt-1">Set and manage your medication reminders</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Reminder
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Add Medicine Reminder</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
                <input
                  type="text"
                  required
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. 500mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                <select
                  required
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select frequency</option>
                  {frequencies.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700">
                  Add Reminder
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No active reminders</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-teal-600 font-medium hover:underline">
            Add your first reminder
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-100 p-6 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{r.name}</h3>
                  <p className="text-slate-600 text-sm">{r.dosage} • {r.frequency}</p>
                  <p className="text-slate-500 text-sm mt-1">Time: {r.time} | {r.startDate} - {r.endDate}</p>
                </div>
              </div>
              <button
                onClick={() => removeReminder(r.id)}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
