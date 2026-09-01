import { FiSearch, FiCpu, FiMic, FiCamera, FiMapPin, FiActivity, FiTrendingDown, FiClock, FiBell, FiShoppingBag, FiShield, FiBarChart2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const modules = [
  { icon: FiSearch, title: 'Medicine Autocomplete Search', desc: 'Fast 300ms debounced search matching brand names and generic molecules.' },
  { icon: FiCpu, title: 'AI Medicine Assistant', desc: 'Safe chatbot for stock questions, prescription guidelines, and pharmacy guidance.' },
  { icon: FiTrendingDown, title: 'Price Comparison', desc: 'Compare live retail drug prices across all neighbourhood pharmacies.' },
  { icon: FiActivity, title: 'Real-Time Stock Tracking', desc: 'Instant visibility of Available, Low Stock, and Out of Stock inventory.' },
  { icon: FiClock, title: '24-Hour Medicine Reservation', desc: 'Lock in medications online and pick up seamlessly at the counter.' },
  { icon: FiMapPin, title: 'Nearby Pharmacy Finder', desc: 'Discover licensed chemist stores ranked by geolocation and distance.' },
  { icon: FiCamera, title: 'Prescription OCR Scanner', desc: 'Digitally extract prescribed medicine names directly from prescription slips.' },
  { icon: FiMic, title: 'Voice Search Assistant', desc: 'Hands-free voice querying for accessible medicine lookups.' },
  { icon: FiBell, title: 'Real-Time Notifications', desc: 'Instant status alerts for reservations, restocks, and order confirmations.' },
  { icon: FiShoppingBag, title: 'Pharmacy Inventory Portal', desc: 'Dedicated portal for licensed pharmacy owners to manage catalog and pricing.' },
  { icon: FiShield, title: 'Verified Pharmacy Network', desc: 'Stringent verification of drug licensing numbers and active status.' },
  { icon: FiBarChart2, title: 'Analytics & Trends', desc: 'Real-time telemetry on medication demand, fulfillment rates, and stock alerts.' },
];

export default function Features() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30">
          Core Capabilities
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
          Platform Features & <span className="bg-gradient-to-r from-cyan-400 via-primary-300 to-blue-200 bg-clip-text text-transparent">Architecture</span>
        </h1>
        <p className="mt-3 text-base text-primary-100/80 leading-relaxed">
          A comprehensive suite of tools connecting patients and healthcare providers in real time.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <div key={m.title} className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-lg shadow-cyan-500/20 transition-transform group-hover:scale-110">
                <m.icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">{m.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-primary-100/80 leading-relaxed">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-4xl border border-white/15 bg-gradient-to-r from-cyan-950 via-primary-950 to-slate-900 p-8 sm:p-12 text-center text-white shadow-2xl backdrop-blur-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold">Experience MediFindAI Today</h2>
        <p className="mt-2 text-sm sm:text-base text-primary-100/80 max-w-xl mx-auto">
          Start searching for medicines and comparing local pharmacy availability right now.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/dashboard/search" className="btn-primary py-3 px-7 text-sm font-bold shadow-lg shadow-cyan-500/25">
            Open Medicine Search
          </Link>
          <Link to="/register" className="btn-secondary py-3 px-7 text-sm font-semibold">
            Register Free
          </Link>
        </div>
      </div>
    </div>
  );
}

