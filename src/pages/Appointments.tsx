import { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';

const doctors = [
  { id: 1, name: 'Dr. Sarah Chen', specialty: 'General Practitioner' },
  { id: 2, name: 'Dr. Michael Roberts', specialty: 'Internal Medicine' },
  { id: 3, name: 'Dr. Emily Watson', specialty: 'Family Medicine' },
];

const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

export default function Appointments() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showBook, setShowBook] = useState(false);
  const [bookForm, setBookForm] = useState({
    doctor: '',
    date: '',
    time: '',
    reason: '',
  });
  const [appointments, setAppointments] = useState<Array<{ id: number; doctor: string; date: string; time: string; reason: string }>>([]);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.doctor || !bookForm.date || !bookForm.time || !bookForm.reason) return;
    const doctor = doctors.find((d) => d.id.toString() === bookForm.doctor);
    setAppointments((prev) => [
      ...prev,
      {
        id: Date.now(),
        doctor: doctor?.name || '',
        date: bookForm.date,
        time: bookForm.time,
        reason: bookForm.reason,
      },
    ]);
    setBookForm({ doctor: '', date: '', time: '', reason: '' });
    setShowBook(false);
  };

  const cancelAppointment = (id: number) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const upcoming = appointments.filter((a) => new Date(a.date) >= new Date());
  const past = appointments.filter((a) => new Date(a.date) < new Date());

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-600 mt-1">Schedule and manage your doctor visits</p>
        </div>
        <button
          onClick={() => setShowBook(true)}
          className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          Book Appointment
        </button>
      </div>

      {showBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Book New Appointment</h2>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
                <select
                  required
                  value={bookForm.doctor}
                  onChange={(e) => setBookForm({ ...bookForm, doctor: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={bookForm.date}
                  onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <select
                  required
                  value={bookForm.time}
                  onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Choose time</option>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                <textarea
                  required
                  value={bookForm.reason}
                  onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  placeholder="Brief description of your concern"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700">
                  Confirm Booking
                </button>
                <button type="button" onClick={() => setShowBook(false)} className="px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'upcoming' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'past' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Past
        </button>
      </div>

      <div className="space-y-4">
        {(activeTab === 'upcoming' ? upcoming : past).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No {activeTab} appointments</p>
            {activeTab === 'upcoming' && (
              <button onClick={() => setShowBook(true)} className="mt-4 text-teal-600 font-medium hover:underline">
                Book your first appointment
              </button>
            )}
          </div>
        ) : (
          (activeTab === 'upcoming' ? upcoming : past).map((apt) => (
            <div key={apt.id} className="bg-white rounded-xl border border-slate-100 p-6 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">{apt.doctor}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {apt.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {apt.time}</span>
                </div>
                <p className="mt-2 text-slate-600">{apt.reason}</p>
              </div>
              {activeTab === 'upcoming' && (
                <button
                  onClick={() => cancelAppointment(apt.id)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
