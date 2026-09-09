import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight, FiMail, FiLock } from 'react-icons/fi';

import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import { loginSchema } from '../../utils/validationSchemas';
import { ROLE_HOME_ROUTE } from '../../constants/roles';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, isAuthenticated, user } = useSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectTo = location.state?.from || ROLE_HOME_ROUTE[user.role] || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  useEffect(() => {
    if (error) {
      toast.error(error, { toastId: 'auth-login-error' });
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 px-4 py-12 text-white relative overflow-hidden">
      {/* Decorative Glowing Radial Dot Pattern & Ambient Blur */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38a6f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-4xl border border-white/15 bg-white/10 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl text-white">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-105">
              <span className="text-xl">✚</span>
            </div>
            <div className="text-left">
              <span className="text-xl font-black tracking-tight text-white leading-tight block">MediFindAI</span>
              <span className="text-[10px] font-semibold text-cyan-300 tracking-wider uppercase leading-none">Smart Health</span>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-xs sm:text-sm text-primary-200/70">Sign in to search real-time stock and manage reservations.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            label="Email Address"
            name="email"
            type="email"
            icon={FiMail}
            placeholder="you@example.com"
            register={register}
            error={errors.email}
          />
          <div>
            <InputField
              label="Password"
              name="password"
              type="password"
              icon={FiLock}
              placeholder="••••••••"
              register={register}
              error={errors.password}
            />
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" loading={status === 'loading'} className="w-full py-3 mt-2 shadow-lg shadow-cyan-500/25">
            Log in <FiArrowRight size={15} />
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-primary-200/70 border-t border-white/10 pt-5">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-cyan-300 hover:text-cyan-200">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

