import { FiShield, FiActivity } from 'react-icons/fi';

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-10 text-white">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30">
          Our Healthcare Mission
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
          About <span className="bg-gradient-to-r from-cyan-400 via-primary-300 to-blue-200 bg-clip-text text-transparent">MediFindAI</span>
        </h1>
        <p className="mt-3 text-base text-primary-100/80 leading-relaxed">
          Revolutionizing medicine discovery and pharmacy connectivity with artificial intelligence.
        </p>
      </div>

      <div className="rounded-4xl border border-white/15 bg-white/10 p-8 sm:p-10 space-y-6 text-sm sm:text-base text-primary-100/90 leading-relaxed backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-3.5 border-b border-white/10 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-lg shadow-cyan-500/25">
            ✚
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Bridging the Pharmacy Information Gap</h2>
            <p className="text-xs text-cyan-300 font-medium">Real-Time Healthcare Telemetry</p>
          </div>
        </div>

        <p>
          MediFindAI is an intelligent healthcare-technology platform engineered to connect patients with neighbourhood pharmacies in real time. We eliminate the frustration of searching multiple stores for out-of-stock prescription medications by providing transparent stock telemetry, instant price comparison, and guaranteed 24-hour holds.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-1.5">
              <FiActivity /> Live Inventory Sync
            </div>
            <p className="text-xs text-primary-100/80 leading-relaxed">
              Direct connection with licensed pharmacy catalogs ensures patients see real-time availability before traveling.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 border border-white/10">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-1.5">
              <FiShield /> Certified Safety
            </div>
            <p className="text-xs text-primary-100/80 leading-relaxed">
              Only verified pharmacies with valid drug license numbers and verified ownership can participate.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-xs text-primary-100/80 flex items-start gap-3.5 shadow-xl">
          <FiShield size={20} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white mb-0.5">Medical Safety Notice</p>
            <p className="leading-relaxed">
              MediFindAI is designed to facilitate medicine availability and pharmacy discovery. MediFindAI does not provide medical advice, diagnosis, or dosage recommendations. Always consult a qualified healthcare provider for clinical medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

