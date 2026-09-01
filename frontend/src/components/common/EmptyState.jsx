export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3.5 py-14 px-6 text-center border-dashed border-slate-200/90 bg-slate-50/50">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-50 to-cyan-50 text-primary-600 border border-primary-100 shadow-sm">
          <Icon size={26} />
        </div>
      )}
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      {description && <p className="max-w-md text-xs sm:text-sm text-ink-500 leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
