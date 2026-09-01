import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiClipboard,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiPackage,
  FiClock,
  FiCheck,
  FiX,
  FiPhone,
  FiUser,
  FiRefreshCw,
  FiCopy,
  FiAlertCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import pharmacyOwnerService from '../../services/pharmacyOwnerService';

export default function PharmacyReservations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const initialSearch = searchParams.get('search') || '';

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  // Modals state
  const [rejectItem, setRejectItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedStatus) params.status = selectedStatus;

      const data = await pharmacyOwnerService.getReservations(params);
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reservations', err);
      const message =
        err.response?.data?.message ||
        'Unable to load reservations. Please check your connection and try again.';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatus]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);


  const handleConfirm = async (id) => {
    try {
      setActionLoading(id);
      await pharmacyOwnerService.confirmReservation(id);
      toast.success('Reservation confirmed for 24-hour hold!');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm reservation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (id) => {
    try {
      setActionLoading(id);
      await pharmacyOwnerService.markReservationReady(id);
      toast.success('Reservation marked ready for customer counter pickup!');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update reservation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (id) => {
    try {
      setActionLoading(id);
      await pharmacyOwnerService.markReservationCompleted(id);
      toast.success('Reservation completed and medicine dispensed!');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete reservation.');
    } finally {
      setActionLoading(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.info(`Copied Hold Code ${code} to clipboard`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-white pb-12">
      {/* Header Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-2 shadow-sm">
              <FiClipboard size={13} /> 24-Hour Hold Order Dispatch
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Customer Reservation Queue
            </h1>
            <p className="text-xs sm:text-sm text-primary-200/80 mt-1">
              Verify incoming patient holds, package prescribed medications, and dispense orders at your counter.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReservations}
            className="btn-secondary py-3 px-5 text-xs font-semibold shrink-0 flex items-center gap-2"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300/70" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reservation hold code (e.g. MFA-...), medicine name, or customer..."
            className="w-full rounded-2xl border border-white/15 bg-slate-950/50 py-2.5 pl-11 pr-4 text-xs sm:text-sm text-white placeholder:text-primary-300/50 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300/60 hover:text-white"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'All Holds', value: '' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Ready', value: 'READY_FOR_PICKUP' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedStatus === tab.value
                  ? 'bg-cyan-500 text-primary-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-white/5 text-primary-200/80 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Error Fallback Card */}
      {fetchError && !loading && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 p-6 text-center shadow-xl backdrop-blur-md space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <FiAlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-200">Unable to Load Reservations</h3>
            <p className="text-xs text-primary-200/80 max-w-md mx-auto mt-1">{fetchError}</p>
          </div>
          <button
            type="button"
            onClick={fetchReservations}
            className="btn-secondary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <FiRefreshCw size={13} /> Retry Loading
          </button>
        </div>
      )}

      {/* Reservation Cards List */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 text-white">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent shadow-lg shadow-cyan-500/20" />
          <p className="text-xs font-medium text-cyan-200 animate-pulse">Scanning reservation queue...</p>
        </div>
      ) : reservations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between hover:border-cyan-400/40 transition-all group"
            >
              <div className="space-y-4">
                {/* Hold Code & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => copyCode(r.reservationCode)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-xl border border-cyan-500/30 hover:bg-cyan-900/60 transition-colors"
                    title="Click to copy hold code"
                  >
                    <span>{r.reservationCode}</span>
                    <FiCopy size={12} className="opacity-60 group-hover:opacity-100" />
                  </button>

                  {/* Status Badge */}
                  {r.status === 'PENDING' && (
                    <span className="badge-low-stock text-[10px] animate-pulse flex items-center gap-1">
                      <FiClock size={11} /> Pending Hold
                    </span>
                  )}
                  {r.status === 'CONFIRMED' && (
                    <span className="badge-available text-[10px] flex items-center gap-1">
                      <FiCheck size={11} /> Confirmed
                    </span>
                  )}
                  {r.status === 'READY_FOR_PICKUP' && (
                    <span className="badge-otc text-[10px] flex items-center gap-1">
                      <FiPackage size={11} /> Ready at Counter
                    </span>
                  )}
                  {r.status === 'COMPLETED' && (
                    <span className="badge-available text-[10px] flex items-center gap-1">
                      <FiCheckCircle size={11} /> Dispensed
                    </span>
                  )}
                  {r.status === 'CANCELLED' && (
                    <span className="badge-out-of-stock text-[10px] flex items-center gap-1">
                      <FiXCircle size={11} /> Cancelled
                    </span>
                  )}
                  {r.status === 'EXPIRED' && (
                    <span className="badge-out-of-stock text-[10px] flex items-center gap-1">
                      <FiClock size={11} /> Expired
                    </span>
                  )}
                </div>

                {/* Medicine Information */}
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                    {r.medicineName}
                  </h3>
                  <p className="text-xs text-primary-200/80">
                    Quantity Reserved: <strong className="text-white font-mono text-sm">{r.quantity} units</strong>
                  </p>
                  <p className="text-xs text-cyan-300 font-bold mt-1">
                    Total Amount: ₹{Number(r.totalPrice).toFixed(2)}
                  </p>
                </div>

                {/* Customer Information */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 space-y-1.5 text-xs text-primary-200/90">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <FiUser size={13} className="text-cyan-400" />
                    <span>{r.userName || r.customerName || 'Customer'}</span>
                  </div>
                  {(r.userPhone || r.customerPhone) && (
                    <div className="flex items-center gap-2 text-primary-300/80">
                      <FiPhone size={12} className="text-cyan-400" />
                      <a href={`tel:${r.userPhone || r.customerPhone}`} className="hover:underline">
                        {r.userPhone || r.customerPhone}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-primary-300/60 pt-1 border-t border-white/5">
                    <FiClock size={11} />
                    <span>Requested: {new Date(r.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Cancellation / Rejection Remarks */}
                {r.cancellationReason && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-950/30 p-2.5 text-xs text-rose-200">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">Cancellation Reason</p>
                    <p className="mt-0.5 text-rose-100/80">{r.cancellationReason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons based on State Machine */}
              <div className="pt-4 mt-4 border-t border-white/10 flex flex-col gap-2">
                {r.status === 'PENDING' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={actionLoading === r.id}
                      onClick={() => handleConfirm(r.id)}
                      className="btn-primary py-2 px-3 text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-cyan-500/20"
                    >
                      <FiCheck size={14} /> Confirm Hold
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === r.id}
                      onClick={() => setRejectItem(r)}
                      className="rounded-2xl border border-rose-500/30 bg-rose-950/40 py-2 px-3 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-white flex items-center justify-center gap-1 transition-colors"
                    >
                      <FiX size={14} /> Reject
                    </button>
                  </div>
                )}

                {r.status === 'CONFIRMED' && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading === r.id}
                      onClick={() => handleMarkReady(r.id)}
                      className="btn-primary py-2 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 w-full"
                    >
                      <FiPackage size={14} /> Mark Ready for Pickup
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === r.id}
                      onClick={() => setRejectItem(r)}
                      className="btn-secondary py-2 px-3 text-xs font-semibold text-rose-300 border-rose-500/30 hover:bg-rose-500/20 flex items-center justify-center gap-1"
                    >
                      <FiX size={14} /> Cancel Hold
                    </button>
                  </>
                )}

                {r.status === 'READY_FOR_PICKUP' && (
                  <button
                    type="button"
                    disabled={actionLoading === r.id}
                    onClick={() => handleMarkCompleted(r.id)}
                    className="w-full rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-colors"
                  >
                    <FiCheckCircle size={15} />
                    {actionLoading === r.id ? 'Dispensing...' : 'Mark Dispensed / Completed'}
                  </button>
                )}

                {r.status === 'COMPLETED' && (
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 w-full justify-center">
                    <FiCheckCircle size={14} /> Dispensed at {r.pickedUpAt ? new Date(r.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Counter'}
                  </span>
                )}

                {(r.status === 'CANCELLED' || r.status === 'EXPIRED') && (
                  <span className="text-xs font-semibold text-primary-300/70 w-full text-center">
                    Stock restored to inventory
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !fetchError ? (
        <div className="rounded-3xl border border-white/15 bg-white/10 p-12 text-center shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
            <FiClipboard size={32} />
          </div>
          <div>
            <p className="text-base font-bold text-white">No reservations found</p>
            <p className="text-xs text-primary-200/70 max-w-md mx-auto mt-1">
              {search || selectedStatus
                ? 'No customer holds match your active filters.'
                : 'There are currently no customer reservations in the hold queue.'}
            </p>
          </div>
        </div>
      ) : null}

      {/* --- REJECT RESERVATION DIALOG --- */}
      {rejectItem && (
        <RejectModal
          item={rejectItem}
          isOpen={Boolean(rejectItem)}
          onClose={() => setRejectItem(null)}
          onRejected={() => {
            setRejectItem(null);
            fetchReservations();
          }}
        />
      )}
    </div>
  );
}

// --- SUBCOMPONENT: REJECT / CANCEL MODAL ---
function RejectModal({ item, isOpen, onClose, onRejected }) {
  const [reason, setReason] = useState('Out of stock / inventory mismatch');
  const [customReason, setCustomReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const REASON_PRESETS = [
    'Out of stock / inventory mismatch',
    'Prescription required but missing',
    'Store closing early today',
    'Damaged batch packaging',
    'Other / Custom reason',
  ];

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === 'Other / Custom reason' ? customReason.trim() : reason;

    if (!finalReason) {
      toast.error('Please specify a reason for cancellation.');
      return;
    }

    try {
      setRejecting(true);
      await pharmacyOwnerService.rejectReservation(item.id, finalReason);
      toast.success('Reservation rejected and stock restored to inventory.');
      onRejected();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject reservation.');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-950 p-6 shadow-2xl space-y-5 text-white animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-rose-400">
            <FiXCircle size={20} />
            <h3 className="text-base font-bold text-white">Reject Reservation Hold</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-primary-200/70 hover:bg-white/10 hover:text-white"
          >
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleRejectSubmit} className="space-y-4 text-left">
          <p className="text-xs text-primary-200/80">
            Rejecting hold <strong className="text-white font-mono">{item.reservationCode}</strong> ({item.medicineName}) will cancel the order and immediately restore <strong className="text-cyan-300">{item.quantity} units</strong> back to available inventory.
          </p>

          <div>
            <label className="block text-xs font-bold text-primary-100 mb-2">
              Reason for Cancellation:
            </label>
            <div className="space-y-2">
              {REASON_PRESETS.map((preset) => (
                <label
                  key={preset}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    reason === preset
                      ? 'border-rose-500 bg-rose-950/40 text-white font-semibold'
                      : 'border-white/10 bg-slate-900/60 text-primary-200/80 hover:bg-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={preset}
                    checked={reason === preset}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-rose-500 focus:ring-0"
                  />
                  <span>{preset}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Other / Custom reason' && (
            <div>
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this hold cannot be fulfilled..."
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900 p-3 text-xs text-white placeholder:text-primary-300/40 focus:border-rose-400 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2.5 px-4 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejecting}
              className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-colors"
            >
              {rejecting ? 'Cancelling Hold...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
