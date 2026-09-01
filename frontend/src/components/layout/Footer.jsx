import { Link } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-primary-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4 sm:grid-cols-2">
          {/* Brand Col */}
          <div className="space-y-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-md shadow-cyan-500/20 transition-transform group-hover:scale-105">
                ✚
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">MediFindAI</span>
            </Link>
            <p className="text-xs text-primary-100/70 leading-relaxed">
              AI-powered medicine search, real-time pharmacy inventory tracking, and seamless prescription pickup.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-primary-100/80">
              <li><Link to="/features" className="hover:text-cyan-300 transition-colors">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-cyan-300 transition-colors">How It Works</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-cyan-300 transition-colors">AI Assistant</Link></li>
              <li><Link to="/testimonials" className="hover:text-cyan-300 transition-colors">Testimonials</Link></li>
            </ul>
          </div>

          {/* User Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">Portals</h4>
            <ul className="space-y-2 text-xs text-primary-100/80">
              <li><Link to="/login" className="hover:text-cyan-300 transition-colors">User Login</Link></li>
              <li><Link to="/register" className="hover:text-cyan-300 transition-colors">Register Account</Link></li>
              <li><Link to="/about" className="hover:text-cyan-300 transition-colors">About MediFindAI</Link></li>
              <li><Link to="/contact" className="hover:text-cyan-300 transition-colors">Support & Contact</Link></li>
            </ul>
          </div>

          {/* Safety & Compliance */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <FiShield className="text-cyan-400" />
              <span>Medical Safety Notice</span>
            </div>
            <p className="text-[11px] text-primary-100/70 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/10">
              MediFindAI does not provide medical advice. Consult a qualified healthcare professional for medical guidance.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-primary-100/50">
          <p>© {new Date().getFullYear()} MediFindAI. All rights reserved.</p>
          <p className="flex items-center gap-1 text-primary-100/60">
            Built with modern healthcare technology for smart medicine access.
          </p>
        </div>
      </div>
    </footer>
  );
}
