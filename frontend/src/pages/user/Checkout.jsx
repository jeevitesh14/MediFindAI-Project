import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FiCreditCard,
  FiTruck,
  FiHome,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiUser,
  FiDollarSign,
  FiZap,
} from 'react-icons/fi';
import {
  selectCartItems,
  selectCartPharmacy,
  selectDeliveryMethod,
  selectCartSubtotal,
  selectDeliveryFee,
  selectCartTotal,
  clearCart,
} from '../../store/slices/cartSlice';
import useAuth from '../../hooks/useAuth';
import orderService from '../../services/orderService';

export default function Checkout() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useAuth();
  const items = useSelector(selectCartItems);

  const pharmacy = useSelector(selectCartPharmacy);
  const deliveryMethod = useSelector(selectDeliveryMethod);
  const subtotal = useSelector(selectCartSubtotal);
  const deliveryFee = useSelector(selectDeliveryFee);
  const total = useSelector(selectCartTotal);

  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    deliveryAddress: '',
    landmark: '',
    city: 'Hyderabad',
    postalCode: '500001',
    paymentMethod: 'CASH_ON_DELIVERY', // 'CASH_ON_DELIVERY' or 'ONLINE_MOCK'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  if (!items || items.length === 0) {
    if (successOrder) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-10 sm:p-14 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950">
              <FiCheckCircle className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Order Confirmed</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Thank You for Your Order!
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Order ID: <span className="font-mono font-bold text-cyan-400">{successOrder.orderNumber}</span>
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fulfilling Pharmacy:</span>
                <span className="text-white font-semibold">{successOrder.pharmacyName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fulfillment Method:</span>
                <span className="text-cyan-400 font-semibold">{successOrder.deliveryMethod}</span>
              </div>
              {successOrder.pickupCode && (
                <div className="flex justify-between text-sm bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                  <span className="text-cyan-300 font-semibold">Pickup Code:</span>
                  <span className="font-mono font-bold text-white tracking-widest">{successOrder.pickupCode}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-slate-800 pt-2">
                <span className="text-slate-400">Total Paid/Payable:</span>
                <span className="text-emerald-400 font-bold text-base">₹{Number(successOrder.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                to="/orders"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
              >
                Track in My Orders
              </Link>
              <Link
                to="/medicines"
                className="px-6 py-3.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-medium transition-all"
              >
                Search More Medicines
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 backdrop-blur-xl">
          <p className="text-slate-400 mb-6">Your cart is empty. Please add items to checkout.</p>
          <Link
            to="/medicines"
            className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/20"
          >
            Find Medicines
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!formData.customerPhone.trim()) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }
    if (deliveryMethod === 'HOME_DELIVERY' && !formData.deliveryAddress.trim()) {
      setErrorMessage('Please enter your delivery street address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        pharmacyId: pharmacy.id,
        deliveryMethod,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryAddress: deliveryMethod === 'HOME_DELIVERY' ? formData.deliveryAddress : null,
        landmark: deliveryMethod === 'HOME_DELIVERY' ? formData.landmark : null,
        city: deliveryMethod === 'HOME_DELIVERY' ? formData.city : null,
        postalCode: deliveryMethod === 'HOME_DELIVERY' ? formData.postalCode : null,
        paymentMethod: formData.paymentMethod,
        items: items.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
        })),
      };

      const createdOrder = await orderService.createOrder(orderPayload);
      dispatch(clearCart());
      setSuccessOrder(createdOrder);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-cyan-400 transition-colors font-medium mb-6"
      >
        <FiArrowLeft className="w-4 h-4" />
        <span>Back to Shopping Cart</span>
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
        <FiCreditCard className="w-7 h-7 text-cyan-400" />
        <span>{t('checkout.title', 'Secure Checkout')}</span>
      </h1>
      <p className="text-slate-400 text-sm mb-8">
        Complete your contact and delivery information to place your order with {pharmacy?.name}.
      </p>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiUser className="w-5 h-5 text-cyan-400" />
              <span>Customer Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address (only for Home Delivery) */}
          {deliveryMethod === 'HOME_DELIVERY' ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <FiMapPin className="w-5 h-5 text-cyan-400" />
                <span>Home Delivery Address</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Street Address / Flat / Building *</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    placeholder="House / Flat No, Street, Colony..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Landmark</label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="Near Metro Station"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-xl flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FiHome className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Pharmacy Counter Pickup Selected</h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  You can collect your order directly from <span className="text-white font-medium">{pharmacy?.name}</span> ({pharmacy?.address || pharmacy?.city}). An order code will be generated upon confirmation.
                </p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiDollarSign className="w-5 h-5 text-cyan-400" />
              <span>Payment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  formData.paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH_ON_DELIVERY"
                  checked={formData.paymentMethod === 'CASH_ON_DELIVERY'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="text-sm font-bold text-white block">Cash on Delivery / Pickup (COD)</span>
                  <span className="text-xs text-slate-400 mt-0.5 block">Pay cash or UPI at the doorstep or counter upon receipt.</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  formData.paymentMethod === 'ONLINE_MOCK'
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE_MOCK"
                  checked={formData.paymentMethod === 'ONLINE_MOCK'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">Online Payment (Instant)</span>
                    <FiZap className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">Simulated UPI, Cards & NetBanking gateway (Instant auto-receipt).</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl sticky top-24 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">
              Items Review ({items.length})
            </h3>

            <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
              {items.map((item) => (
                <div key={item.medicineId} className="flex justify-between text-xs sm:text-sm">
                  <div>
                    <span className="text-white font-medium block">{item.medicineName}</span>
                    <span className="text-slate-400">Qty: {item.quantity} × ₹{item.price}</span>
                  </div>
                  <span className="text-cyan-400 font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Fee</span>
                <span className={deliveryFee > 0 ? 'text-white font-medium' : 'text-emerald-400 font-semibold'}>
                  {deliveryFee > 0 ? `₹${deliveryFee.toFixed(2)}` : 'FREE'}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Grand Total</span>
                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
            >
              {isSubmitting ? (
                <>
                  <FiRefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
