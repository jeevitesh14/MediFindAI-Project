import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight, FiLock } from 'react-icons/fi';

import authService from '../../services/authService';
import { resetPasswordSchema } from '../../utils/validationSchemas';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(resetPasswordSchema) });

  const onSubmit = async ({ newPassword }) => {
    if (!token) {
      toast.error('Reset link is invalid or missing a token.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword });
      toast.success('Password reset successfully. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'This reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 px-4 py-12 text-white relative overflow-hidden">
      {/* Decorative Glowing Radial Dot Pattern & Ambient Blur */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38a6f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-4xl border border-white/15 bg-white/10 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl text-white">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-105">
              <span className="text-xl">✚</span>
            </div>
            <div className="text-left">
              <span className="text-xl font-black tracking-tight text-white leading-tight block">MediFindAI</span>
              <span className="text-[10px] font-semibold text-cyan-300 tracking-wider uppercase leading-none">Smart Health</span>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Set New Password</h1>
          <p className="mt-1.5 text-xs text-primary-200/70">Use letters and numbers to create your password.</p>




        </div>

        {!token && (
          <div className="mb-5 rounded-2xl bg-amber-500/20 p-4 text-xs font-medium text-amber-200 border border-amber-500/40 flex items-start gap-2.5">
            <FiLock size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <p>No reset token found in this link. Please use the reset link sent to your email or request a new one.</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            label="New Password"
            name="newPassword"
            type="password"
            placeholder="••••••••"
            register={register}
            error={errors.newPassword}
          />
          <InputField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            register={register}
            error={errors.confirmPassword}
          />
          <Button type="submit" loading={loading} className="w-full py-3 shadow-lg shadow-cyan-500/25">
            Reset Password <FiArrowRight size={15} />
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-primary-200/70 border-t border-white/10 pt-4">
          <Link to="/login" className="font-bold text-cyan-300 hover:text-cyan-200">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

