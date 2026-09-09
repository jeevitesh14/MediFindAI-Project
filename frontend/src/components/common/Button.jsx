export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon,
  ...rest
}) {
  let variantClass = 'btn-primary';
  if (variant === 'secondary') variantClass = 'btn-secondary';
  if (variant === 'outline') variantClass = 'btn-outline';
  if (variant === 'ghost') variantClass = 'btn-ghost';
  if (variant === 'danger') variantClass = 'btn-danger';
  if (variant === 'success') {
    variantClass =
      'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50';
  }

  const sizeClass =
    size === 'sm'
      ? 'px-3.5 py-1.5 text-xs rounded-lg'
      : size === 'lg'
      ? 'px-6 py-3.5 text-base rounded-2xl'
      : 'px-5 py-2.5 text-sm rounded-xl';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{typeof children === 'string' ? 'Processing...' : children}</span>
        </span>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
}
