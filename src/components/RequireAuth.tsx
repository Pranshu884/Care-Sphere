import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getMe, logoutUser } from '../lib/auth';
import { Activity } from 'lucide-react';

export default function RequireAuth() {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('caresphere_token');
    if (!token) {
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    getMe().then(res => {
      if (res.ok) {
        setIsValid(true);
      } else {
        logoutUser(); // nuclear wipe and redirect to login
        setIsValid(false);
      }
      setIsValidating(false);
    });
  }, []);

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Activity className="w-10 h-10 animate-bounce" />
        <span className="text-sm font-semibold tracking-widest uppercase animate-pulse">Securing connection...</span>
      </div>
    );
  }

  if (!isValid) return <Navigate to="/login" replace />;
  return <Outlet />;
}
