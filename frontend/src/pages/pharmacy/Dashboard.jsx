import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiClipboard,
  FiAlertCircle,
  FiPlus,
  FiArrowRight,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiTrendingUp,
  FiCheck,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

import useAuth from '../../hooks/useAuth';
import pharmacyOwnerService from '../../services/pharmacyOwnerService';

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [statsData, profileData] = await Promise.all([
        pharmacyOwnerService.getStats(),
        pharmacyOwnerService.getProfile(),
      ]);
      setStats(statsData || {});
      setProfile(profileData || {});
    } catch (err) {
      console.error('Failed to load pharmacy dashboard data', err);
      const message =
        err.response?.data?.message ||
        'Could not load pharmacy dashboard data. Please try again.';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickConfirm = async (reservationId) => {
    try {
      setActionLoading(reservationId);
      await pharmacyOwnerService.confirmReservation(reservationId);
      toast.success('Reservation confirmed for 24-hour hold.');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm reservation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickReady = async (reservationId) => {
    try {
      setActionLoading(reservationId);
      await pharmacyOwnerService.markReservationReady(reservationId);
      toast.success('Reservation marked ready for customer pickup.');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update reservation.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent shadow-lg shadow-cyan-500/20" />
        <p className="text-sm font-medium text-cyan-200 animate-pulse">Loading pharmacy telemetry...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Medicines Listed',
      value: stats?.totalMedicines ?? 0,
      subtext: 'In pharmacy catalog',
      icon: FiPackage,
      gradient: 'from-cyan-500 to-blue-600',
      link: '/pharmacy-owner/inventory',
    },
    {
      label: 'Available Stock',
      value: stats?.availableCount ?? 0,
      subtext: 'Ready for customer order',
      icon: FiCheckCircle,
      gradient: 'from-emerald-500 to-teal-600',
      link: '/pharmacy-owner/inventory?status=AVAILABLE',
    },
    {
      label: 'Low Stock Alerts',
      value: stats?.lowStockCount ?? 0,
      subtext: 'Requires restock soon',
      icon: FiAlertCircle,
      gradient: 'from-amber-500 to-orange-600',
      link: '/pharmacy-owner/inventory?status=LOW_STOCK',
      highlight: stats?.lowStockCount > 0,
    },
    {
      label: 'Out of Stock',
      value: stats?.outOfStockCount ?? 0,
      subtext: 'Depleted inventory items',
      icon: FiAlertCircle,
      gradient: 'from-rose-500 to-red-600',
      link: '/pharmacy-owner/inventory?status=OUT_OF_STOCK',
    },
    {
      label: 'Pending Hold Requests',
      value: stats?.pendingReservationsCount ?? 0,
      subtext: 'Awaiting your confirmation',
      icon: FiClock,
      gradient: 'from-purple-500 to-indigo-600',
      link: '/pharmacy-owner/reservations?status=PENDING',
      highlight: stats?.pendingReservationsCount > 0,
    },
    {
      label: 'Confirmed Holds',
      value: stats?.confirmedReservationsCount ?? 0,
      subtext: 'Preparing for pickup',
      icon: FiClipboard,
      gradient: 'from-blue-500 to-cyan-600',
      link: '/pharmacy-owner/reservations?status=CONFIRMED',
    },
    {
      label: 'Ready for Pickup',
      value: stats?.readyForPickupCount ?? 0,
      subtext: 'Waiting for customer counter',
      icon: FiPackage,
      gradient: 'from-teal-500 to-cyan-600',
      link: '/pharmacy-owner/reservations?status=READY_FOR_PICKUP',
    },
    {
      label: 'Online Orders',
      value: stats?.totalOrdersCount ?? 0,
      subtext: `${stats?.pendingOrdersCount ?? 0} pending acceptance`,
      icon: FiPackage,
      gradient: 'from-cyan-500 to-indigo-600',
      link: '/pharmacy-owner/orders',
      highlight: (stats?.pendingOrdersCount ?? 0) > 0,
    },
    {
      label: 'Dispensed / Completed',
      value: stats?.completedReservationsCount ?? 0,
      subtext: 'Successfully fulfilled',
      icon: FiTrendingUp,
      gradient: 'from-emerald-600 to-green-700',
      link: '/pharmacy-owner/reservations?status=COMPLETED',
    },
  ];


  return (
    <div className="space-y-10 max-w-7xl mx-auto text-white pb-12">
      {/* Error & Retry Banner (if any) */}
      {fetchError && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
              <FiAlertCircle size={22} />
            </div>
            <div>
              <p className="font-bold text-rose-200">Unable to Load Complete Dashboard Data</p>
              <p className="text-xs text-rose-200/80">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="btn-secondary py-2 px-4 text-xs font-bold shrink-0 border-rose-400/30 text-rose-200 hover:bg-rose-500/20 flex items-center gap-1.5"
          >
            <FiRefreshCw size={13} /> Retry Loading
          </button>
        </div>
      )}

      {/* Pharmacy Banner Header */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden">

        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                Pharmacy Partner Console
              </span>

              {profile?.verificationStatus === 'VERIFIED' ? (
                <span className="badge-available flex items-center gap-1 text-xs">
                  <FiCheck size={12} /> Verified Pharmacy
                </span>
              ) : (
                <span className="badge-low-stock text-xs">
                  {profile?.verificationStatus || 'PENDING VERIFICATION'}
                </span>
              )}

              {profile?.is24Hours && (
                <span className="badge-otc text-xs">24/7 Active</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {profile?.name || user?.fullName || 'My Pharmacy'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-primary-100/80 pt-1">
              {profile?.addressLine && (
                <span className="flex items-center gap-1.5">
                  <FiMapPin className="text-cyan-400 shrink-0" />
                  {profile.addressLine}, {profile.city}
                </span>
              )}
              {profile?.phone && (
                <span className="flex items-center gap-1.5">
                  <FiPhone className="text-cyan-400 shrink-0" />
                  {profile.phone}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchDashboardData}
              className="btn-secondary py-3 px-4 text-xs font-semibold"
              title="Refresh telemetry"
            >
              <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              to="/pharmacy-owner/inventory"
              className="btn-primary py-3.5 px-6 text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <FiPlus size={16} /> Add / Manage Stock
            </Link>
            <Link
              to="/pharmacy-owner/reservations"
              className="btn-secondary py-3.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <FiClipboard size={16} /> View Orders ({stats?.pendingReservationsCount ?? 0})
            </Link>
          </div>
        </div>
      </section>

      {/* Low Stock Alert Strip (if any) */}
      {stats?.lowStockCount > 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-950/40 p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
              <FiAlertCircle size={22} />
            </div>
            <div>
              <p className="font-bold text-amber-200">
                Low Inventory Alert: {stats.lowStockCount} item{stats.lowStockCount > 1 ? 's' : ''} running low
              </p>
              <p className="text-xs text-amber-200/80">
                Stock is below configured thresholds. Restock now to prevent missed patient reservations.
              </p>
            </div>
          </div>
          <Link
            to="/pharmacy-owner/inventory?status=LOW_STOCK"
            className="btn-secondary py-2 px-4 text-xs font-bold shrink-0 border-amber-400/30 text-amber-200 hover:bg-amber-500/20"
          >
            Review Low Stock <FiArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className={`group rounded-3xl border p-5 shadow-2xl backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/50 ${
              s.highlight
                ? 'border-cyan-400/40 bg-cyan-950/40 shadow-cyan-950/50'
                : 'border-white/15 bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${s.gradient} text-white shadow-lg shadow-black/20`}
              >
                <s.icon size={22} />
              </div>
              <FiArrowRight
                size={16}
                className="text-white/30 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all"
              />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-xs font-bold text-cyan-200 mt-1">{s.label}</p>
              <p className="text-[11px] text-primary-200/70 mt-0.5">{s.subtext}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Recent Reservations & Action Modules */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders Queue (2 columns) */}
        <section className="lg:col-span-2 rounded-3xl border border-white/15 bg-white/10 p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-md shadow-cyan-500/20">
                <FiClipboard size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Recent Customer Holds</h2>
                <p className="text-xs text-cyan-300">Live 24-hour pickup hold stream</p>
              </div>
            </div>
            <Link
              to="/pharmacy-owner/reservations"
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
            >
              View Full Queue <FiArrowRight size={12} />
            </Link>
          </div>

          {stats?.recentReservations?.length > 0 ? (
            <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
              {stats.recentReservations.map((r) => (
                <div
                  key={r.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                        {r.reservationCode}
                      </span>
                      {r.status === 'PENDING' && (
                        <span className="badge-low-stock text-[10px] animate-pulse">
                          Awaiting Confirmation
                        </span>
                      )}
                      {r.status === 'CONFIRMED' && (
                        <span className="badge-available text-[10px]">Confirmed</span>
                      )}
                      {r.status === 'READY_FOR_PICKUP' && (
                        <span className="badge-otc text-[10px]">Ready for Pickup</span>
                      )}
                      {r.status === 'COMPLETED' && (
                        <span className="badge-available text-[10px]">Dispensed</span>
                      )}
                      {r.status === 'CANCELLED' && (
                        <span className="badge-out-of-stock text-[10px]">Cancelled</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-white">
                      {r.medicineName}{' '}
                      <span className="text-xs font-normal text-primary-200/80">
                        (Qty: {r.quantity})
                      </span>
                    </p>
                    <p className="text-xs text-primary-200/70">
                      Customer: <strong className="text-white">{r.customerName}</strong> · Total: ₹
                      {Number(r.totalPrice).toFixed(2)}
                    </p>
                  </div>

                  {/* Context Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={actionLoading === r.id}
                        onClick={() => handleQuickConfirm(r.id)}
                        className="btn-primary py-1.5 px-3.5 text-xs font-bold"
                      >
                        {actionLoading === r.id ? 'Confirming...' : 'Confirm Hold'}
                      </button>
                    )}
                    {r.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        disabled={actionLoading === r.id}
                        onClick={() => handleQuickReady(r.id)}
                        className="btn-primary py-1.5 px-3.5 text-xs font-bold"
                      >
                        {actionLoading === r.id ? 'Updating...' : 'Mark Ready'}
                      </button>
                    )}
                    <Link
                      to={`/pharmacy-owner/reservations?search=${r.reservationCode}`}
                      className="btn-secondary py-1.5 px-3 text-xs"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-8 text-center space-y-2">
              <FiClipboard size={32} className="mx-auto text-primary-300/40" />
              <p className="font-semibold text-white">No active reservations yet</p>
              <p className="text-xs text-primary-200/70 max-w-sm mx-auto">
                When patients search for medicines and place 24-hour holds, orders will appear here immediately.
              </p>
            </div>
          )}
        </section>

        {/* Quick Management Tools (1 column) */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white">Quick Navigation</h2>
            <div className="space-y-3">
              <Link
                to="/pharmacy-owner/inventory"
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-cyan-400/40 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                    <FiPackage size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Medicine Inventory</p>
                    <p className="text-xs text-primary-200/70">Manage prices & quantities</p>
                  </div>
                </div>
                <FiArrowRight className="text-primary-300/60 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/pharmacy-owner/reservations"
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-cyan-400/40 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 text-primary-300">
                    <FiClipboard size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Reservations Queue</p>
                    <p className="text-xs text-primary-200/70">Fulfill & dispense orders</p>
                  </div>
                </div>
                <FiArrowRight className="text-primary-300/60 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/pharmacy-owner/profile"
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-cyan-400/40 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Pharmacy Profile</p>
                    <p className="text-xs text-primary-200/70">Hours, address & contact</p>
                  </div>
                </div>
                <FiArrowRight className="text-primary-300/60 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          {/* Licensed Pharmacy Info */}
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl text-xs text-primary-100/80 flex items-start gap-3.5 shadow-xl">
            <FiShield size={22} className="shrink-0 text-cyan-400 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block font-semibold">Regulatory Compliance</strong>
              <p className="leading-relaxed">
                Ensure valid prescriptions are verified for all Schedule H medications prior to completing counter pickup. License #{profile?.licenseNumber || 'N/A'}.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
