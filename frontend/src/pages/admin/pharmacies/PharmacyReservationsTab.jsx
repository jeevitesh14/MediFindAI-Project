import { useState, useMemo } from 'react';
import {
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiPackage,
  FiCalendar,
} from 'react-icons/fi';

export default function PharmacyReservationsTab({
  pharmacy,
  reservations = [],
  loading = false,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Status counts
  const counts = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter((r) => r.status === 'PENDING').length;
    const confirmed = reservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'READY_FOR_PICKUP').length;
    const completed = reservations.filter((r) => r.status === 'COMPLETED').length;
    const cancelled = reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'EXPIRED').length;
    return { total, pending, confirmed, completed, cancelled };
  }, [reservations]);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    let result = [...reservations];

    if (selectedStatus) {
      result = result.filter((r) => r.status === selectedStatus);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((r) => {
        const codeMatch = r.reservationCode && r.reservationCode.toLowerCase().includes(q);
        const nameMatch = r.customerName && r.customerName.toLowerCase().includes(q);
        const medMatch = r.medicineName && r.medicineName.toLowerCase().includes(q);
        return codeMatch || nameMatch || medMatch;
      });
    }

    return result;
  }, [reservations, selectedStatus, searchTerm]);

  const getReservationBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Pending Hold
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Confirmed
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Ready for Pickup
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Cancelled
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Expired
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search holds by reservation code, customer, medicine..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="">All Statuses ({counts.total})</option>
            <option value="PENDING">Pending Holds ({counts.pending})</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="COMPLETED">Completed ({counts.completed})</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh Reservations"
            className="p-2 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-cyan-300 hover:text-white"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">Total Holds</span>
          <strong className="text-base font-bold text-white">{counts.total}</strong>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">Pending Holds</span>
          <strong className="text-base font-bold text-amber-300">{counts.pending}</strong>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">Completed</span>
          <strong className="text-base font-bold text-emerald-300">{counts.completed}</strong>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">Cancelled / Expired</span>
          <strong className="text-base font-bold text-slate-400">{counts.cancelled}</strong>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-14 text-center text-slate-400 text-xs">
          <FiRefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
          Loading pharmacy reservations...
        </div>
      ) : filteredReservations.length > 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-400 sticky top-0 border-b border-slate-800 z-10">
              <tr>
                <th className="px-4 py-3">Hold Code</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Medicine & Qty</th>
                <th className="px-3 py-3 text-right">Hold Total</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Placed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReservations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Hold Code */}
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-cyan-300 text-xs block">
                      {r.reservationCode}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="px-3 py-3">
                    <span className="font-bold text-white block">{r.customerName || 'Patient'}</span>
                    <span className="text-[11px] text-slate-400 block">{r.customerPhone || 'No phone'}</span>
                  </td>

                  {/* Medicine & Qty */}
                  <td className="px-3 py-3">
                    <span className="font-bold text-white block">{r.medicineName}</span>
                    <span className="text-[11px] text-slate-400 block">
                      {r.dosageForm} {r.strength ? `· ${r.strength}` : ''} × <strong className="text-white">{r.quantity} unit(s)</strong>
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-3 text-right font-mono font-bold text-cyan-300">
                    ₹{Number(r.totalPrice || 0).toFixed(2)}
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-3 text-center">
                    {getReservationBadge(r.status)}
                  </td>

                  {/* Placed On */}
                  <td className="px-4 py-3 text-right text-slate-400 text-[11px]">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 px-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-slate-400 text-xs space-y-2">
          <FiCalendar className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No Reservations Found</p>
          <p className="text-slate-500">
            There are currently no patient medicine holds registered for {pharmacy.name}.
          </p>
        </div>
      )}
    </div>
  );
}
