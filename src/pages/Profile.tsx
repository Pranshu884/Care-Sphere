import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Activity, 
  AlertTriangle, CheckCircle, Camera, Loader2
} from 'lucide-react';
import { 
  getMe, setSessionUser, clearSessionUser, clearToken, 
  updateUserProfile, updateHealthSummary,
  deleteAccount, type CareUser 
} from '../lib/auth';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';


function calculateAge(dob: string, fallbackAge?: number | string) {
  if (!dob) return fallbackAge || '-';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return fallbackAge || '-';
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age <= 0 || age > 120) {
    return fallbackAge || '-';
  }
  
  return age;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<CareUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Forms
  const [personalEdit, setPersonalEdit] = useState(false);
  const [healthEdit, setHealthEdit] = useState(false);
  
  const [personalForm, setPersonalForm] = useState({ dob: '', gender: '', city: '', emergencyName: '', emergencyPhone: '' });
  const [healthForm, setHealthForm] = useState({ bloodGroup: '', height: '', weight: '' });


  
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingHealth, setIsSavingHealth] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getMe();
      if (!mounted) return;
      if (res.ok) {
        initForms(res.user);
        setUser(res.user);
      } else {
        clearToken();
        clearSessionUser();
        navigate('/login');
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const initForms = (u: CareUser) => {
    setPersonalForm({
      dob: u.dob || '',
      gender: u.gender || '',
      city: u.city || '',
      emergencyName: u.emergencyContact?.name || '',
      emergencyPhone: u.emergencyContact?.phone || ''
    });
    setHealthForm({
      bloodGroup: u.bloodGroup || '',
      height: u.height ? String(u.height) : '',
      weight: u.weight ? String(u.weight) : ''
    });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Handlers ---
  const handlePersonalSave = async () => {
    setIsSavingPersonal(true);
    try {
      const res = await updateUserProfile({
        dob: personalForm.dob,
        gender: personalForm.gender,
        city: personalForm.city,
        emergencyContact: { name: personalForm.emergencyName, phone: personalForm.emergencyPhone }
      });
      if (res.ok && res.user) {
        setUser(res.user);
        setSessionUser(res.user);
        setPersonalEdit(false);
        showToast('Personal details updated successfully.', 'success');
      } else {
        showToast(res.reason || 'Failed to update.', 'error');
      }
    } catch (e) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleHealthSave = async () => {
    setIsSavingHealth(true);
    try {
      const res = await updateHealthSummary({
        bloodGroup: healthForm.bloodGroup,
        height: Number(healthForm.height) || undefined,
        weight: Number(healthForm.weight) || undefined
      });
      if (res.ok && res.user) {
        setUser(res.user);
        setSessionUser(res.user);
        setHealthEdit(false);
        showToast('Health summary updated.', 'success');
      } else {
        showToast(res.reason || 'Failed to update health.', 'error');
      }
    } catch (e) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSavingHealth(false);
    }
  };

  const handleCancelPersonal = () => {
    if (user) initForms(user);
    setPersonalEdit(false);
  };

  const handleCancelHealth = () => {
    if (user) initForms(user);
    setHealthEdit(false);
  };


  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) {
      showToast('Email does not match.', 'error');
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteAccount();
      if (res.ok) {
        clearToken();
        clearSessionUser();
        navigate('/login');
      } else {
        showToast(res.reason, 'error');
      }
    } catch (e) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading profile...</div>;
  if (!user) return null;

  return (
    <div className="w-full bg-[#0f1117] min-h-full">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans text-white">
        
        {/* Global Toast */}
        {toast && (
          <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 animate-in slide-in-from-top-2
            ${toast.type === 'success' ? 'bg-[#58d9b0]/10 border-[#58d9b0]/20 text-[#58d9b0]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium text-[13px]">{toast.message}</span>
          </div>
        )}

        {/* GREETING SECTION */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-medium text-white/90 tracking-tight">
              Profile Settings
            </h1>
            <p className="text-[13px] text-[#8b92a5] mt-1 font-medium">
              Manage your personal information and security preferences
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[14px] font-medium text-white">{user.name}</p>
              <p className="text-[12px] text-[#8b92a5]">{user.email}</p>
            </div>
            <div className="w-12 h-12 rounded-[10px] bg-[#13151e] border border-[#1e2130] flex items-center justify-center text-[#58d9b0] text-[16px] font-bold uppercase overflow-hidden relative group">
              {user.name.substring(0, 2)}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* LEFT: PERSONAL DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            
            <div>
              <SectionHeader title="Personal Details" colorHex="#58d9b0" />
              <Card>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[14px] font-medium text-white/90">Information</h3>
                  {!personalEdit ? (
                    <button onClick={() => setPersonalEdit(true)} className="text-[12px] font-medium text-[#58d9b0] hover:text-white transition-colors">Edit</button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button onClick={handleCancelPersonal} disabled={isSavingPersonal} className="text-[12px] font-medium text-[#8b92a5] hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                      <button onClick={handlePersonalSave} disabled={isSavingPersonal} className="flex items-center gap-2 text-[12px] font-medium bg-[#58d9b0] text-[#0d1117] px-3 py-1 rounded-[6px] hover:bg-[#4ac59f] transition-colors disabled:opacity-50">
                        {isSavingPersonal && <Loader2 className="w-3 h-3 animate-spin" />}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-[#8b92a5] mb-1.5 uppercase tracking-wider font-medium">Full Name</label>
                    <div className="text-[13px] text-white/90 font-medium">{user.name}</div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8b92a5] mb-1.5 uppercase tracking-wider font-medium">Email Address</label>
                    <div className="text-[13px] text-white/90">{user.email}</div>
                  </div>
                  <div className="pt-2 border-t border-[#1e2130]"></div>
                  
                  <div>
                    <label className="block text-[11px] text-[#8b92a5] mb-1.5 uppercase tracking-wider font-medium">Date of Birth</label>
                    {personalEdit ? (
                      <Input type="date" value={personalForm.dob} onChange={e => setPersonalForm({...personalForm, dob: e.target.value})} className="[color-scheme:dark]" />
                    ) : <div className="text-[13px] text-white/90">{user.dob || 'Not provided'}</div>}
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#8b92a5] mb-1.5 uppercase tracking-wider font-medium">Gender</label>
                    {personalEdit ? (
                      <Select
                        value={personalForm.gender}
                        onChange={val => setPersonalForm({...personalForm, gender: val})}
                        options={[
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'other', label: 'Other' },
                          { value: 'prefer-not', label: 'Prefer not to say' }
                        ]}
                        className="w-full"
                      />
                    ) : <div className="text-[13px] text-white/90 capitalize">{user.gender || 'Not provided'}</div>}
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#8b92a5] mb-1.5 uppercase tracking-wider font-medium">City</label>
                    {personalEdit ? (
                      <Input type="text" value={personalForm.city} onChange={e => setPersonalForm({...personalForm, city: e.target.value})} placeholder="e.g. New York" />
                    ) : <div className="text-[13px] text-white/90">{user.city || 'Not provided'}</div>}
                  </div>

                  <div className="pt-4 border-t border-[#1e2130]">
                    <label className="block text-[11px] text-[#8b92a5] mb-2 uppercase tracking-wider font-medium">Emergency Contact</label>
                    {personalEdit ? (
                      <div className="space-y-2">
                        <Input type="text" value={personalForm.emergencyName} onChange={e => setPersonalForm({...personalForm, emergencyName: e.target.value})} placeholder="Contact Name" />
                        <Input type="text" value={personalForm.emergencyPhone} onChange={e => setPersonalForm({...personalForm, emergencyPhone: e.target.value})} placeholder="Contact Phone" />
                      </div>
                    ) : (
                      <div className="text-[13px] text-white/90">
                        {user.emergencyContact?.name ? `${user.emergencyContact.name} (${user.emergencyContact.phone})` : 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* RIGHT: HEALTH SUMMARY & DANGER ZONE */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Health Summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Health Summary" colorHex="#9b82f5" className="mb-0" />
                {!healthEdit ? (
                  <button onClick={() => setHealthEdit(true)} className="text-[12px] font-medium text-[#9b82f5] hover:text-white transition-colors">Edit metrics</button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button onClick={handleCancelHealth} disabled={isSavingHealth} className="text-[12px] font-medium text-[#8b92a5] hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                    <button onClick={handleHealthSave} disabled={isSavingHealth} className="flex items-center gap-2 text-[12px] font-medium bg-[#9b82f5] text-white px-3 py-1 rounded-[6px] hover:bg-[#856de3] transition-colors disabled:opacity-50">
                      {isSavingHealth && <Loader2 className="w-3 h-3 animate-spin" />}
                      Save
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard 
                  title="Blood Type" 
                  value={healthEdit ? (
                    <Select
                      value={healthForm.bloodGroup}
                      onChange={val => setHealthForm({...healthForm, bloodGroup: val})}
                      options={[
                        { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                        { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                        { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }
                      ]}
                      className="w-full text-left bg-transparent border-none px-0"
                    />
                  ) : (user.bloodGroup || '-')}
                  icon={Activity}
                  iconColorClass="text-red-400"
                  iconBgClass="bg-red-400/10"
                />
                
                <StatCard 
                  title="Age" 
                  value={calculateAge(user.dob || '', user.age)}
                  icon={User}
                  iconColorClass="text-[#1a7fe0]"
                  iconBgClass="bg-[#1a7fe0]/10"
                />
                
                <StatCard 
                  title="Height (cm)" 
                  value={healthEdit ? (
                    <Input type="number" value={healthForm.height} onChange={e => setHealthForm({...healthForm, height: e.target.value})} placeholder="-" className="bg-transparent border-b border-t-0 border-l-0 border-r-0 border-[#1e2130] rounded-none px-0" />
                  ) : (user.height || '-')}
                  icon={Activity}
                  iconColorClass="text-[#2da65a]"
                  iconBgClass="bg-[#2da65a]/10"
                />
                
                <StatCard 
                  title="Weight (kg)" 
                  value={healthEdit ? (
                    <Input type="number" value={healthForm.weight} onChange={e => setHealthForm({...healthForm, weight: e.target.value})} placeholder="-" className="bg-transparent border-b border-t-0 border-l-0 border-r-0 border-[#1e2130] rounded-none px-0" />
                  ) : (user.weight || '-')}
                  icon={Activity}
                  iconColorClass="text-[#d4860a]"
                  iconBgClass="bg-[#d4860a]/10"
                />
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <SectionHeader title="Danger Zone" colorHex="#ef4444" />
              <Card className="border-red-500/20 bg-red-500/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-medium text-red-400">Delete Account</h3>
                    <p className="text-[12px] text-red-400/70 mt-0.5">Permanently remove your account and all data</p>
                  </div>
                  <Button variant="danger" onClick={() => setDeleteModal(true)}>Delete Account</Button>
                </div>
              </Card>
            </div>

          </div>
        </div>

      </div>



      {deleteModal && (
        <div className="fixed inset-0 bg-[#0f1117]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-0 shadow-2xl border-red-500/20">
            <div className="p-5 border-b border-[#1e2130]">
              <h2 className="text-[15px] font-medium text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Delete Account</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-[#8b92a5] leading-relaxed">This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
              <p className="text-[13px] text-[#8b92a5]">Please type <strong className="text-white select-all">{user.email}</strong> to confirm.</p>
              <Input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setDeleteModal(false); setDeleteConfirm(''); }} disabled={isDeleting}>Cancel</Button>
                <Button type="button" variant="danger" onClick={handleDeleteAccount} disabled={deleteConfirm !== user.email || isDeleting} className="flex items-center gap-2">
                  {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Delete My Account
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}


    </div>
  );
}
