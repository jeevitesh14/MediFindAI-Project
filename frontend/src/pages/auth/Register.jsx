import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight, FiUser, FiShoppingBag, FiMail, FiPhone, FiLock } from 'react-icons/fi';

import { registerUser, clearAuthError } from '../../store/slices/authSlice';
import { registerSchema } from '../../utils/validationSchemas';
import { ROLES, ROLE_HOME_ROUTE } from '../../constants/roles';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, isAuthenticated, user } = useSelector((s) => s.auth);
  const [accountType, setAccountType] = useState(ROLES.USER);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(registerSchema) });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_HOME_ROUTE[user.role] || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error, { toastId: 'auth-register-error' });
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    const { confirmPassword: _, ...payload } = data;
    dispatch(
      registerUser({
        fullName: payload.fullName?.trim(),
        email: payload.email?.trim(),
        phone: payload.phone?.trim() || null,
        password: payload.password,
        role: accountType,
      })
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 px-4 py-12 text-white relative overflow-hidden">
      {/* Decorative Glowing Radial Dot Pattern & Ambient Blur */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38a6f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

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

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Account</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-primary-200/70">Join MediFindAI to find, compare and reserve medicines.</p>
        </div>

        {/* Account Role Selector Pill */}
        <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-900/80 p-1.5 border border-white/15">
          {[
            { value: ROLES.USER, label: 'I Need Medicines', icon: FiUser },
            { value: ROLES.PHARMACY_OWNER, label: 'Pharmacy Owner', icon: FiShoppingBag },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccountType(opt.value)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                accountType === opt.value
                  ? 'bg-gradient-to-r from-cyan-500 to-primary-600 text-white shadow-md'
                  : 'text-primary-200/70 hover:text-white'
              }`}
            >
              <opt.icon size={13} />
              {opt.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <InputField
            label="Full Name"
            name="fullName"
            icon={FiUser}
            placeholder="Dr. John Doe"
            register={register}
            error={errors.fullName}
          />
          <InputField
            label="Email Address"
            name="email"
            type="email"
            icon={FiMail}
            placeholder="you@example.com"
            register={register}
            error={errors.email}
          />
          <InputField
            label="Phone Number (Optional)"
            name="phone"
            icon={FiPhone}
            placeholder="9876543210"
            register={register}
            error={errors.phone}
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            icon={FiLock}
            placeholder="••••••••"
            register={register}
            error={errors.password}
          />
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            icon={FiLock}
            placeholder="••••••••"
            register={register}
            error={errors.confirmPassword}
          />

          <Button type="submit" loading={status === 'loading'} className="w-full py-3 mt-2 shadow-lg shadow-cyan-500/25">
            Create Account <FiArrowRight size={15} />
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-primary-200/70 border-t border-white/10 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-cyan-300 hover:text-cyan-200">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

