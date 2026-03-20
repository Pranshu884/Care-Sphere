import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const dashboardPaths = ['/dashboard', '/symptom-checker', '/appointments', '/medicine-reminder', '/stress-tracker', '/health-reports', '/profile'];

export default function Layout() {
  const location = useLocation();
  const showSidebar = dashboardPaths.includes(location.pathname);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'lg:ml-0' : ''}`}>
          <Outlet />
        </main>
      </div>
        <Footer />
    </div>
  );
}
