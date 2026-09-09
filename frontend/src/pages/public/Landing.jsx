import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiMapPin,
  FiClock,
  FiCpu,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiTrendingDown,
  FiActivity,
  FiStar,
  FiMessageSquare,
  FiPhone,
  FiMail,
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const features = [
  {
    icon: FiSearch,
    title: 'Smart Autocomplete Search',
    desc: 'Instant 300ms debounced matching by brand name and generic molecule across every licensed partner pharmacy.',
    tag: 'Instant Lookup',
  },
  {
    icon: FiTrendingDown,
    title: 'Real-Time Price Comparison',
    desc: 'Compare live retail prices across nearby chemist stores to always get the best rate on your prescriptions.',
    tag: 'Save Money',
  },
  {
    icon: FiActivity,
    title: 'Live Stock Availability',
    desc: 'Never waste a trip. See exact quantity counts and stock statuses (Available, Low Stock, Out of Stock) updated in real time.',
    tag: 'Live Inventory',
  },
  {
    icon: FiClock,
    title: '24-Hour Medicine Hold',
    desc: 'Reserve required medicines online in seconds and pick them up at the counter within a 24-hour guaranteed hold window.',
    tag: 'No Queues',
  },
  {
    icon: FiCpu,
    title: 'MediFindAI Assistant',
    desc: 'Ask our smart healthcare assistant about medicine availability, nearest partner pharmacies, and prescription rules.',
    tag: 'AI Powered',
  },
  {
    icon: FiShield,
    title: '100% Verified Pharmacies',
    desc: 'Every partner store is verified with official state drug licensing, authentic pharmaceutical inventory, and quality standards.',
    tag: 'Certified Care',
  },
];

const steps = [
  {
    step: '01',
    title: 'Search Any Medicine',
    desc: 'Type as few as two letters to find brand names, generic formulations, and strengths.',
    icon: FiSearch,
  },
  {
    step: '02',
    title: 'Compare Live Stores',
    desc: 'View distance, stock counts, and prices across verified neighbourhood pharmacies.',
    icon: FiTrendingDown,
  },
  {
    step: '03',
    title: 'Reserve & Pick Up',
    desc: 'Lock in your medicine with one click and pick it up safely at the pharmacy counter.',
    icon: FiCheckCircle,
  },
];

const testimonials = [
  {
    name: 'Dr. Ramesh Gupta',
    role: 'Senior Physician, Apollo Care',
    quote: 'MediFindAI has transformed how my patients locate critical prescription drugs during urgent emergencies without running from shop to shop.',
    rating: 5,
  },
  {
    name: 'Ananya Sharma',
    role: 'Verified Patient',
    quote: 'Found my parents diabetes medication in 30 seconds at a pharmacy just 1 km away, and saved 20% on the total price. Truly incredible!',
    rating: 5,
  },
  {
    name: 'Suresh Reddy',
    role: 'Pharmacist & Partner Owner',
    quote: 'As a pharmacy owner, the automated inventory updates and customer reservations have cut down counter congestion significantly.',
    rating: 5,
  },
];

