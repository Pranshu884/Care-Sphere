import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f1117] font-sans">
      <Navbar />
      <div className="flex-1 flex w-full">
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
