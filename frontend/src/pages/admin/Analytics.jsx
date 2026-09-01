import { useState, useEffect } from 'react';
import {
  FiBarChart2,
  FiTrendingUp,
  FiCheckCircle,
  FiUsers,
  FiShoppingBag,
  FiClipboard,
  FiRefreshCw,
  FiActivity,
} from 'react-icons/fi';
import adminService from '../../services/adminService';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load telemetry stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalRes = stats?.totalReservations || 0;
  const completedRate =
    totalRes > 0
      ? Math.round(((stats?.completedReservations || 0) / totalRes) * 100)
      : 100;
  const cancelledRate =
    totalRes > 0
      ? Math.round(((stats?.cancelledReservations || 0) / totalRes) * 100)
      : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-white">
      {/* Header */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-3 shadow-lg shadow-cyan-900/30">
              <FiBarChart2 size={14} /> Telemetry & Operations
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Platform Analytics
            </h1>
            <p className="mt-1 text-sm text-primary-100/80">
              System metrics, reservation fulfillment performance, and partner network breakdown.
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </section>

      {/* Key Health Metrics */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Fulfillment Rate
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <FiCheckCircle size={18} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-white">{completedRate}%</p>
          <div className="mt-3 w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completedRate}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-primary-200/70">
            {stats?.completedReservations || 0} of {totalRes} reservations fulfilled
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Network Verification
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <FiShoppingBag size={18} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-white">
            {stats?.verifiedPharmacies || 0} / {stats?.totalPharmacies || 0}
          </p>
          <div className="mt-3 w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  stats?.totalPharmacies
                    ? Math.round(
                        ((stats?.verifiedPharmacies || 0) / stats.totalPharmacies) *
                          100
                      )
                    : 100
                }%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-primary-200/70">
            {stats?.pendingPharmacies || 0} pending compliance approval
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Medicine Catalog Coverage
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
              <FiActivity size={18} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-white">
            {stats?.totalMedicines || 0}
          </p>
          <div className="mt-3 w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-400 h-full rounded-full w-full" />
          </div>
          <p className="mt-2 text-[11px] text-primary-200/70">
            {stats?.totalInventoryItems || 0} active pharmacy stock pairings
          </p>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Reservation Statuses */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FiClipboard className="text-cyan-400" /> Reservations Status
          </h2>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Pending Acceptance</span>
              <span className="font-bold text-amber-300">{stats?.pendingReservations || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Confirmed (Holding Stock)</span>
              <span className="font-bold text-cyan-300">{stats?.confirmedReservations || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Ready for Counter Pickup</span>
              <span className="font-bold text-indigo-300">{stats?.readyReservations || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Dispensed (Completed)</span>
              <span className="font-bold text-emerald-300">{stats?.completedReservations || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Cancelled / Rejected</span>
              <span className="font-bold text-rose-300">{stats?.cancelledReservations || 0}</span>
            </div>
          </div>
        </div>

        {/* Online Orders Statuses */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FiBarChart2 className="text-cyan-400" /> Online Orders Status
          </h2>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Pending Acceptance</span>
              <span className="font-bold text-amber-300">{stats?.pendingOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Preparing & Packaging</span>
              <span className="font-bold text-cyan-300">{stats?.preparingOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Ready for Pickup / Dispatch</span>
              <span className="font-bold text-indigo-300">{stats?.readyOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Delivered / Handed Over</span>
              <span className="font-bold text-emerald-300">{stats?.deliveredOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Cancelled / Rejected</span>
              <span className="font-bold text-rose-300">{stats?.cancelledOrders || 0}</span>
            </div>
          </div>
        </div>

        {/* User Account Distributions */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FiUsers className="text-cyan-400" /> User Distribution
          </h2>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Patients & Customers</span>
              <span className="font-bold text-emerald-300">{stats?.totalNormalUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Pharmacy Owners</span>
              <span className="font-bold text-cyan-300">{stats?.totalPharmacyOwners || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary-100">Administrators</span>
              <span className="font-bold text-purple-300">{stats?.totalAdmins || 0}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10 font-bold">
              <span className="text-white">Total Accounts</span>
              <span className="text-cyan-300">{stats?.totalUsers || 0}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
