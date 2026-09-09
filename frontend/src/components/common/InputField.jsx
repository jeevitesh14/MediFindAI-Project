import { useState } from 'react';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

export default function InputField({
  label,
  error,
  register,
  name,
  type = 'text',
  placeholder,
  className = '',
  icon: Icon,
  helperText,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 text-left w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-semibold uppercase tracking-wider text-cyan-300"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={name}
          type={inputType}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          className={`input-field ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-11' : ''} ${
            error
              ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-500/30 ring-1 ring-rose-500/30'
              : ''
          } ${className}`}
          {...(register ? register(name) : {})}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-cyan-300 transition-colors focus:outline-none"
          >
            {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-300 mt-1 flex items-center gap-1.5">
          <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{error.message}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

