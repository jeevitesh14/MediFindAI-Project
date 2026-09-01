import { FiLoader } from 'react-icons/fi';

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  let baseClass = 'btn-primary';
  if (variant === 'secondary') baseClass = 'btn-secondary';
  if (variant === 'outline') baseClass = 'btn-outline';
  if (variant === 'danger') {
    baseClass =
      'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-rose-600/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50';
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClass} ${className}`}
      {...rest}
    >
      {loading && <FiLoader className="animate-spin" size={16} />}
      {children}
    </button>
  );
}
