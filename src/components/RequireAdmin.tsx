import { Navigate, Outlet } from 'react-router-dom';

export default function RequireAdmin() {
  const isLoggedIn = !!localStorage.getItem('caresphere_token');
  const role = localStorage.getItem('role') || 'user'; // Defaults to user if empty

  if (!isLoggedIn || role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
