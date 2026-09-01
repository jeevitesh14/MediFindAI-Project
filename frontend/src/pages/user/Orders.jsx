import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  FiShoppingBag,
} from 'react-icons/fi';
import orderService from '../../services/orderService';

export default function UserOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    setCancellingId(cancelModalOrder.id);
    try {
      await orderService.cancelOrder(cancelModalOrder.id, cancelReason);
      setCancelModalOrder(null);
      setCancelReason('');
      await fetchOrders();
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <FiClock className="w-3.5 h-3.5" />
            <span>Pending Confirmation</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <FiCheckCircle className="w-3.5 h-3.5" />
            <span>Confirmed by Pharmacy</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Packaging & Preparing</span>
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
            <span>Delivered / Collected</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <FiXCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
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
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <FiPackage className="w-7 h-7 text-cyan-400" />
            <span>{t('orders.title', 'My Orders')}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track medicine online orders, delivery stages, and counter pickup codes in real time.
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
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <FiRefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
            <FiShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Orders Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            You haven't placed any online medicine orders yet. Search available medicines and add them to your cart.
          </p>
          <Link
            to="/medicines"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
          >
            Find Medicines
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl transition-all hover:border-slate-700"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
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
                          <span>Home Delivery</span>
                        </>
                      ) : (
                        <>
                          <FiHome className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Counter Pickup</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Total Amount</span>
                  <span className="text-xl font-bold text-emerald-400">₹{Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Pharmacy & Delivery details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 text-xs block mb-1">Pharmacy</span>
                  <p className="font-semibold text-white">{order.pharmacyName}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{order.pharmacyAddress || order.pharmacyCity}</p>
                  {order.pharmacyPhone && (
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                      <FiPhone className="w-3 h-3 text-cyan-400" />
                      <span>{order.pharmacyPhone}</span>
                    </p>
                  )}
                </div>

                <div>
                  {order.deliveryMethod === 'HOME_DELIVERY' ? (
                    <div>
                      <span className="text-slate-400 text-xs block mb-1">Delivery Address</span>
                      <p className="font-semibold text-white">{order.customerName} ({order.customerPhone})</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {order.deliveryAddress}, {order.landmark && `${order.landmark}, `}{order.city} - {order.postalCode}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                      <span className="text-cyan-400 font-semibold text-xs block">Pharmacy Pickup Verification Code</span>
                      <p className="font-mono text-lg font-bold text-white tracking-wider mt-1">{order.pickupCode || 'N/A'}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Show this code at the pharmacy counter for priority handoff.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Ordered Items ({order.items?.length || 0})
                </span>
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/40 text-xs sm:text-sm"
                    >
                      <div>
                        <span className="font-semibold text-white">{item.medicineName}</span>
                        {item.genericName && (
                          <span className="text-slate-400 text-xs ml-2 italic">({item.genericName})</span>
                        )}
                        <span className="text-slate-400 block text-xs mt-0.5">
                          Qty: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                      <span className="font-bold text-cyan-400">₹{Number(item.totalPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation Reason if cancelled */}
              {order.status === 'CANCELLED' && order.cancellationReason && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  <span className="font-semibold">Cancellation Note: </span>
                  <span>{order.cancellationReason}</span>
                </div>
              )}

              {/* Footer Actions */}
              {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setCancelModalOrder(order)}
                    disabled={cancellingId === order.id}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors flex items-center gap-2"
                  >
                    <FiXCircle className="w-4 h-4" />
                    <span>Cancel Order</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Cancel Order #{cancelModalOrder.orderNumber}</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to cancel this order? Reserved stock will be immediately returned to the pharmacy inventory.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason for cancellation (optional)</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed prescription / Ordered by mistake"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setCancelModalOrder(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancellingId === cancelModalOrder.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/30"
              >
                {cancellingId === cancelModalOrder.id ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiXCircle className="w-4 h-4" />
                )}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