export default function Landing() {
  const [heroSearch, setHeroSearch] = useState('');
  const navigate = useNavigate();

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/dashboard/search');
    }
  };

  return (
    <div className="space-y-20 sm:space-y-28 overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 px-4 pt-20 pb-28 sm:px-6 lg:px-8 text-white">
        {/* Decorative Glowing SVG Grid & Blobs */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38a6f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30 mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            AI-Powered Medicine Availability & Smart Pharmacy Assistant
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white"
          >
            Find Medicines <span className="bg-gradient-to-r from-cyan-400 via-primary-300 to-blue-200 bg-clip-text text-transparent">Anytime, Anywhere.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-primary-100/85 leading-relaxed"
          >
            MediFindAI connects you with local pharmacies in real time — check live stock levels, compare prices, and reserve medicines for immediate pickup.
          </motion.p>

          {/* Instant Hero Search Teaser Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 mx-auto max-w-2xl"
          >
            <form
              onSubmit={handleHeroSearchSubmit}
              className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/20"
            >
              <div className="flex flex-1 items-center gap-3 w-full px-4 text-white">
                <FiSearch size={20} className="text-cyan-300 shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search medicine (e.g. Paracetamol, Amoxicillin, Cetirizine)..."
                  className="w-full bg-transparent py-2.5 text-sm sm:text-base text-white placeholder:text-primary-200/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto btn-primary bg-gradient-to-r from-cyan-500 to-primary-600 hover:from-cyan-600 hover:to-primary-700 text-white rounded-xl sm:rounded-2xl px-6 py-3 text-sm font-bold shadow-lg shadow-cyan-500/25"
              >
                Search Stock <FiArrowRight size={16} />
              </button>
            </form>

            {/* Quick search suggestions */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-primary-200/80">
              <span className="font-semibold text-primary-300">Popular:</span>
              {['Paracetamol 500mg', 'Azithromycin', 'Pantoprazole', 'Amoxicillin'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setHeroSearch(item);
                    navigate(`/dashboard/search?q=${encodeURIComponent(item)}`);
                  }}
                  className="rounded-full bg-white/10 px-2.5 py-0.5 hover:bg-white/20 transition-colors text-white"
                >
                  ✚ {item}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3.5"
          >
            <Link to="/medicines" className="btn-primary py-3 px-7 text-sm sm:text-base font-bold shadow-xl shadow-cyan-500/25">
              <FiSearch size={17} /> Find Your Medicine
            </Link>
            <Link
              to="/pharmacies"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm sm:text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <FiMapPin size={17} className="text-cyan-400" /> Locate Pharmacies
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-950/50 px-5 py-3 text-sm sm:text-base font-semibold text-cyan-300 backdrop-blur-md transition-all hover:bg-cyan-900/60"
            >
              Get Started Free <FiArrowRight size={17} />
            </Link>
          </motion.div>

          {/* Trust Highlights Strip */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-white/10 pt-10 text-left">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-300">100%</p>
              <p className="text-xs text-primary-200/80 mt-0.5">Verified Pharmacies</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-300">300ms</p>
              <p className="text-xs text-primary-200/80 mt-0.5">Fast Autocomplete</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-300">24h</p>
              <p className="text-xs text-primary-200/80 mt-0.5">Guaranteed Hold</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-300">24/7</p>
              <p className="text-xs text-primary-200/80 mt-0.5">AI Smart Assistant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30 mb-3">
            Engineered For Healthcare Access
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Everything You Need to <span className="bg-gradient-to-r from-cyan-400 via-primary-300 to-blue-200 bg-clip-text text-transparent">Find Medicine Faster</span>
          </h2>
          <p className="mt-3 text-base text-primary-100/80 leading-relaxed">
            Built from the ground up to solve medicine stockouts, opaque pricing, and long queues.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-lg shadow-cyan-500/20 transition-transform group-hover:scale-110">
                    <f.icon size={22} />
                  </div>
                  <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-400/30">
                    {f.tag}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-primary-100/80 leading-relaxed">{f.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">
                Learn more <FiArrowRight size={13} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-900/60 py-20 px-4 sm:px-6 lg:px-8 border-y border-white/10 text-white relative">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30 mb-3">
              Simple 3-Step Flow
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              How <span className="bg-gradient-to-r from-cyan-400 via-primary-300 to-blue-200 bg-clip-text text-transparent">MediFindAI Works</span>
            </h2>
            <p className="mt-3 text-base text-primary-100/80 leading-relaxed">
              Get from prescription to medicine in your hands in three seamless steps.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3 relative">
            {steps.map((s) => (
              <div key={s.step} className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl relative group hover:border-cyan-400/40 transition-all">
                <span className="text-4xl font-black text-cyan-400/40 leading-none">{s.step}</span>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-lg shadow-cyan-500/20">
                  <s.icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-primary-100/80 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Showcase Section */}
      <section id="ai-assistant" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-white">
        <div className="rounded-4xl border border-white/15 bg-gradient-to-tr from-primary-950 via-primary-900 to-cyan-950 p-8 sm:p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-4 shadow-lg shadow-cyan-900/30">
                <FiMessageSquare size={13} /> 24/7 Smart Companion
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Meet MediFindAI Assistant
              </h2>
              <p className="mt-4 text-base text-primary-100/90 leading-relaxed">
                Need to know where Paracetamol is in stock? Want to know whether your medicine requires a doctor’s prescription? Our built-in assistant is always available at the bottom-right corner of your screen.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <FiCheckCircle size={18} className="text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-primary-100">Zero external keys required — works immediately with built-in safe local fallback.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheckCircle size={18} className="text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-primary-100">Strict medical guardrails: never hallucinates diagnosis or dosage advice.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FiCheckCircle size={18} className="text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-primary-100">Instant direct links to pharmacy availability and price comparison.</p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Link to="/dashboard/search" className="btn-primary py-3.5 px-7 text-sm font-bold shadow-lg shadow-cyan-500/25">
                  Try Search Now <FiArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Mock Chat Card */}
            <div className="rounded-3xl border border-white/20 bg-slate-950/80 p-6 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-md shadow-cyan-500/25">
                  ✚
                </div>
                <div>
                  <p className="text-sm font-bold text-white">MediFindAI Assistant</p>
                  <p className="text-xs text-cyan-300">Online · Ready to help</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs sm:text-sm">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-none bg-gradient-to-r from-cyan-500 to-primary-600 text-white px-4 py-2.5 font-medium max-w-[80%] shadow-md">
                    Find Paracetamol 500mg
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none bg-white/10 border border-white/15 text-white px-4 py-3 max-w-[85%] space-y-1.5 backdrop-blur-md shadow-md">
                    <p>Found <strong>Paracetamol 500mg (Tablet)</strong>. Available at 3 partner pharmacies starting from ₹22.50.</p>
                    <p className="text-[11px] text-cyan-300">✓ Over-the-counter medication.</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 text-[11px] text-primary-200/80 flex items-center gap-1.5">
                <FiShield size={13} className="text-cyan-400 shrink-0" />
                MediFindAI does not provide medical advice. Consult a healthcare professional.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30 mb-3">
            Trusted In Healthcare
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            What Patients & <span className="bg-gradient-to-r from-cyan-400 via-primary-300 to-blue-200 bg-clip-text text-transparent">Doctors Say</span>
          </h2>
          <p className="mt-3 text-base text-primary-100/80 leading-relaxed">
            Empowering individuals and pharmacies across cities.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <FiStar key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-primary-100/90 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-sm font-bold text-white">{t.name}</p>
                <p className="text-xs text-cyan-300 font-semibold">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Support Section */}
      <section id="contact" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-white">
        <div className="rounded-4xl border border-white/15 bg-white/10 p-8 sm:p-12 backdrop-blur-2xl shadow-2xl">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Need Assistance?</span>
              <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                We’re Here to Help You Find Care
              </h3>
              <p className="mt-3 text-sm text-primary-100/80 leading-relaxed">
                Have questions about pharmacy onboarding, prescription verification, or searching for hard-to-find medications? Reach out to our 24/7 support desk.
              </p>

              <div className="mt-6 space-y-3 text-sm text-primary-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    <FiPhone size={16} />
                  </div>
                  <span>+91 (800) 555-MEDI (6334)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    <FiMail size={16} />
                  </div>
                  <span>support@medifindai.com</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl text-white">
              <h4 className="text-base font-bold text-white mb-2">Quick Search or Reservation</h4>
              <p className="text-xs text-primary-200/70 mb-4 leading-relaxed">
                Log in to reserve medicines at your nearest verified pharmacy or use our public search.
              </p>
              <div className="flex flex-col gap-2.5">
                <Link to="/register" className="btn-primary w-full text-center py-3 shadow-lg shadow-cyan-500/25">
                  Register as Patient
                </Link>
                <Link to="/login" className="btn-secondary w-full text-center py-3">
                  Log in to Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call To Action Banner */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-4xl bg-gradient-to-r from-cyan-600 via-primary-700 to-primary-900 px-8 py-16 text-center text-white shadow-2xl relative overflow-hidden border border-white/20">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              Ready to find your medicines faster?
            </h2>
            <p className="mt-4 text-base text-primary-100/90 leading-relaxed">
              Join thousands of patients and pharmacy partners using MediFindAI for real-time medicine availability.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <Link to="/register" className="btn-primary py-3.5 px-8 text-sm font-bold shadow-lg shadow-cyan-500/25">
                Create Free Account
              </Link>
              <Link to="/dashboard/search" className="btn-secondary py-3.5 px-8 text-sm font-semibold">
                Search Medicine
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

