import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiUsers,
  FiShoppingBag,
  FiClipboard,
  FiCheckCircle,
  FiShield,
  FiBarChart2,
  FiArrowRight,
  FiBookOpen,
  FiRefreshCw,
  FiAlertTriangle,
  FiPackage,
} from 'react-icons/fi';
import adminService from '../../services/adminService';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
      setError('Could not load administrative statistics.');
      // Fallback
      setStats({
        totalUsers: 3,
        totalNormalUsers: 1,
        totalPharmacyOwners: 1,
        totalAdmins: 1,
        totalPharmacies: 1,
        pendingPharmacies: 0,
        verifiedPharmacies: 1,
        totalMedicines: 5,
        totalInventoryItems: 2,
        totalReservations: 0,
        pendingReservations: 0,
        confirmedReservations: 0,
        readyReservations: 0,
        completedReservations: 0,
        cancelledReservations: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const overviewCards = [
    {
      label: t('admin.totalUsers', 'Total Users'),
      value: stats?.totalUsers ?? '—',
      subtitle: `${stats?.totalPharmacyOwners ?? 0} owners · ${stats?.totalNormalUsers ?? 0} patients`,
      icon: FiUsers,
      gradient: 'from-cyan-500 to-blue-600',
      link: '/admin/users',
    },
    {
      label: t('admin.totalPharmacies', 'Pharmacies'),
      value: stats?.totalPharmacies ?? '—',
      subtitle: `${stats?.verifiedPharmacies ?? 0} verified · ${stats?.pendingPharmacies ?? 0} pending`,
      icon: FiShoppingBag,
      gradient: 'from-emerald-500 to-teal-600',
      link: '/admin/pharmacies',
    },
    {
      label: t('admin.catalogManagement', 'Medicine Catalog'),
      value: stats?.totalMedicines ?? '—',
      subtitle: `${stats?.totalInventoryItems ?? 0} pharmacy stock links`,
      icon: FiBookOpen,
      gradient: 'from-amber-500 to-orange-600',
      link: '/admin/medicines',
    },
    {
      label: t('admin.totalReservations', 'Reservations'),
      value: stats?.totalReservations ?? '—',
      subtitle: `${stats?.pendingReservations ?? 0} pending · ${stats?.completedReservations ?? 0} completed`,
      icon: FiClipboard,
      gradient: 'from-purple-500 to-pink-600',
      link: '/admin/reservations',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? '—',
      subtitle: `${stats?.pendingOrders ?? 0} pending · ${stats?.deliveredOrders ?? 0} delivered`,
      icon: FiPackage,
      gradient: 'from-indigo-500 to-cyan-600',
      link: '/admin/orders',
    },
  ];


  return (
    <div className="space-y-10 max-w-6xl mx-auto text-white">
      {/* Admin Header Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-4 shadow-lg shadow-cyan-900/30">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              System Administration & Compliance
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {t('admin.dashboardTitle', 'Platform Administration')}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-primary-100/90 max-w-xl">
              {t(
                'admin.dashboardSubtitle',
                'System-wide telemetry, user management, pharmacy verification, and central medicine catalog.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
              <span>Refresh Stats</span>
            </button>
            <Link
              to="/admin/pharmacies"
              className="btn-primary py-3 px-6 text-xs font-bold shadow-lg shadow-cyan-500/25"
            >
              <FiCheckCircle size={15} /> Verifications
            </Link>
          </div>
        </div>
      </section>

      {/* Overview Metric Cards */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

        {overviewCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="group rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between hover:border-cyan-400/50 hover:bg-white/15 transition-all"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${card.gradient} text-white shadow-lg shadow-black/20`}
              >
                <card.icon size={22} />
              </div>
              <FiArrowRight
                size={16}
                className="text-primary-300 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all"
              />
            </div>

            <div className="mt-6">
              <p className="text-3xl font-black text-white">{card.value}</p>
              <p className="text-xs font-bold text-cyan-300 mt-1">{card.label}</p>
              <p className="text-[11px] text-primary-200/70 mt-0.5">{card.subtitle}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Admin Operations Grid */}
      <section className="grid gap-6 md:grid-cols-3">
        {/* User Management */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-lg shadow-cyan-500/20">
              <FiUsers size={22} />
            </div>
            <h2 className="mt-5 text-lg font-bold text-white">
              {t('admin.userManagement', 'User Management')}
            </h2>
            <p className="mt-2 text-sm text-primary-100/80 leading-relaxed">
              View all accounts, search by name or email, toggle active status, and audit user roles.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <Link to="/admin/users" className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-1">
              Manage Users <FiArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Pharmacy Verification */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20">
              <FiShield size={22} />
            </div>
            <h2 className="mt-5 text-lg font-bold text-white">
              {t('admin.pharmacyManagement', 'Pharmacy Management')}
            </h2>
            <p className="mt-2 text-sm text-primary-100/80 leading-relaxed">
              Approve or reject pharmacy partner licenses, verify operational timings, and view stocked items.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <Link to="/admin/pharmacies" className="btn-secondary py-2 px-4 text-xs inline-flex items-center gap-1">
              Review Licenses <FiArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Central Medicine Catalog */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-cyan-400/40 transition-all">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/20">
              <FiBookOpen size={22} />
            </div>
            <h2 className="mt-5 text-lg font-bold text-white">
              {t('admin.catalogManagement', 'Central Medicine Catalog')}
            </h2>
            <p className="mt-2 text-sm text-primary-100/80 leading-relaxed">
              Maintain the global medicine library with barcode indexing, generic molecule mapping, and Rx flags.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <Link to="/admin/medicines" className="btn-secondary py-2 px-4 text-xs inline-flex items-center gap-1">
              Catalog Management <FiArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
