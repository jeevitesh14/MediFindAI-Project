import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiHome,
  FiCalendar,
  FiPhone,
  FiRefreshCw,
  FiAlertCircle,
  FiUser,
  FiMapPin,
  FiCheck,
  FiSlash,
  FiArrowRight,
  FiFilter,
} from 'react-icons/fi';
import orderService from '../../services/orderService';

const STATUS_OPTIONS = [
  { value: '', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function PharmacyOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Reject / Cancel modal state
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getPharmacyOrders(selectedStatus || null);
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load pharmacy orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const handleUpdateStatus = async (orderId, newStatus, reason = null) => {
    setUpdatingId(orderId);
    try {
      await orderService.updatePharmacyOrderStatus(orderId, newStatus, reason);
      if (rejectModalOrder) {
        setRejectModalOrder(null);
        setRejectReason('');
      }
      await fetchOrders();
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <FiClock className="w-3.5 h-3.5" />
            <span>Pending Acceptance</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <FiCheckCircle className="w-3.5 h-3.5" />
            <span>Confirmed</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Packaging</span>
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <FiHome className="w-3.5 h-3.5" />
            <span>Ready for Pickup</span>
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <FiTruck className="w-3.5 h-3.5" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <FiCheckCircle className="w-3.5 h-3.5" />
            <span>Delivered / Handed Over</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <FiXCircle className="w-3.5 h-3.5" />
            <span>Cancelled / Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <FiPackage className="w-7 h-7 text-cyan-400" />
            <span>{t('pharmacy.orders', 'Online Order Management')}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Accept, prepare, and fulfill online medicine orders placed by customers at your pharmacy.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedStatus(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === opt.value
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center">
          <FiRefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading incoming orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
          <FiPackage className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Orders in this category</h3>
          <p className="text-slate-400 text-xs">When customers order medicines from your pharmacy, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl transition-all hover:border-slate-700 space-y-5"
            >
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-cyan-400">{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      {order.deliveryMethod === 'HOME_DELIVERY' ? (
                        <>
                          <FiTruck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Home Delivery Order</span>
                        </>
                      ) : (
                        <>
                          <FiHome className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pharmacy Counter Pickup</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Total Value</span>
                  <span className="text-xl font-extrabold text-emerald-400">₹{Number(order.totalAmount).toFixed(2)}</span>
                  <span className="text-xs text-slate-400 block">Payment: {order.paymentMethod} ({order.paymentStatus})</span>
                </div>
              </div>

              {/* Customer & Fulfillment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 text-xs block mb-1">Customer Details</span>
                  <p className="font-semibold text-white flex items-center gap-2">
                    <FiUser className="w-4 h-4 text-cyan-400" />
                    <span>{order.customerName}</span>
                  </p>
                  <p className="text-slate-300 text-xs flex items-center gap-2 mt-1">
                    <FiPhone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{order.customerPhone}</span>
                  </p>
                </div>

                <div>
                  {order.deliveryMethod === 'HOME_DELIVERY' ? (
                    <div>
                      <span className="text-slate-400 text-xs block mb-1">Delivery Destination</span>
                      <p className="text-white text-xs flex items-start gap-1.5">
                        <FiMapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{order.deliveryAddress}, {order.landmark && `${order.landmark}, `}{order.city} - {order.postalCode}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                      <span className="text-cyan-400 font-semibold text-xs block">Customer Pickup Code</span>
                      <p className="font-mono text-base font-bold text-white tracking-widest mt-0.5">{order.pickupCode || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Line Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Items to Package ({order.items?.length || 0})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/40 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{item.medicineName}</span>
                        {item.genericName && <span className="text-slate-400 text-xs italic">{item.genericName}</span>}
                        <span className="text-cyan-400 font-semibold block mt-0.5">
                          Qty: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-400">₹{Number(item.totalPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation Reason if cancelled */}
              {order.status === 'CANCELLED' && order.cancellationReason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  <span className="font-semibold">Cancellation / Rejection Note: </span>
                  <span>{order.cancellationReason}</span>
                </div>
              )}

              {/* Action Buttons for Pharmacy Owner */}
              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => setRejectModalOrder(order)}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <FiSlash className="w-3.5 h-3.5" />
                        <span>Reject Order</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                        disabled={updatingId === order.id}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
                      >
                        {updatingId === order.id ? (
                          <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FiCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Accept & Confirm</span>
                      </button>
                    </>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      disabled={updatingId === order.id}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
                    >
                      {updatingId === order.id ? (
                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FiPackage className="w-3.5 h-3.5" />
                      )}
                      <span>Start Packaging</span>
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      disabled={updatingId === order.id}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                    >
                      {updatingId === order.id ? (
                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FiHome className="w-3.5 h-3.5" />
                      )}
                      <span>Mark Ready for Pickup/Dispatch</span>
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <>
                      {order.deliveryMethod === 'HOME_DELIVERY' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                          disabled={updatingId === order.id}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
                        >
                          {updatingId === order.id ? (
                            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiTruck className="w-3.5 h-3.5" />
                          )}
                          <span>Send Out for Delivery</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                          disabled={updatingId === order.id}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                        >
                          {updatingId === order.id ? (
                            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiCheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Counter Handover</span>
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      disabled={updatingId === order.id}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      {updatingId === order.id ? (
                        <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FiCheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Confirm Delivery Complete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Reject Order #{rejectModalOrder.orderNumber}</h3>
            <p className="text-xs text-slate-400">
              Please enter the reason for rejection. The customer will receive an immediate notification and reserved stock will be returned to inventory.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason for rejection *</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Prescribed dosage out of stock / Delivery area unreachable"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setRejectModalOrder(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(rejectModalOrder.id, 'CANCELLED', rejectReason)}
                disabled={updatingId === rejectModalOrder.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/30"
              >
                {updatingId === rejectModalOrder.id ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiSlash className="w-4 h-4" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
