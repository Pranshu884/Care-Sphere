import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, X, Activity, User, MapPin, Stethoscope, Award, Search, Building, ChevronRight } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../lib/api';

const CATEGORIES = ['All', 'General Physician', 'Gynecologist', 'Dermatologist', 'Pediatrician', 'Neurologist', 'Gastroenterologist', 'Orthopedic'];
const CITIES = ['All Cities', 'Ahmedabad', 'Surat', 'Rajkot', 'Vadodara', 'Nadiad'];

export default function Appointments() {
  const [mainTab, setMainTab] = useState<'find' | 'my'>('find');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  const [showBook, setShowBook] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [bookForm, setBookForm] = useState({ doctorId: '', date: '', time: '', symptoms: '' });

  useEffect(() => { fetchDoctors(); fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const res = await apiGet('/api/user/appointments');
    if (res.ok) setAppointments(res.data.appointments);
    setLoading(false);
  };

  const fetchDoctors = async () => {
    const res = await apiGet('/api/user/appointments/doctors');
    if (res.ok) setDoctors(res.data.doctors);
  };

  const fetchBookedSlots = async (docId: string, date: string) => {
    if (!docId || !date) { setBookedSlots([]); return; }
    const res = await apiGet(`/api/user/appointments/doctors/${docId}/booked-slots?date=${date}`);
    if (res.ok) setBookedSlots(res.data.bookedSlots || []);
    else setBookedSlots([]);
  };

  useEffect(() => {
    if (bookForm.doctorId && bookForm.date) {
      fetchBookedSlots(bookForm.doctorId, bookForm.date);
      setBookForm(prev => ({ ...prev, time: '' }));
    }
  }, [bookForm.doctorId, bookForm.date]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.doctorId || !bookForm.date || !bookForm.time || !bookForm.symptoms) return;
    const res = await apiPost('/api/user/appointments', bookForm);
    if (res.ok) {
      setBookForm({ doctorId: '', date: '', time: '', symptoms: '' });
      setShowBook(false);
      setMainTab('my');
      setActiveTab('upcoming');
      fetchAppointments();
    } else {
      alert(res.data?.message || 'Failed to book appointment');
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!window.confirm('Cancel this appointment?')) return;
    const res = await apiDelete(`/api/user/appointments/${id}`);
    if (res.ok) fetchAppointments();
  };

  const upcoming = appointments.filter(a => a.status === 'pending' || a.status === 'accepted');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'rejected');

  const filteredDoctors = useMemo(() => doctors.filter(doc => {
    const matchCat = selectedCategory === 'All' || doc.category === selectedCategory || doc.specialization === selectedCategory;
    const matchCity = selectedCity === 'All Cities' || doc.city === selectedCity;
    return matchCat && matchCity;
  }), [doctors, selectedCategory, selectedCity]);

  const selectedDoctor = doctors.find(d => d._id === bookForm.doctorId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Appointments</h1>
          <p className="text-muted mt-1">Find doctors and manage your schedule</p>
        </div>

        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl gap-1">
          {(['find', 'my'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-all capitalize ${
                mainTab === tab
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted hover:text-white'
              }`}
            >
              {tab === 'find' ? 'Find Doctors' : 'My Appointments'}
            </button>
          ))}
        </div>
      </div>

      {/* FIND DOCTORS TAB */}
      {mainTab === 'find' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    selectedCategory === cat
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-white/5 border-white/10 text-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="premium-input py-2 text-sm min-w-[160px] [&>option]:text-slate-900"
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Doctor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map(doc => (
              <div key={doc._id} className="glass-panel p-5 flex flex-col hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{doc.name}</h3>
                    <p className="text-primary font-medium text-sm flex items-center gap-1 mt-0.5">
                      <Stethoscope className="w-3.5 h-3.5" /> {doc.category || doc.specialization}
                    </p>
                    <p className="text-muted text-xs mt-0.5">{doc.qualification}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted flex-1 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted/60 shrink-0" />
                    <span>{doc.experience} Years Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted/60 shrink-0" />
                    <span className="truncate">{doc.hospital}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted/60 shrink-0" />
                    <span className="truncate">{doc.city} — {doc.address}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setBookForm({ doctorId: doc._id, date: '', time: '', symptoms: '' }); setBookedSlots([]); setShowBook(true); }}
                  className="mt-5 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-muted hover:bg-primary/10 hover:border-primary/30 hover:text-primary font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  Book Appointment <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}

            {filteredDoctors.length === 0 && (
              <div className="col-span-full glass-panel py-16 text-center">
                <Search className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">No doctors found</h3>
                <p className="text-muted mt-1">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY APPOINTMENTS TAB */}
      {mainTab === 'my' && (
        <>
          <div className="flex gap-2 mb-6">
            {(['upcoming', 'past'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl font-medium text-sm transition-all capitalize border ${
                  activeTab === tab
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-white/5 border-white/10 text-muted hover:text-white'
                }`}
              >
                {tab === 'upcoming' ? 'Upcoming' : 'History'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="glass-panel p-12 text-center">
                <Activity className="animate-spin w-8 h-8 text-primary mx-auto" />
              </div>
            ) : (activeTab === 'upcoming' ? upcoming : past).length === 0 ? (
              <div className="glass-panel p-16 text-center">
                <Calendar className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                <p className="text-muted font-medium">No {activeTab} appointments found.</p>
                {activeTab === 'upcoming' && (
                  <button onClick={() => setMainTab('find')} className="mt-4 text-primary font-medium hover:text-white transition-colors text-sm">
                    Book your first appointment →
                  </button>
                )}
              </div>
            ) : (
              (activeTab === 'upcoming' ? upcoming : past).map(apt => (
                <div key={apt._id} className="glass-panel p-6 hover:border-white/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">{apt.doctorId?.name || 'Unknown Doctor'}</h3>
                      <p className="text-sm text-primary font-medium mt-0.5">{apt.doctorId?.specialization || apt.doctorId?.category || 'General'}</p>

                      <div className="flex items-center gap-4 mt-3 text-sm text-muted">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted/60" /> {apt.date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted/60" /> {apt.time}</span>
                      </div>

                      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-muted">
                        <strong className="text-white/70">Symptoms:</strong> {apt.symptoms}
                        {apt.notes && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <strong className="text-white/70">Doctor's Notes:</strong> {apt.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[130px]">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        apt.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        apt.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {apt.status === 'pending' ? 'Awaiting' : apt.status === 'accepted' ? 'Confirmed' : apt.status === 'rejected' ? 'Cancelled' : apt.status}
                      </span>

                      {activeTab === 'upcoming' && apt.status === 'pending' && (
                        <button
                          onClick={() => cancelAppointment(apt._id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* BOOKING MODAL */}
      {showBook && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Book Appointment</h2>
              <button onClick={() => setShowBook(false)} className="p-2 hover:bg-white/10 rounded-xl text-muted transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">{selectedDoctor.name}</h3>
                <p className="text-primary text-sm">{selectedDoctor.category || selectedDoctor.specialization}</p>
                <p className="text-muted text-xs">{selectedDoctor.hospital}</p>
              </div>
            </div>

            <form onSubmit={handleBook} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Select Date</label>
                <input
                  type="date"
                  required
                  value={bookForm.date}
                  onChange={e => setBookForm({ ...bookForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="premium-input"
                />
              </div>

              {bookForm.date && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Available Time Slots</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(selectedDoctor.availabilitySlots || []).map((t: string) => {
                      const isBooked = bookedSlots.includes(t);
                      const isSelected = bookForm.time === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setBookForm({ ...bookForm, time: t })}
                          className={`py-2 text-sm font-medium rounded-xl border transition-all ${
                            isBooked
                              ? 'bg-white/5 border-white/5 text-muted/30 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                                : 'bg-white/5 border-white/10 text-muted hover:border-primary/30 hover:text-primary'
                          }`}
                        >
                          {t}
                          {isBooked && <span className="block text-[10px] mt-0.5 text-muted/30">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                  {!bookForm.time && <p className="text-xs text-red-400 mt-2">Please select a time slot.</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Symptoms / Reason</label>
                <textarea
                  required
                  value={bookForm.symptoms}
                  onChange={e => setBookForm({ ...bookForm, symptoms: e.target.value })}
                  rows={3}
                  className="premium-input resize-none"
                  placeholder="Brief description of your concern"
                />
              </div>

              <button
                type="submit"
                disabled={!bookForm.time || !bookForm.date || !bookForm.symptoms}
                className="glow-button w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
