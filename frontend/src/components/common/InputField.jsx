export default function InputField({
  label,
  error,
  register,
  name,
  type = 'text',
  placeholder,
  className = '',
  ...rest
}) {
  return (
    <div className="space-y-1.5 text-left">
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wider text-cyan-300">
          {label}
        </label>
      )}
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        className={`input-field ${
          error ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/30' : ''
        } ${className}`}
        {...(register ? register(name) : {})}
        {...rest}
      />
      {error && <p className="text-xs font-medium text-rose-300 mt-1">{error.message}</p>}
    </div>
  );
}

