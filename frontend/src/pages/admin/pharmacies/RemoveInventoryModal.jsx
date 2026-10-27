import { useState } from 'react';
import {
  FiX,
  FiTrash2,
  FiAlertTriangle,
  FiRefreshCw,
  FiEyeOff,
  FiCheckCircle,
} from 'react-icons/fi';
import adminService from '../../../services/adminService';
import { toast } from 'react-toastify';

export default function RemoveInventoryModal({
  isOpen,
  onClose,
  pharmacy,
  item,
  onSuccess,
  onMarkOutOfStock,
}) {
  const [deleting, setDeleting] = useState(false);
  const [markingUnavailable, setMarkingUnavailable] = useState(false);

  if (!isOpen || !item || !pharmacy) return null;

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await adminService.deletePharmacyInventory(pharmacy.id, item.id);
      toast.success(
        `'${item.medicineName}' removed from ${pharmacy.name}. Central catalog record preserved.`
      );
      if (typeof onSuccess === 'function') {
        onSuccess(item.id);
      }
      onClose();
    } catch (err) {
      console.error('Failed to remove medicine from pharmacy inventory', err);
      toast.error(err.response?.data?.message || 'Failed to remove medicine from pharmacy.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleUnavailable = async () => {
    try {
      setMarkingUnavailable(true);
      const updated = await adminService.updatePharmacyStockQuantity(pharmacy.id, item.id, 0);
      toast.info(`'${item.medicineName}' marked as Out of Stock (0 units).`);
      if (typeof onMarkOutOfStock === 'function') {
        onMarkOutOfStock(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to set out of stock', err);
      toast.error(err.response?.data?.message || 'Failed to mark out of stock.');
    } finally {
      setMarkingUnavailable(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-500/30 bg-slate-900 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <FiAlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Remove Medicine from Pharmacy?</h3>
              <p className="text-xs text-slate-400">{pharmacy.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <p>
            Are you sure you want to remove <strong className="text-white font-bold">{item.medicineName}</strong> (
            {item.dosageForm} {item.strength ? `· ${item.strength}` : ''}) from{' '}
            <strong className="text-cyan-300">{pharmacy.name}</strong>?
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <FiCheckCircle size={15} />
              <span>Central Catalog Record Safe</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              This action only removes this medicine&apos;s inventory association with{' '}
              <span className="text-white font-semibold">{pharmacy.name}</span>. Other partner pharmacies stocking this
              medicine and the central catalog will not be affected.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Patient searches will immediately stop displaying this pharmacy as a supplier for this medicine.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleToggleUnavailable}
            disabled={markingUnavailable || deleting}
            className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 inline-flex items-center justify-center gap-1.5 order-3 sm:order-2"
          >
            {markingUnavailable ? (
              <FiRefreshCw className="animate-spin" size={13} />
            ) : (
              <FiEyeOff size={14} />
            )}
            <span>Mark Out of Stock Instead</span>
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={deleting || markingUnavailable}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 inline-flex items-center justify-center gap-1.5 order-1 sm:order-3"
          >
            {deleting ? (
              <FiRefreshCw className="animate-spin" size={13} />
            ) : (
              <FiTrash2 size={14} />
            )}
            <span>Confirm Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
