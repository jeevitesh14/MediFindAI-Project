import { FiClock, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';

/** Used for any feature module page that is architected on the backend. */
export default function ComingSoon({ title, description }) {
  return (
    <div className="rounded-4xl border border-white/15 bg-white/10 max-w-xl mx-auto flex flex-col items-center gap-5 text-center py-14 px-8 backdrop-blur-2xl shadow-2xl text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-lg shadow-cyan-500/25">
        <FiClock size={28} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-primary-200/70 leading-relaxed max-w-md">
          {description || 'This module is fully architected on the backend and will be activated in upcoming rollouts.'}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        <Link to="/dashboard/search" className="btn-primary text-xs py-2.5 px-5">
          <FiSearch size={14} /> Search Medicines
        </Link>
        <Link to="/dashboard" className="btn-secondary text-xs py-2.5 px-5">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

