import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookmark,
  FiClock,
  FiMapPin,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiCopy,
  FiCheck,
  FiSearch,
  FiRefreshCw,
  FiShield,
  FiAlertTriangle,
  FiX,
  FiCalendar,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import reservationService from '../../services/reservationService';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, ACTIVE, COMPLETED, CANCELLED

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState('');

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingItem, setCancellingItem] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reservationService.getMyReservations();
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
      setError(
        err.response?.data?.message || err.message || 'Unable to load reservations. Please check connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info(`Hold code ${code} copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode('');
    }, 2500);
  };

  const handleOpenCancelModal = (res) => {
    setCancellingItem(res);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setCancellingItem(null);
    setCancelReason('');
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancellingItem) return;

    setSubmittingCancel(true);
    try {
      await reservationService.cancelReservation(cancellingItem.id, cancelReason);
      toast.success(`Reservation ${cancellingItem.reservationCode} cancelled successfully.`);
      handleCloseCancelModal();
      fetchReservations();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to cancel reservation.'
      );
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    if (activeFilter === 'ACTIVE') {
      return reservations.filter((r) =>
        ['PENDING', 'CONFIRMED', 'READY_FOR_PICKUP'].includes(r.status)
      );
    }
    if (activeFilter === 'COMPLETED') {
      return reservations.filter((r) => r.status === 'COMPLETED');
    }
    if (activeFilter === 'CANCELLED') {
      return reservations.filter((r) => ['CANCELLED', 'EXPIRED'].includes(r.status));
    }
    return reservations;
  }, [reservations, activeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = reservations.length;
    const active = reservations.filter((r) =>
      ['PENDING', 'CONFIRMED', 'READY_FOR_PICKUP'].includes(r.status)
    ).length;
    const completed = reservations.filter((r) => r.status === 'COMPLETED').length;
    const cancelledOrExpired = reservations.filter((r) =>
      ['CANCELLED', 'EXPIRED'].includes(r.status)
    ).length;
    return { total, active, completed, cancelledOrExpired };
  }, [reservations]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-950/70 px-3 py-1 text-xs font-bold text-cyan-300 shadow-sm shadow-cyan-900/30">
            <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            Pending 24h Hold
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/50 bg-indigo-950/70 px-3 py-1 text-xs font-bold text-indigo-300">
            <FiCheckCircle size={12} /> Confirmed by Pharmacy
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-950/70 px-3 py-1 text-xs font-bold text-emerald-300">
            <FiPackage size={12} /> Ready for Counter Pickup
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 text-xs font-bold text-emerald-400">
            <FiCheck size={12} /> Completed & Picked Up
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950/50 px-3 py-1 text-xs font-bold text-rose-400">
            <FiXCircle size={12} /> Cancelled
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/50 px-3 py-1 text-xs font-bold text-amber-400">
            <FiClock size={12} /> 24h Window Expired
          </span>
        );
      default:
        return (
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-white">
      {/* Hero Header Section */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-primary-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30">
              <FiShield size={13} /> Guaranteed Counter Hold
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
              My Medicine Reservations
            </h1>
            <p className="text-sm sm:text-base text-primary-100/90 leading-relaxed">
              Show your unique hold code at the pharmacy counter. No upfront payment required; pay during pickup.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchReservations}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all"
            >
              <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link
              to="/dashboard/search"
              className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-xs font-bold shadow-lg shadow-cyan-500/25"
            >
              <FiSearch size={14} />
              Reserve New Medicine
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-200/70">Total Placed</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white">{stats.total}</p>
        </div>
        <div className="rounded-3xl border border-cyan-400/30 bg-cyan-950/40 p-5 backdrop-blur-xl shadow-xl ring-1 ring-cyan-400/20">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Active Holds</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-cyan-300">{stats.active}</p>
        </div>
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-950/30 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Completed</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-300">{stats.completed}</p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-200/70">Cancelled / Expired</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-primary-200/90">{stats.cancelledOrExpired}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <span className="text-xs font-semibold text-cyan-300 mr-2">Filter:</span>
        {[
          { id: 'ALL', label: `All (${stats.total})` },
          { id: 'ACTIVE', label: `Active Holds (${stats.active})` },
          { id: 'COMPLETED', label: `Completed (${stats.completed})` },
          { id: 'CANCELLED', label: `Cancelled & Expired (${stats.cancelledOrExpired})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeFilter === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-primary-600 text-white shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                : 'border border-white/15 bg-white/5 text-primary-100/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-3xl border border-rose-500/40 bg-rose-950/40 p-6 backdrop-blur-xl text-rose-200 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiAlertCircle size={22} className="text-rose-400 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={fetchReservations}
            className="btn-secondary py-2 px-4 text-xs font-bold shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-4xl border border-white/10 bg-white/5 p-6 sm:p-8 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-6 w-32 rounded-xl bg-white/10" />
                <div className="h-6 w-24 rounded-full bg-white/10" />
              </div>
              <div className="h-8 w-64 rounded-xl bg-white/10" />
              <div className="h-4 w-48 rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredReservations.length === 0 && (
        <div className="rounded-4xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-primary-100/80 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
            <FiBookmark size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">No Reservations Found</h2>
          <p className="max-w-md mx-auto text-sm text-primary-200/70">
            {activeFilter === 'ALL'
              ? 'You have not reserved any medicines yet. Search for a medicine and reserve it for a guaranteed 24-hour hold.'
              : `No reservations found under the "${activeFilter.toLowerCase()}" filter.`}
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard/search"
              className="btn-primary inline-flex items-center gap-2 py-3 px-8 text-xs font-bold shadow-lg shadow-cyan-500/25"
            >
              <FiSearch size={14} /> Search Medicines Now
            </Link>
          </div>
        </div>
      )}

      {/* Reservations Cards List */}
      {!loading && !error && filteredReservations.length > 0 && (
        <div className="grid gap-6">
          {filteredReservations.map((res) => {
            const isCancellable = res.status === 'PENDING' || res.status === 'CONFIRMED';
            const isPending = res.status === 'PENDING';

            return (
              <div
                key={res.id}
                className="rounded-4xl border border-white/15 bg-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 hover:border-cyan-400/40 transition-all"
              >
                {/* Header: Code & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-200/70">
                      Hold Code:
                    </span>
                    <button
                      onClick={() => handleCopyCode(res.reservationCode)}
                      title="Click to copy code"
                      className="group inline-flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-950/60 px-3.5 py-1.5 text-sm font-black text-cyan-300 backdrop-blur-md shadow-md shadow-cyan-950/40 hover:bg-cyan-900/60 transition-all active:scale-95"
                    >
                      <span>{res.reservationCode}</span>
                      {copiedCode === res.reservationCode ? (
                        <FiCheck size={14} className="text-emerald-400" />
                      ) : (
                        <FiCopy size={14} className="text-cyan-400/80 group-hover:text-cyan-200" />
                      )}
                    </button>
                    {copiedCode === res.reservationCode && (
                      <span className="text-[11px] font-bold text-emerald-300 animate-fade-in">
                        Copied to clipboard!
                      </span>
                    )}
                  </div>

                  <div>{getStatusBadge(res.status)}</div>
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Medicine Details */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      Medicine Reserved
                    </span>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        <FiPackage size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-base leading-tight">
                          {res.medicineName}
                        </p>
                        <p className="text-xs text-primary-200/80 mt-0.5">
                          {res.genericName || 'Standard Formulation'}{' '}
                          {res.strength && `· ${res.strength}`}{' '}
                          {res.dosageForm && `· ${res.dosageForm}`}
                        </p>
                        {res.requiresPrescription && (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-400/40 px-2.5 py-0.5 rounded-full">
                            <FiAlertCircle size={10} /> Rx Required at Pickup
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pharmacy Details */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      Pickup Pharmacy
                    </span>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-cyan-400 border border-white/15">
                        <FiMapPin size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-base leading-tight">
                          {res.pharmacyName}
                        </p>
                        <p className="text-xs text-primary-200/80 mt-0.5">
                          {res.pharmacyAddress}, {res.pharmacyCity}
                        </p>
                        <p className="text-[11px] text-cyan-300 mt-1">
                          Counter Payment: Cash / UPI / Card
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Quantity */}
                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs text-primary-200/80">
                      <span>Reserved Quantity:</span>
                      <strong className="text-white text-sm">{res.quantity} units</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs text-primary-200/80">
                      <span>Unit Price:</span>
                      <span className="text-white">₹{Number(res.unitPrice).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                      <span className="text-xs font-bold text-cyan-300">Total Payable:</span>
                      <span className="text-xl font-black text-cyan-300">
                        ₹{Number(res.totalPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Details: Timestamps & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-primary-200/80">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <FiCalendar size={13} className="text-cyan-400" />
                      Reserved: {formatDate(res.createdAt)}
                    </span>
                    {res.expiresAt && (
                      <span
                        className={`flex items-center gap-1.5 ${
                          isPending ? 'font-bold text-cyan-300' : 'text-primary-200/70'
                        }`}
                      >
                        <FiClock size={13} className="text-cyan-400" />
                        Hold Expiry: {formatDate(res.expiresAt)}
                      </span>
                    )}
                    {res.cancellationReason && (
                      <span className="text-rose-300 italic">
                        Reason: {res.cancellationReason}
                      </span>
                    )}
                  </div>

                  {isCancellable && (
                    <button
                      onClick={() => handleOpenCancelModal(res)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 hover:text-white transition-all active:scale-95"
                    >
                      <FiXCircle size={13} /> Cancel Hold
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && cancellingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-4xl border border-white/20 bg-slate-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
            <div className="absolute top-0 right-0 h-36 w-36 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <FiAlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Cancel Reservation</h2>
                  <p className="text-xs text-rose-300">Release reserved inventory</p>
                </div>
              </div>
              <button
                onClick={handleCloseCancelModal}
                className="rounded-xl p-1.5 text-primary-200/70 hover:bg-white/10 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <p className="text-xs text-primary-100/90 leading-relaxed">
                Are you sure you want to cancel reservation{' '}
                <strong className="text-cyan-300">{cancellingItem.reservationCode}</strong> for{' '}
                <strong className="text-white">{cancellingItem.medicineName}</strong>? The reserved quantity ({cancellingItem.quantity} units) will be immediately restored to {cancellingItem.pharmacyName}'s public stock.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-primary-200/80 uppercase">
                  Reason for cancellation (optional)
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Found earlier at a closer pharmacy"
                  className="w-full rounded-2xl border border-white/20 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder:text-primary-200/40 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCancelModal}
                  disabled={submittingCancel}
                  className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
                >
                  Keep Hold
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 font-bold text-xs text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
