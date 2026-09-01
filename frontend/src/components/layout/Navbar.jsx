import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiMenu,
  FiX,
  FiArrowRight,
  FiSearch,
  FiHome,
  FiMapPin,
  FiCalendar,
  FiHeart,
  FiPackage,
  FiClipboard,
  FiUser,
  FiUsers,
  FiShoppingBag,
  FiBookOpen,
  FiBarChart2,
  FiLogOut,
  FiShoppingCart,
} from 'react-icons/fi';

import useAuth from '../../hooks/useAuth';
import { logoutUser } from '../../store/slices/authSlice';
import { selectCartItemCount } from '../../store/slices/cartSlice';
import { ROLES } from '../../constants/roles';
import LanguageSelector from '../common/LanguageSelector';
import NotificationBell from '../notifications/NotificationBell';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const cartCount = useSelector(selectCartItemCount);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setOpen(false);
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleNavClick = (to) => {
    setOpen(false);
    if (to.startsWith('/#') || to === '/') {
      if (location.pathname === '/') {
        const hash = to.replace('/', '');
        if (hash) {
          const el = document.querySelector(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        }
      }
    }
  };

  const publicNavLinks = [
    { to: '/', label: t('nav.home', 'Home'), icon: FiHome, end: true },
    { to: '/medicines', label: t('nav.searchMedicines', 'Search Medicines'), icon: FiSearch },
    { to: '/pharmacies', label: t('nav.nearbyPharmacies', 'Nearby Pharmacies'), icon: FiMapPin },
    { to: '/features', label: t('nav.features', 'Features') },
    { to: '/how-it-works', label: t('nav.howItWorks', 'How It Works') },
  ];

  const userNavLinks = [
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: FiHome, end: true },
    { to: '/medicines', label: t('nav.searchMedicines', 'Search Medicines'), icon: FiSearch },
    { to: '/pharmacies', label: t('nav.nearbyPharmacies', 'Nearby Pharmacies'), icon: FiMapPin },
    { to: '/reservations', label: t('nav.reservations', 'Reservations'), icon: FiCalendar },
    { to: '/orders', label: t('nav.orders', 'My Orders'), icon: FiPackage },
    { to: '/favourites', label: t('nav.favourites', 'Favourites'), icon: FiHeart },
  ];

  const pharmacyNavLinks = [
    { to: '/pharmacy-owner/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: FiHome, end: true },
    { to: '/pharmacy-owner/inventory', label: t('nav.inventory', 'Inventory'), icon: FiPackage },
    { to: '/pharmacy-owner/reservations', label: t('nav.reservations', 'Reservations'), icon: FiClipboard },
    { to: '/pharmacy-owner/orders', label: t('nav.orders', 'Orders'), icon: FiShoppingCart },
    { to: '/pharmacy-owner/profile', label: t('nav.pharmacyProfile', 'Pharmacy Profile'), icon: FiUser },
  ];

  const adminNavLinks = [
    { to: '/admin/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: FiHome, end: true },
    { to: '/admin/users', label: t('nav.users', 'Users'), icon: FiUsers },
    { to: '/admin/pharmacies', label: t('nav.pharmacies', 'Pharmacies'), icon: FiShoppingBag },
    { to: '/admin/medicines', label: t('nav.medicineCatalog', 'Medicines'), icon: FiBookOpen },
    { to: '/admin/reservations', label: t('nav.reservations', 'Reservations'), icon: FiCalendar },
    { to: '/admin/orders', label: t('nav.orders', 'Orders'), icon: FiPackage },
    { to: '/admin/analytics', label: t('nav.analytics', 'Analytics'), icon: FiBarChart2 },
  ];

  // Determine active navigation links based on user authentication and role
  let currentNavLinks = publicNavLinks;
  if (isAuthenticated && user?.role) {
    if (user.role === ROLES.PHARMACY_OWNER) {
      currentNavLinks = pharmacyNavLinks;
    } else if (user.role === ROLES.ADMIN) {
      currentNavLinks = adminNavLinks;
    } else {
      currentNavLinks = userNavLinks;
    }
  }

  const isLinkActive = (link) => {
    if (link.end) {
      return location.pathname === link.to;
    }
    return (
      location.pathname === link.to ||
      (link.to !== '/' && location.pathname.startsWith(link.to)) ||
      (link.to === '/medicines' && location.pathname.startsWith('/dashboard/search')) ||
      (link.to === '/pharmacies' && location.pathname.startsWith('/dashboard/pharmacies')) ||
      (link.to === '/reservations' && location.pathname.startsWith('/dashboard/reservations')) ||
      (link.to === '/orders' && location.pathname.startsWith('/dashboard/orders')) ||
      (link.to === '/favourites' && location.pathname.startsWith('/dashboard/favourites'))
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-2xl transition-all text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0 mr-2 sm:mr-4">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/25 transition-transform duration-200 group-hover:scale-105">
            <span className="text-base sm:text-lg">✚</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
              MediFind<span className="text-cyan-400">AI</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-cyan-300 tracking-wider uppercase leading-none">
              {t('common.smartHealth', 'Smart Health')}
            </span>
          </div>
        </Link>

        {/* Desktop / Large Tablet Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
          {currentNavLinks.map((link) => {
            const active = isLinkActive(link);
            const Icon = link.icon;
            return (
              <Link
                key={link.to + link.label}
                to={link.to}
                onClick={() => handleNavClick(link.to)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-900/40 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Medium Tablet Navigation Links (Compact) */}
        <nav className="hidden md:flex xl:hidden items-center gap-1 overflow-x-auto py-1">
          {currentNavLinks.slice(0, 5).map((link) => {
            const active = isLinkActive(link);
            const Icon = link.icon;
            return (
              <Link
                key={link.to + link.label}
                to={link.to}
                onClick={() => handleNavClick(link.to)}
                title={link.label}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />}
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions Toolbar */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Shopping Cart Icon with Live Item Counter Badge */}
          {(!isAuthenticated || user?.role === ROLES.USER) && (
            <Link
              to="/cart"
              title="Shopping Cart"
              className="relative p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-slate-800/90 transition-all flex items-center justify-center"
            >
              <FiShoppingCart className="w-4 h-4 text-cyan-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-1 text-[10px] font-extrabold text-white shadow-md shadow-emerald-950">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Multi-Language Selector Dropdown */}
          <LanguageSelector />

          {/* Persistent Database Notification Bell */}
          {isAuthenticated && <NotificationBell />}

          {/* User Profile Chip & Authentication CTA */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-inner">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-left leading-none pr-1">
                  <p className="text-xs font-bold text-white truncate max-w-[95px] lg:max-w-[120px]">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-[10px] text-cyan-300 font-medium capitalize mt-0.5">
                    {user?.role?.replace('_', ' ').toLowerCase() || 'Member'}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title={t('nav.logout', 'Log out')}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition-all hover:bg-rose-500/20 hover:border-rose-400/50 hover:text-rose-200 active:scale-95"
              >
                <FiLogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t('nav.logout', 'Log out')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-2.5 py-2 transition-colors"
              >
                {t('nav.login', 'Log in')}
              </Link>
              <Link
                to="/register"
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1"
              >
                <span>{t('nav.getStarted', 'Get Started')}</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Controls & Hamburger */}
        <div className="flex items-center gap-1.5 md:hidden">
          {(!isAuthenticated || user?.role === ROLES.USER) && (
            <Link
              to="/cart"
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400"
            >
              <FiShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          <LanguageSelector />
          {isAuthenticated && <NotificationBell />}

          <button
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-white hover:bg-slate-800"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
          >
            {open ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Sidebar Overlay */}
      {open && (
        <div className="border-t border-slate-800 bg-slate-950/98 backdrop-blur-3xl px-4 pb-6 pt-3 md:hidden shadow-2xl space-y-3 animate-fade-in">
          <nav className="flex flex-col space-y-1">
            {currentNavLinks.map((link) => {
              const active = isLinkActive(link);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to + link.label}
                  to={link.to}
                  onClick={() => handleNavClick(link.to)}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />}
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2 mt-2">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-slate-900 p-3 border border-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{user?.fullName}</p>
                      <p className="text-[11px] text-cyan-300">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/20 border border-rose-400/30 py-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition-colors"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>{t('nav.logout', 'Log out')}</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium text-sm"
                  >
                    {t('nav.login', 'Log in')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-1.5"
                  >
                    <span>{t('nav.getStarted', 'Get Started')}</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
