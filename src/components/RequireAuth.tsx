import { Navigate, Outlet } from 'react-router-dom';

export default function RequireAuth() {
  const isLoggedIn = !!localStorage.getItem('caresphere_token');
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}

