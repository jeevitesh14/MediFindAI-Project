import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiShoppingBag,
  FiTruck,
  FiShield,
  FiPackage,
  FiHome,
} from 'react-icons/fi';
import {
  selectCartItems,
  selectCartPharmacy,
  selectDeliveryMethod,
  selectCartSubtotal,
  selectDeliveryFee,
  selectCartTotal,
  updateQuantity,
  removeFromCart,
  setDeliveryMethod,
  clearCart,
} from '../../store/slices/cartSlice';

export default function Cart() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const items = useSelector(selectCartItems);
  const pharmacy = useSelector(selectCartPharmacy);
  const deliveryMethod = useSelector(selectDeliveryMethod);
  const subtotal = useSelector(selectCartSubtotal);
  const deliveryFee = useSelector(selectDeliveryFee);
  const total = useSelector(selectCartTotal);

  if (!items || items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 backdrop-blur-xl shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 shadow-inner">
            <FiShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Your Cart is Empty</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm sm:text-base leading-relaxed">
            You haven't added any medicines to your cart yet. Search medicines across verified local pharmacies to place an order.
          </p>
          <Link
            to="/medicines"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
          >
            <FiShoppingCart className="w-5 h-5" />
            <span>Search & Add Medicines</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <FiShoppingCart className="w-7 h-7 text-cyan-400" />
            <span>{t('cart.title', 'Shopping Cart')}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review your medicines, select delivery options, and proceed to checkout.
          </p>
        </div>
        <button
          onClick={() => dispatch(clearCart())}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-rose-400 hover:text-rose-300 font-medium px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all self-start sm:self-auto"
        >
          <FiTrash2 className="w-4 h-4" />
          <span>{t('cart.clear', 'Clear Cart')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pharmacy info card */}
          {pharmacy && (
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-0.5">
                <FiHome className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Fulfilling Pharmacy</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{pharmacy.name}</h3>
                <p className="text-xs sm:text-sm text-slate-400">{pharmacy.address || pharmacy.city || 'Verified Partner Pharmacy'}</p>
              </div>
            </div>
          )}

          {/* Medicines in cart */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.medicineId}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {item.dosageForm || 'Medicine'}
                    </span>
                    {item.strength && (
                      <span className="text-xs text-slate-400 font-medium">{item.strength}</span>
                    )}
                    {item.requiresPrescription && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Rx Required
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white">{item.medicineName}</h4>
                  {item.genericName && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">Gen: {item.genericName}</p>
                  )}
                  <p className="text-sm font-semibold text-cyan-400 mt-2">
                    ₹{Number(item.price).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ unit</span>
                  </p>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ medicineId: item.medicineId, quantity: item.quantity - 1 }))
                      }
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Decrease quantity"
                    >
                      <FiMinus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ medicineId: item.medicineId, quantity: item.quantity + 1 }))
                      }
                      disabled={item.quantity >= item.maxStock}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Increase quantity"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="text-xs text-slate-400 block">Item Total</span>
                    <span className="text-base font-bold text-emerald-400">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => dispatch(removeFromCart(item.medicineId))}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove item"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Method Selection */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <FiTruck className="w-4 h-4 text-cyan-400" />
              <span>Select Fulfillment Method</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => dispatch(setDeliveryMethod('HOME_DELIVERY'))}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  deliveryMethod === 'HOME_DELIVERY'
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${deliveryMethod === 'HOME_DELIVERY' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                  <FiTruck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">Home Delivery</span>
                    <span className="text-xs font-semibold text-cyan-400">₹40.00</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Delivered directly to your doorstep within 2–4 hours.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => dispatch(setDeliveryMethod('PHARMACY_PICKUP'))}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  deliveryMethod === 'PHARMACY_PICKUP'
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${deliveryMethod === 'PHARMACY_PICKUP' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                  <FiHome className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">Pharmacy Counter Pickup</span>
                    <span className="text-xs font-semibold text-emerald-400">FREE</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Packaged ahead of time for fast priority pickup.</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl sticky top-24 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">
              {t('cart.summary', 'Order Summary')}
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="text-white font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Fee</span>
                <span className={deliveryFee > 0 ? 'text-white font-medium' : 'text-emerald-400 font-semibold'}>
                  {deliveryFee > 0 ? `₹${deliveryFee.toFixed(2)}` : 'FREE'}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-3.5 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Total Amount</span>
                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2.5">
              <FiShield className="w-5 h-5 flex-shrink-0" />
              <span>Real-time stock verified directly with pharmacy database.</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
            >
              <span>{t('cart.checkout', 'Proceed to Checkout')}</span>
              <FiArrowRight className="w-5 h-5" />
            </button>

            <Link
              to="/medicines"
              className="block text-center text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium"
            >
              ← Continue Searching Medicines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
