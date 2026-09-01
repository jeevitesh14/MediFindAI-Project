import { Link } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight, FiSearch } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 px-4 text-center text-white relative overflow-hidden">
      {/* Decorative Glowing Radial Dot Pattern & Ambient Blur */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38a6f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-2xl backdrop-blur-md">
        <FiAlertCircle size={36} />
      </div>
      <div className="relative z-10">
        <h1 className="text-7xl font-black bg-gradient-to-r from-cyan-400 via-primary-300 to-blue-200 bg-clip-text text-transparent">
          404
        </h1>
        <p className="mt-2 text-2xl font-bold text-white">Page Not Found</p>
        <p className="mt-2 text-sm text-primary-200/70 max-w-sm">
          The requested page could not be located or may have been moved.
        </p>
      </div>
      <div className="relative z-10 flex flex-wrap gap-3.5 justify-center mt-2">
        <Link to="/" className="btn-primary py-3 px-7 text-sm font-bold shadow-lg shadow-cyan-500/25">
          Return Home <FiArrowRight size={15} />
        </Link>
        <Link to="/dashboard/search" className="btn-secondary py-3 px-7 text-sm font-semibold">
          <FiSearch size={15} /> Search Medicines
        </Link>
      </div>
    </div>
  );
}

