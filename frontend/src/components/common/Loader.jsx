export default function Loader({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-16 text-cyan-300 ${className}`}>
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-ping rounded-full bg-cyan-500/20 opacity-75" />
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-cyan-500/20 border-t-cyan-400 shadow-lg shadow-cyan-500/25" />
        <div className="absolute flex items-center justify-center text-xs font-bold text-cyan-400">
          ✚
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-primary-200/80 tracking-wider uppercase animate-pulse">{label}</span>}
    </div>
  );
}
