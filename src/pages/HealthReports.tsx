import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Upload, File as FileIcon, Loader2, Search, Filter, Plus, X, Eye, Trash2, Calendar, FileText, ImageIcon, Download, Stethoscope } from 'lucide-react';
import { getToken } from '../lib/auth';

interface ReportRecord {
  _id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  doctorName?: string;
  hospitalName?: string;
  reportDate: string;
  notes?: string;
  createdAt: string;
  aiSummary?: string;
  aiAbnormalities?: string[];
  aiRecommendations?: string[];
  healthMetrics?: Record<string, string>;
  followUpDate?: string;
}

const CATEGORIES = ['Auto-Detect (AI)', 'Blood Test', 'X-ray', 'MRI/CT Scan', 'Prescription', 'Medical Certificate', 'Other'];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function HealthReports() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewReport, setPreviewReport] = useState<ReportRecord | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');

  // Emergency Profile
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
     bloodGroup: '', allergies: '', chronicDiseases: '', currentMedications: ''
  });

  // Upload Form States
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Auto-Detect (AI)',
    reportDate: new Date().toISOString().split('T')[0],
    doctorName: '',
    hospitalName: '',
    notes: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReports();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
     try {
       const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${getToken()}` } });
       const data = await res.json();
       if (res.ok && data.success) {
          setUserProfile(data.user);
          setProfileForm({
             bloodGroup: data.user.bloodGroup || '',
             allergies: data.user.allergies?.join(', ') || '',
             chronicDiseases: data.user.chronicDiseases?.join(', ') || '',
             currentMedications: data.user.currentMedications?.join(', ') || ''
          });
       }
     } catch(e) {}
  };

  const fetchReports = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/reports`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      // Auto-fill title based on filename if empty
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: selected.name.split('.')[0] }));
      }
      setShowUploadForm(true);
    }
  };

  const handleFormInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return borderWarning();

    setUploading(true);
    const payload = new FormData();
    payload.append('report', file);
    payload.append('title', formData.title);
    payload.append('category', formData.category);
    payload.append('reportDate', formData.reportDate);
    payload.append('doctorName', formData.doctorName);
    payload.append('hospitalName', formData.hospitalName);
    payload.append('notes', formData.notes);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/reports/upload`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` }, 
        body: payload 
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setReports([data.report, ...reports]);
        setShowUploadForm(false);
        setFile(null);
        setFormData({ title: '', category: 'Auto-Detect (AI)', reportDate: new Date().toISOString().split('T')[0], doctorName: '', hospitalName: '', notes: '' });
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error', err);
      alert('Upload failed. Please check your network and try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
     try {
       await fetch(`${API_BASE_URL}/api/reports/${id}/notes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ notes })
       });
       setReports(prev => prev.map(r => r._id === id ? { ...r, notes } : r));
       if (previewReport && previewReport._id === id) {
          setPreviewReport({ ...previewReport, notes });
       }
     } catch (e) {
       console.error(e);
     }
  };

  const saveEmergencyProfile = async () => {
     try {
       const payload = {
          bloodGroup: profileForm.bloodGroup,
          allergies: profileForm.allergies.split(',').map(s=>s.trim()).filter(Boolean),
          chronicDiseases: profileForm.chronicDiseases.split(',').map(s=>s.trim()).filter(Boolean),
          currentMedications: profileForm.currentMedications.split(',').map(s=>s.trim()).filter(Boolean),
       };
       const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(payload)
       });
       if (res.ok) {
          fetchProfile();
          setEditingProfile(false);
       }
     } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/reports/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(reports.filter(r => r._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const borderWarning = () => alert("Please select a file first!");

  // Filter and group reports
  const { filteredReports, groupedTimeline } = useMemo(() => {
    let filtered = reports.filter(r => {
      // Search
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (r.doctorName && r.doctorName.toLowerCase().includes(searchQuery.toLowerCase()));
      // Category Filter
      const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
      
      // Date filter
      let matchesDate = true;
      const reportDate = new Date(r.reportDate).getTime();
      const now = Date.now();
      if (dateFilter === 'Last 30 Days') matchesDate = (now - reportDate) <= 30 * 24 * 60 * 60 * 1000;
      if (dateFilter === 'Last 6 Months') matchesDate = (now - reportDate) <= 180 * 24 * 60 * 60 * 1000;
      if (dateFilter === 'This Year') matchesDate = new Date(r.reportDate).getFullYear() === new Date().getFullYear();

      return matchesSearch && matchesCategory && matchesDate;
    });

    // Sort by reportDate DESC
    filtered.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

    // Group for timeline
    const timeline: Record<string, ReportRecord[]> = {};
    filtered.forEach(r => {
      const date = new Date(r.reportDate);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!timeline[monthYear]) timeline[monthYear] = [];
      timeline[monthYear].push(r);
    });

    return { filteredReports: filtered, groupedTimeline: timeline };
  }, [reports, searchQuery, categoryFilter, dateFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Health Reports</h1>
          <p className="text-muted mt-1">Manage, preview, and organize your clinical documents</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,image/*" />
          <button
            onClick={showUploadForm ? () => setShowUploadForm(false) : handleUploadClick}
            className={`glow-button inline-flex items-center gap-2 px-6 py-2.5 transition-all ${showUploadForm ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30 glow-none' : ''}`}
          >
            {showUploadForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showUploadForm ? 'Cancel Upload' : 'Upload New Report'}
          </button>
        </div>
      </div>

      {/* EMERGENCY QUICK PROFILE */}
      {userProfile && (
         <div className="glass-panel p-5 border-l-4 border-l-red-500/80 mb-8 animate-in fade-in duration-300">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Emergency Profile
             </h2>
             <button onClick={() => setEditingProfile(!editingProfile)} className="text-sm text-primary hover:text-primary-light">
               {editingProfile ? 'Cancel' : 'Edit Details'}
             </button>
           </div>
           
           {editingProfile ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
               <div><label className="text-xs text-muted">Blood Group</label><input className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-lg py-1.5 px-3 mb-1 text-sm outline-none transition-all placeholder:text-muted/40" value={profileForm.bloodGroup} onChange={e=>setProfileForm({...profileForm, bloodGroup: e.target.value})} placeholder="e.g. O+" /></div>
               <div><label className="text-xs text-muted">Allergies</label><input className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-lg py-1.5 px-3 mb-1 text-sm outline-none transition-all placeholder:text-muted/40" value={profileForm.allergies} onChange={e=>setProfileForm({...profileForm, allergies: e.target.value})} placeholder="Peanuts, Penicillin..." /></div>
               <div><label className="text-xs text-muted">Chronic Diseases</label><input className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-lg py-1.5 px-3 mb-1 text-sm outline-none transition-all placeholder:text-muted/40" value={profileForm.chronicDiseases} onChange={e=>setProfileForm({...profileForm, chronicDiseases: e.target.value})} placeholder="Asthma, Diabetes..." /></div>
               <div><label className="text-xs text-muted">Current Meds</label><input className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-lg py-1.5 px-3 mb-1 text-sm outline-none transition-all placeholder:text-muted/40" value={profileForm.currentMedications} onChange={e=>setProfileForm({...profileForm, currentMedications: e.target.value})} placeholder="Metformin 500mg..." /></div>
               <button onClick={saveEmergencyProfile} className="glow-button py-2 col-span-1 sm:col-span-2 lg:col-span-4 mt-2">Save Profile</button>
             </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
               <div><p className="text-xs text-muted uppercase tracking-wider mb-1">Blood Group</p><p className="text-sm font-semibold text-white">{userProfile.bloodGroup || 'Not Specified'}</p></div>
               <div><p className="text-xs text-muted uppercase tracking-wider mb-1">Allergies</p><p className="text-sm font-semibold text-white">{userProfile.allergies?.length ? userProfile.allergies.join(', ') : 'None Reported'}</p></div>
               <div><p className="text-xs text-muted uppercase tracking-wider mb-1">Chronic Issues</p><p className="text-sm font-semibold text-white">{userProfile.chronicDiseases?.length ? userProfile.chronicDiseases.join(', ') : 'None Reported'}</p></div>
               <div><p className="text-xs text-muted uppercase tracking-wider mb-1">Current Meds</p><p className="text-sm font-semibold text-white">{userProfile.currentMedications?.length ? userProfile.currentMedications.join(', ') : 'None Reported'}</p></div>
             </div>
           )}
         </div>
      )}

      {/* HEALTH TRENDS (AI Extracted) */}
      {reports.some(r => r.healthMetrics && Object.keys(r.healthMetrics).length > 0) && (
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Tracked Metrics</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from(new Set(reports.flatMap(r => Object.keys(r.healthMetrics || {})))).slice(0, 5).map(metricKey => {
               // Get most recent value
               const latestReport = reports.find(r => r.healthMetrics?.[metricKey]);
               // Formatting key nicely
               const name = metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
               return (
                  <div key={metricKey} className="glass-panel min-w-[150px] p-4 flex-shrink-0 border-primary/20">
                    <p className="text-xs text-muted truncate">{name}</p>
                    <p className="text-xl font-bold text-white mt-1">{latestReport?.healthMetrics?.[metricKey]}</p>
                    <p className="text-[10px] text-muted/70 mt-1">from {new Date(latestReport?.reportDate || '').toLocaleDateString()}</p>
                  </div>
               )
            })}
          </div>
        </div>
      )}

      {/* Upload Form Panel */}
      {showUploadForm && (
        <div className="glass-panel p-6 sm:p-8 border-primary/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-divider pb-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Upload Document Details</h2>
              <p className="text-sm text-muted mt-1">Add metadata to organize your report.</p>
            </div>
            {file && (
              <div className="bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 flex items-center gap-2 text-primary text-sm font-medium">
                {file.type.includes('pdf') ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
            )}
          </div>
          
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/90">Report Title *</label>
                <input required type="text" name="title" value={formData.title} onChange={handleFormInputChange} placeholder="e.g. Annual Blood Test" className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-xl px-4 py-2.5 outline-none transition-all placeholder:text-muted/40" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/90">Category *</label>
                <select required name="category" value={formData.category} onChange={handleFormInputChange} className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-xl px-4 py-2.5 outline-none transition-all appearance-none cursor-pointer">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-background text-white">{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/90">Report Date *</label>
                <input required type="date" name="reportDate" value={formData.reportDate} onChange={handleFormInputChange} className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-xl px-4 py-2.5 outline-none transition-all [color-scheme:dark]" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/90">Doctor Name (Optional)</label>
                <input type="text" name="doctorName" value={formData.doctorName} onChange={handleFormInputChange} placeholder="e.g. Dr. Emily Chen" className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-xl px-4 py-2.5 outline-none transition-all placeholder:text-muted/40" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/90">Hospital/Lab Name (Optional)</label>
                <input type="text" name="hospitalName" value={formData.hospitalName} onChange={handleFormInputChange} placeholder="e.g. City General Hospital" className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-xl px-4 py-2.5 outline-none transition-all placeholder:text-muted/40" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">Additional Notes (Optional)</label>
              <textarea name="notes" value={formData.notes} onChange={handleFormInputChange} placeholder="Any specific instructions or remarks..." className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-xl px-4 py-3 outline-none transition-all placeholder:text-muted/40 min-h-[100px] resize-y" />
            </div>

            <div className="flex justify-end pt-2">
              <button disabled={uploading || !file} type="submit" className="glow-button inline-flex items-center gap-2 px-8 py-3 disabled:opacity-60 text-lg">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {uploading ? 'Processing Intelligence...' : 'Save Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" placeholder="Search reports, doctors, or categories..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-transparent focus:border-primary/50 text-white rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all placeholder:text-muted/60"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Filter className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
            <select 
              value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto min-w-[140px] bg-white/5 border border-transparent focus:border-primary/50 text-white rounded-xl py-2.5 pl-9 pr-4 outline-none appearance-none transition-all"
            >
              <option value="All" className="bg-dark">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-dark">{c}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
            <select 
              value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="w-full sm:w-auto min-w-[140px] bg-white/5 border border-transparent focus:border-primary/50 text-white rounded-xl py-2.5 pl-9 pr-4 outline-none appearance-none transition-all"
            >
              {['All Time', 'Last 30 Days', 'Last 6 Months', 'This Year'].map(o => <option key={o} value={o} className="bg-dark">{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {loading ? (
        <div className="flex items-center justify-center p-20 text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-panel p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <FileIcon className="w-8 h-8 text-muted/50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Reports Found</h3>
          <p className="text-muted max-w-sm mb-6">
            {searchQuery || categoryFilter !== 'All' ? "Try adjusting your search or filters to find what you're looking for." : "Upload your first health document to start building your clinical timeline."}
          </p>
          {!searchQuery && categoryFilter === 'All' && (
             <button onClick={handleUploadClick} className="text-primary font-medium hover:text-white transition-colors">
               + Add a Document
             </button>
          )}
        </div>
      ) : (
        <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 md:before:ml-6 before:-translate-x-px md:before:translate-x-0 before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-white/5 before:to-transparent">
          {Object.entries(groupedTimeline).map(([monthYear, groupReports]) => (
            <div key={monthYear} className="relative">
              {/* Timeline Header */}
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-dark border-4 border-background flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">{monthYear}</h3>
                <div className="h-px flex-1 bg-white/10 ml-4 hidden sm:block" />
              </div>

              {/* Grid of Report Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ml-12 md:ml-16">
                {groupReports.map(report => (
                  <div key={report._id} className="glass-panel p-5 group hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                          {report.fileType.includes('pdf') ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-0.5 rounded-lg mb-1 inline-block">
                            {report.category}
                          </span>
                          <h4 className="text-base font-semibold text-white truncate max-w-[200px]" title={report.title}>
                            {report.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-white/50 bg-white/5 px-2.5 py-1 rounded-md">
                        {new Date(report.reportDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    <div className="space-y-2 mb-6">
                      {report.doctorName && (
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Stethoscope className="w-4 h-4 text-white/40" />
                          <span className="truncate">{report.doctorName}</span>
                        </div>
                      )}
                      {(report.doctorName && report.hospitalName) && <div className="hidden">...</div>}
                      {report.hospitalName && (
                        <div className="flex items-center gap-2 text-sm text-muted">
                           <span className="w-4 h-4 inline-flex items-center justify-center text-white/40 text-[10px] font-bold border border-white/20 rounded-sm">H</span>
                          <span className="truncate">{report.hospitalName}</span>
                        </div>
                      )}
                      {!report.doctorName && !report.hospitalName && (
                        <p className="text-sm text-muted/50 italic">No facility details added.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                      <button 
                        onClick={() => setPreviewReport(report)}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      <button 
                         onClick={() => {
                            const a = document.createElement('a'); 
                            a.href = report.fileUrl; 
                            a.download = report.title; 
                            a.target = '_blank'; 
                            a.click();
                         }}
                         className="p-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                         title="Download / Open Original"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(report._id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-divider rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-divider bg-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {previewReport.fileType.includes('pdf') ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-white">{previewReport.title}</h3>
                    <p className="text-xs text-muted">
                      {previewReport.category} • {new Date(previewReport.reportDate).toLocaleDateString()}
                    </p>
                 </div>
              </div>
              <button 
                onClick={() => setPreviewReport(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 bg-black/50 overflow-auto flex items-center justify-center p-4">
              {previewReport.fileType.includes('pdf') ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl overflow-hidden p-2 relative group">
                   <img 
                      src={previewReport.fileUrl.replace(/\.pdf$/i, '.jpg')} 
                      alt={previewReport.title} 
                      className="w-full h-full object-contain"
                   />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <a href={previewReport.fileUrl} target="_blank" rel="noreferrer" className="bg-primary text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-xl">
                        <Download className="w-5 h-5" /> Download Full PDF
                      </a>
                   </div>
                </div>
              ) : previewReport.fileType.startsWith('image/') ? (
                <img 
                  src={previewReport.fileUrl} 
                  alt={previewReport.title} 
                  className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                />
              ) : (
                <div className="text-center">
                  <FileIcon className="w-16 h-16 text-muted/50 mx-auto mb-4" />
                  <p className="text-white text-lg">Preview not available</p>
                  <a href={previewReport.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline mt-2 inline-block">Download file instead</a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-divider border-t border-divider">
              
              {/* Left Side: AI Intelligence */}
              <div className="bg-dark p-6 space-y-8 overflow-y-auto max-h-[40vh] scrollbar-thin scrollbar-thumb-white/10">
                 <div className="flex items-center gap-3 text-primary font-bold border-b border-white/10 pb-4">
                   <div className="w-2.5 h-2.5 text-primary bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(45,212,191,1)]" /> 
                   <span className="text-lg tracking-wide">AI Health Intelligence</span>
                 </div>

                 {previewReport.aiSummary && (
                    <div className="space-y-2">
                       <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">Summary</h4>
                       <div className="text-sm text-white/95 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 whitespace-pre-wrap shadow-inner">
                         {previewReport.aiSummary}
                       </div>
                    </div>
                 )}

                 {previewReport.aiAbnormalities && previewReport.aiAbnormalities.length > 0 && (
                    <div className="space-y-3">
                       <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                          ⚠ Abnormal Findings
                       </h4>
                       <ul className="space-y-3">
                         {previewReport.aiAbnormalities.map((item, idx) => (
                           <li key={idx} className="text-sm font-semibold text-red-100 bg-red-500/20 border-l-4 border-red-500 px-4 py-3 rounded-r-lg shadow-sm leading-relaxed">
                             {item}
                           </li>
                         ))}
                       </ul>
                    </div>
                 )}

                 {previewReport.aiRecommendations && previewReport.aiRecommendations.length > 0 && (
                    <div className="space-y-3">
                       <h4 className="text-sm font-bold text-primary/90 uppercase tracking-wider flex items-center gap-2">
                          💡 Practical Advice & Discussion
                       </h4>
                       <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 shadow-sm">
                         <p className="text-xs font-semibold text-primary/70 mb-3 uppercase tracking-wide">You may want to ask your doctor about:</p>
                         <ul className="list-disc pl-5 space-y-2">
                           {previewReport.aiRecommendations.map((item, idx) => (
                             <li key={idx} className="text-sm font-medium text-white/80 leading-relaxed">{item}</li>
                           ))}
                         </ul>
                       </div>
                    </div>
                 )}
                 
                 {!previewReport.aiSummary && (
                   <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center my-8">
                     <p className="text-sm text-muted font-medium">No AI insights generated for this report.</p>
                   </div>
                 )}

                 <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center mt-6">
                    <p className="text-[11px] text-red-300/80 font-semibold tracking-widest uppercase">⚠ This is not a medical diagnosis. Please consult your doctor.</p>
                 </div>
              </div>

              {/* Right Side: Doctor Notes */}
              <div className="bg-black/40 p-6 flex flex-col">
                 <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" /> Doctor Advice & Instructions
                 </h4>
                 <textarea 
                    className="flex-1 w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white rounded-xl resize-none min-h-[150px] p-4 text-sm leading-relaxed outline-none transition-all placeholder:text-muted/40 shadow-inner"
                    placeholder="Enter notes, precautions, or next visit dates here..."
                    defaultValue={previewReport.notes || ''}
                    onBlur={(e) => {
                       if (e.target.value !== previewReport.notes) {
                          handleUpdateNotes(previewReport._id, e.target.value);
                       }
                    }}
                 />
                 <p className="text-xs text-muted mt-3">Changes are saved automatically when clicking outside.</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
