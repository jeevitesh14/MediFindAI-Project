import { Link } from 'react-router-dom';
import { FiShieldOff, FiArrowRight } from 'react-icons/fi';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 px-4 text-center text-white relative overflow-hidden">
      {/* Decorative Glowing Radial Dot Pattern & Ambient Blur */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38a6f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-2xl backdrop-blur-md">
        <FiShieldOff size={36} />
      </div>
      <div className="relative z-10 max-w-md">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Access Denied</h1>
        <p className="mt-2 text-sm text-primary-200/70 leading-relaxed">
          You do not have administrative or authorized permissions to view this section with your current account credentials.
        </p>
      </div>
      <Link to="/" className="relative z-10 btn-primary py-3 px-8 text-sm font-bold shadow-lg shadow-cyan-500/25">
        Return Home <FiArrowRight size={16} />
      </Link>
    </div>
  );
}

