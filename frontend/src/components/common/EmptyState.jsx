export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 sm:p-12 text-center backdrop-blur-xl flex flex-col items-center justify-center gap-3.5 ${className}`}
    >
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-primary-600/20 text-cyan-300 border border-cyan-400/30 shadow-lg shadow-cyan-950/50 mb-1">
          <Icon size={28} />
        </div>
      )}
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {description && (
        <p className="max-w-md text-xs sm:text-sm text-primary-200/70 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
