import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 text-white relative overflow-hidden">
      {/* Decorative Radial Dot Grid Background & Ambient Glowing Spheres */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38a6f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 h-80 w-80 rounded-full bg-primary-600/15 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>

      {/* Dark Footer */}
      <Footer />
    </div>
  );
}

