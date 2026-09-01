import { useState, useEffect } from 'react';
import {
  FiClipboard,
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPackage,
  FiAlertCircle,
  FiRefreshCw,
  FiUser,
  FiShoppingBag,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus) params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const data = await adminService.getReservations(params);
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reservations', err);
      toast.error('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReservations();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            <FiClock size={11} /> Pending
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            <FiCheckCircle size={11} /> Confirmed
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            <FiPackage size={11} /> Ready
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            <FiCheckCircle size={11} /> Dispensed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            <FiXCircle size={11} /> Cancelled
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            <FiAlertCircle size={11} /> Expired
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-white/10 text-white px-2.5 py-0.5 text-[11px] font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-white">
      {/* Header */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-3 shadow-lg shadow-cyan-900/30">
              <FiClipboard size={14} /> System-Wide Holds
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Reservation Monitoring
            </h1>
            <p className="mt-1 text-sm text-primary-100/80">
              Track 24-hour holds across all local pharmacies and customer accounts.
            </p>
          </div>

          <button
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reservation code, medicine, pharmacy, or customer..."
            className="w-full rounded-2xl border border-white/20 bg-slate-900/70 pl-11 pr-24 py-3 text-sm text-white placeholder:text-primary-200/50 backdrop-blur-xl focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-4 text-xs font-bold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {['', 'PENDING', 'CONFIRMED', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'EXPIRED'].map(
            (status) => (
              <button
                key={status || 'ALL'}
                onClick={() => setSelectedStatus(status)}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                  selectedStatus === status
                    ? 'bg-cyan-500 text-primary-950 shadow-md shadow-cyan-500/30'
                    : 'border border-white/15 bg-white/5 text-primary-100 hover:bg-white/10'
                }`}
              >
                {status ? status.replace('_', ' ') : 'All'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              <tr>
                <th className="px-5 py-4">Hold Code & Date</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Pharmacy</th>
                <th className="px-5 py-4">Medicine & Qty</th>
                <th className="px-5 py-4">Total Amount</th>
                <th className="px-5 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-primary-200 animate-pulse">
                    Loading platform reservations...
                  </td>
                </tr>
              ) : reservations.length > 0 ? (
                reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-mono font-bold text-cyan-300">{r.reservationCode}</p>
                        <p className="text-[11px] text-primary-300/70 mt-0.5">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FiUser size={13} className="text-cyan-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">{r.customerName || 'Customer'}</p>
                          <p className="text-[11px] text-primary-200/70">{r.customerEmail || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FiShoppingBag size={13} className="text-cyan-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">{r.pharmacyName || 'Pharmacy'}</p>
                          <p className="text-[11px] text-primary-200/70">{r.pharmacyCity || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-white">{r.medicineName}</p>
                        <p className="text-xs text-cyan-300">
                          Qty: {r.quantity} × ₹{r.unitPrice}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-400">
                      ₹{r.totalPrice?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-5 py-4 text-right">{getStatusBadge(r.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-primary-200/70">
                    No reservations matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
