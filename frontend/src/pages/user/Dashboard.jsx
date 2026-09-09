import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiCalendar,
  FiHeart,
  FiBell,
  FiMapPin,
  FiMessageSquare,
  FiShield,
  FiArrowRight,
  FiTrendingDown,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiUploadCloud,
  FiFileText,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import VoiceSearchButton from '../../components/forms/VoiceSearchButton';
import PrescriptionUploadModal from '../../components/forms/PrescriptionUploadModal';

export default function UserDashboard() {
  const { user } = useAuth();
  const [quickQuery, setQuickQuery] = useState('');
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(quickQuery.trim())}`);
    } else {
      navigate('/dashboard/search');
    }
  };

  const handleVoiceResult = (spokenText) => {
    if (spokenText) {
      setQuickQuery(spokenText);
      navigate(`/dashboard/search?q=${encodeURIComponent(spokenText.trim())}`);
    }
  };


  const stats = [
    {
      label: 'Active Reservations',
      value: '0',
      desc: '24-hour guaranteed hold',
      icon: FiCalendar,
      gradient: 'from-cyan-500 to-blue-600',
      to: '/dashboard/reservations',
    },
    {
      label: 'My Orders',
      value: '0',
      desc: 'Track delivery & pickup',
      icon: FiPackage,
      gradient: 'from-emerald-500 to-teal-600',
      to: '/orders',
    },
    {
      label: 'Saved Pharmacies',
      value: '0',
      desc: 'Verified local stores',
      icon: FiHeart,
      gradient: 'from-purple-500 to-pink-600',
      to: '/dashboard/favourites',
    },
    {
      label: 'Live Alerts & Stock',
      value: '0',
      desc: 'Real-time updates',
      icon: FiBell,
      gradient: 'from-amber-500 to-orange-600',
      to: '/dashboard/notifications',
    },
  ];

  const quickPills = ['Paracetamol 500mg', 'Azithromycin', 'Pantoprazole', 'Amoxicillin'];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden text-white">
        {/* Ambient Decorative Glow Circles */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-primary-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            AI-Powered Medicine Availability & Smart Pharmacy Assistant
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Welcome back, <span className="bg-gradient-to-r from-cyan-400 via-primary-300 to-blue-200 bg-clip-text text-transparent">{user?.fullName?.split(' ')[0] || 'Patient'}</span> 👋
          </h1>

          <p className="mt-3 text-sm sm:text-base text-primary-100/90 leading-relaxed max-w-2xl">
            Search live pharmacy inventories in real time, compare pricing across neighborhood stores, and reserve critical prescriptions in seconds.
          </p>

          {/* Integrated Quick Search Bar */}
          <form
            onSubmit={handleQuickSearch}
            className="mt-6 flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-white/20 bg-slate-900/60 p-2 shadow-2xl backdrop-blur-xl focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/20 transition-all max-w-2xl"
          >
            <div className="flex flex-1 items-center gap-2 w-full px-3 text-white">
              <FiSearch size={20} className="text-cyan-300 shrink-0" />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Search medicine or speak (e.g. Paracetamol, Amoxicillin)..."
                className="w-full bg-transparent py-2.5 text-sm sm:text-base text-white placeholder:text-primary-200/60 focus:outline-none"
              />
              <VoiceSearchButton
                onVoiceResult={handleVoiceResult}
                size="md"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto btn-primary bg-gradient-to-r from-cyan-500 to-primary-600 hover:from-cyan-600 hover:to-primary-700 text-white rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg shadow-cyan-500/25 shrink-0"
            >
              Search Stock <FiArrowRight size={15} />
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-primary-200/80">
            <span className="font-semibold text-cyan-300">Quick queries:</span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => {
                  setQuickQuery(pill);
                  navigate(`/dashboard/search?q=${encodeURIComponent(pill)}`);
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20 transition-colors border border-white/10 hover:border-cyan-400/40"
              >
                ✚ {pill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Real-Time Telemetry Stats Cards */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/15 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${s.gradient} text-white shadow-lg shadow-black/20 transition-transform group-hover:scale-110`}>
                <s.icon size={22} />
              </div>
              <span className="text-3xl font-black text-white">{s.value}</span>
            </div>
            <h3 className="mt-4 text-base font-bold text-white group-hover:text-cyan-300 transition-colors">{s.label}</h3>
            <p className="mt-0.5 text-xs text-primary-200/70">{s.desc}</p>
          </Link>
        ))}
      </section>

      {/* Feature Action Grid */}
      <section className="grid gap-6 md:grid-cols-3">
        {/* Medicine Autocomplete Module Card */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-lg shadow-cyan-500/20">
                <FiSearch size={22} />
              </div>
              <span className="badge-available">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
              </span>
            </div>
            <h3 className="mt-5 text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
              Medicine Autocomplete & Search
            </h3>
            <p className="mt-2 text-sm text-primary-100/80 leading-relaxed">
              Instant debounced search matching brand names and generic molecules across every licensed partner pharmacy.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
            <Link
              to="/dashboard/search"
              className="btn-primary py-2.5 px-4 text-xs font-bold"
            >
              Open Search <FiArrowRight size={14} />
            </Link>
            <span className="text-xs text-cyan-300/80 font-medium">300ms Lookup</span>
          </div>
        </div>

        {/* Prescription Scan & OCR Module Card */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-cyan-500 text-white shadow-lg shadow-primary-500/20">
                <FiUploadCloud size={22} />
              </div>
              <span className="badge-prescription">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" /> Smart OCR
              </span>
            </div>
            <h3 className="mt-5 text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
              Prescription OCR Scan
            </h3>
            <p className="mt-2 text-sm text-primary-100/80 leading-relaxed">
              Upload prescription images to automatically extract medicine names, compare prices, and check local stock.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPrescriptionModalOpen(true)}
              className="btn-secondary py-2.5 px-4 text-xs font-bold text-cyan-300 border-cyan-400/40 bg-cyan-950/60 hover:bg-cyan-900/60 flex items-center gap-1.5"
            >
              <FiFileText size={14} /> Scan Prescription
            </button>
            <span className="text-xs text-primary-200/70">JPG / PNG</span>
          </div>
        </div>

        {/* AI Assistant Module Card */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white shadow-lg shadow-blue-500/20">
                <FiMessageSquare size={22} />
              </div>
              <span className="badge-otc">24/7 Companion</span>
            </div>
            <h3 className="mt-5 text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
              MediFindAI Assistant
            </h3>
            <p className="mt-2 text-sm text-primary-100/80 leading-relaxed">
              Ask about medicine availability, compare store prices, and check prescription guidelines using our chatbot.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
            <Link
              to="/dashboard/search"
              className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              Explore Catalog <FiArrowRight size={13} />
            </Link>
            <span className="text-xs text-primary-200/70">Always Ready</span>
          </div>
        </div>
      </section>

      {/* Safety Notice Strip */}
      <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl text-xs text-primary-100/80 flex items-start gap-3.5 shadow-xl">
        <FiShield size={20} className="shrink-0 text-cyan-400 mt-0.5" />
        <div>
          <p className="font-bold text-white text-sm mb-0.5">Medical Safety & Verified Inventory Notice</p>
          <p className="leading-relaxed">
            MediFindAI connects patients to licensed pharmacies for real-time inventory and pricing. MediFindAI does not provide medical advice, diagnosis, or dosage recommendations. Always consult a certified healthcare professional.
          </p>
        </div>
      </div>

      {/* Prescription Upload Modal */}
      <PrescriptionUploadModal
        isOpen={prescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
        onSelectMedicine={(medName) => {
          navigate(`/dashboard/search?q=${encodeURIComponent(medName)}`);
        }}
      />
    </div>
  );
}


