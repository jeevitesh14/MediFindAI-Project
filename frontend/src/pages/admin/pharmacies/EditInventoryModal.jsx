import { useState, useEffect } from 'react';
import {
  FiX,
  FiEdit2,
  FiCheck,
  FiRefreshCw,
  FiPackage,
  FiPlus,
  FiMinus,
  FiAlertTriangle,
} from 'react-icons/fi';
import adminService from '../../../services/adminService';
import { toast } from 'react-toastify';

export default function EditInventoryModal({
  isOpen,
  onClose,
  pharmacy,
  item,
  onSuccess,
}) {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setPrice(item.price ? String(item.price) : '');
      setQuantity(item.quantity !== undefined && item.quantity !== null ? String(item.quantity) : '0');
      setLowStockThreshold(
        item.lowStockThreshold !== undefined && item.lowStockThreshold !== null
          ? String(item.lowStockThreshold)
          : '10'
      );
      setErrors({});
    }
  }, [item, isOpen]);

  if (!isOpen || !item || !pharmacy) return null;

  const handleAdjustQuantity = (delta) => {
    const current = parseInt(quantity || '0', 10);
    const updated = Math.max(0, current + delta);
    setQuantity(String(updated));
  };

  const handleSetZero = () => {
    setQuantity('0');
  };

  const validate = () => {
    const errs = {};
    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'Price must be greater than ₹0.00';
    }
    const numQty = parseInt(quantity, 10);
    if (quantity === '' || isNaN(numQty) || numQty < 0) {
      errs.quantity = 'Quantity cannot be negative';
    }
    const numThreshold = parseInt(lowStockThreshold, 10);
    if (!lowStockThreshold || isNaN(numThreshold) || numThreshold < 1) {
      errs.lowStockThreshold = 'Threshold must be at least 1';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    try {
      setSubmitting(true);
      const payload = {
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        lowStockThreshold: parseInt(lowStockThreshold, 10),
      };

      const updated = await adminService.updatePharmacyInventory(pharmacy.id, item.id, payload);
      toast.success(`Inventory for '${item.medicineName}' updated successfully!`);
      if (typeof onSuccess === 'function') {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update pharmacy inventory', err);
      toast.error(err.response?.data?.message || 'Failed to update inventory.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute live status preview
  const numQty = parseInt(quantity || '0', 10);
  const numThreshold = parseInt(lowStockThreshold || '10', 10);
  let computedStatus = 'AVAILABLE';
  if (numQty <= 0) computedStatus = 'OUT_OF_STOCK';
  else if (numQty <= numThreshold) computedStatus = 'LOW_STOCK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur-2xl text-white">
        {/* Header */}
        <div className="flex-shrink-0 px-6 sm:px-8 py-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <FiEdit2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Edit Medicine Stock & Price</h3>
              <p className="text-xs text-slate-400">{pharmacy.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
          {/* Medicine Card Overview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                <FiPackage size={18} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{item.medicineName}</h4>
                <p className="text-xs text-slate-400">
                  {item.dosageForm} {item.strength ? `· ${item.strength}` : ''}
                  {item.category ? ` · ${item.category}` : ''}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                computedStatus === 'AVAILABLE'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : computedStatus === 'LOW_STOCK'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {computedStatus.replace('_', ' ')}
            </span>
          </div>

          {/* Price Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Selling Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-8 pr-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            {errors.price && <p className="text-[11px] text-rose-400 mt-1">{errors.price}</p>}
          </div>

          {/* Stock Quantity & Quick Adjustments */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Current Stock Quantity (Units) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            {errors.quantity && <p className="text-[11px] text-rose-400">{errors.quantity}</p>}

            {/* Quick stock adjustment chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Quick Adjust:</span>
              <button
                type="button"
                onClick={() => handleAdjustQuantity(10)}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handleAdjustQuantity(50)}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => handleAdjustQuantity(-10)}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400"
              >
                -10
              </button>
              <button
                type="button"
                onClick={handleSetZero}
                className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300"
              >
                Mark Out of Stock (0)
              </button>
            </div>
          </div>

          {/* Low Stock Alert Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Low Stock Alert Threshold
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="10"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
            {errors.lowStockThreshold && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.lowStockThreshold}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              When stock drops to or below this count, it will be flagged as Low Stock.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary py-2 px-5 text-xs font-bold shadow-lg shadow-cyan-500/25 inline-flex items-center gap-1.5"
          >
            {submitting && <FiRefreshCw className="animate-spin" size={13} />}
            <span>Save Inventory Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
