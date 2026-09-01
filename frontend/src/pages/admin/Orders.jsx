import React, { useState, useEffect } from 'react';
import {
  FiPackage,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle,
  FiTruck,
  FiHome,
  FiCalendar,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiX,
} from 'react-icons/fi';
import orderService from '../../services/orderService';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getAdminOrders(selectedStatus || null, search, 0, 100);
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load system orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <FiClock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <FiCheckCircle className="w-3 h-3" />
            <span>Confirmed</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <FiRefreshCw className="w-3 h-3 animate-spin" />
            <span>Preparing</span>
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <FiHome className="w-3 h-3" />
            <span>Ready</span>
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <FiTruck className="w-3 h-3" />
            <span>In Transit</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <FiCheckCircle className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <FiXCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <FiPackage className="w-7 h-7 text-cyan-400" />
            <span>System Orders Monitor</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Platform-wide medicine order tracking, delivery telemetry, and financial audit records.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer, pharmacy..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === f.value
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <FiRefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading orders list...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <FiPackage className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No orders matching the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Pharmacy</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {o.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{o.customerName}</div>
                      <div className="text-xs text-slate-400">{o.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{o.pharmacyName}</div>
                      <div className="text-xs text-slate-400">{o.pharmacyCity}</div>
                    </td>
                    <td className="px-6 py-4">
                      {o.deliveryMethod === 'HOME_DELIVERY' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-cyan-300">
                          <FiTruck className="w-3.5 h-3.5" />
                          <span>Delivery</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                          <FiHome className="w-3.5 h-3.5" />
                          <span>Pickup ({o.pickupCode})</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400 whitespace-nowrap">
                      ₹{Number(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono font-bold text-lg text-cyan-400">{selectedOrder.orderNumber}</span>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Customer Info</span>
                <p className="font-bold text-white">{selectedOrder.customerName}</p>
                <p className="text-slate-300">{selectedOrder.customerPhone}</p>
                <p className="text-slate-400 text-xs mt-1">{selectedOrder.customerEmail || 'Registered User'}</p>
                {selectedOrder.deliveryAddress && (
                  <p className="text-slate-300 text-xs mt-2 border-t border-slate-800 pt-1.5">
                    <strong>Address:</strong> {selectedOrder.deliveryAddress}, {selectedOrder.city} - {selectedOrder.postalCode}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Fulfilling Pharmacy</span>
                <p className="font-bold text-white">{selectedOrder.pharmacyName}</p>
                <p className="text-slate-300">{selectedOrder.pharmacyAddress || selectedOrder.pharmacyCity}</p>
                <p className="text-slate-400 text-xs mt-1">Phone: {selectedOrder.pharmacyPhone || 'N/A'}</p>
                <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Payment:</span>
                  <span className="text-emerald-400 font-semibold">{selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Line Items</span>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/40 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white">{item.medicineName}</span>
                      {item.genericName && <span className="text-slate-400 italic ml-2">({item.genericName})</span>}
                      <span className="text-slate-400 block mt-0.5">Qty: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}</span>
                    </div>
                    <span className="font-bold text-emerald-400">₹{Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-sm">
              <span className="text-slate-400">Total Order Amount</span>
              <span className="text-xl font-extrabold text-emerald-400">₹{Number(selectedOrder.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
