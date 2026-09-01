export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-500">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute h-10 w-10 animate-ping rounded-full bg-primary-100 opacity-75" />
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600 shadow-sm" />
      </div>
      <span className="text-xs font-semibold text-ink-600 tracking-wide">{label}</span>
    </div>
  );
}
