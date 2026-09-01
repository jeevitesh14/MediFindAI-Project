import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';

import authService from '../../services/authService';
import { forgotPasswordSchema } from '../../utils/validationSchemas';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(forgotPasswordSchema) });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
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
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <FiCheckCircle size={28} />
            </div>
            <h1 className="text-xl font-bold text-white">Check your inbox</h1>
            <p className="text-xs text-primary-200/70 max-w-sm leading-relaxed">
              If an account exists for that email, we&apos;ve sent instructions to reset your password.
            </p>
            <Link to="/login" className="btn-secondary mt-3 w-full text-center">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Forgot Password?</h1>
              <p className="mt-1.5 text-xs text-primary-200/70">Enter your registered email and we&apos;ll send you a password reset link.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@example.com"
                register={register}
                error={errors.email}
              />
              <Button type="submit" loading={loading} className="w-full py-3 shadow-lg shadow-cyan-500/25">
                Send Reset Link <FiArrowRight size={15} />
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-primary-200/70 border-t border-white/10 pt-4">
              Remember your credentials?{' '}
              <Link to="/login" className="font-bold text-cyan-300 hover:text-cyan-200">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

