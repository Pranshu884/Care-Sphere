import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getMe, logoutUser } from '../lib/auth';
import { Activity } from 'lucide-react';

export default function RequireDoctor() {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('caresphere_token');
    const role = localStorage.getItem('role') || 'user';
    
    if (!token || role !== 'doctor') {
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    getMe().then(res => {
      // Backend auth validation ensures security
      if (res.ok) {
        setIsValid(true);
      } else {
        logoutUser();
        setIsValid(false);
      }
      setIsValidating(false);
    });
  }, []);

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Activity className="w-10 h-10 animate-bounce" />
        <span className="text-sm font-semibold tracking-widest uppercase animate-pulse">Verifying Doctor Access...</span>
      </div>
    );
  }

  if (!isValid) return <Navigate to="/login" replace />;
  return <Outlet />;
}
