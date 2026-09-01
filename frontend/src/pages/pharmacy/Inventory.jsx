import { useState, useEffect, useCallback } from 'react';
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiCheck,
  FiCamera,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import apiClient from '../../api/axiosConfig';
import pharmacyOwnerService from '../../services/pharmacyOwnerService';
import BarcodeScannerModal from '../../components/forms/BarcodeScannerModal';

export default function PharmacyInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [preselectedMed, setPreselectedMed] = useState(null);
  const [preselectedBarcode, setPreselectedBarcode] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);


  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedStatus) params.status = selectedStatus;

      const data = await pharmacyOwnerService.getInventory(params);
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load inventory', err);
      const message =
        err.response?.data?.message ||
        'Unable to load pharmacy inventory. Please check your connection and try again.';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatus]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);


  // Quick Stock Adjustment (+1 / -1)
  const handleQuickAdjust = async (item, delta) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    try {
      // Optimistic update
      setInventory((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: newQty,
                stockStatus:
                  newQty === 0
                    ? 'OUT_OF_STOCK'
                    : newQty <= i.lowStockThreshold
                    ? 'LOW_STOCK'
                    : 'AVAILABLE',
              }
            : i
        )
      );
      await pharmacyOwnerService.updateStock(item.id, newQty);
    } catch (err) {
      toast.error('Failed to update stock quantity.');
      fetchInventory();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    try {
      setActionLoading(true);
      await pharmacyOwnerService.deleteInventory(deleteItem.id);
      toast.success(`Removed ${deleteItem.medicineName} from inventory.`);
      setDeleteItem(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove medicine.');
    } finally {
      setActionLoading(false);
    }
  };

  // Triggered when barcode scanner finds a medicine in the database
  const handleBarcodeMedicineFound = (medicine) => {
    setIsBarcodeOpen(false);
    setPreselectedMed(medicine);
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-white pb-12">
      {/* Header Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-2 shadow-sm">
              <FiPackage size={13} /> Stock & Telemetry Catalog
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Medicine Inventory Management
            </h1>
            <p className="text-xs sm:text-sm text-primary-200/80 mt-1">
              Add medicines from the central catalog, scan medicine barcodes, set unit pricing, and maintain real-time stock levels.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsBarcodeOpen(true)}
              className="btn-secondary py-3 px-5 text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2 border-cyan-400/30 hover:border-cyan-400 text-cyan-300 hover:text-white"
            >
              <FiCamera size={16} /> Scan Barcode
            </button>
            <button
              type="button"
              onClick={() => {
                setPreselectedMed(null);
                setIsAddOpen(true);
              }}
              className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <FiPlus size={16} /> Add Medicine to Inventory
            </button>
          </div>
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
            placeholder="Search inventory by medicine or generic molecule name..."
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

        {/* Stock Status Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'All Items', value: '' },
            { label: 'Available', value: 'AVAILABLE' },
            { label: 'Low Stock', value: 'LOW_STOCK' },
            { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                selectedStatus === tab.value
                  ? 'bg-cyan-500 text-primary-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-white/5 text-primary-200/80 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={fetchInventory}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-primary-200/80 hover:bg-white/10 hover:text-white transition-all"
            title="Refresh Inventory"
          >
            <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {/* Error Fallback Card */}
      {fetchError && !loading && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 p-6 text-center shadow-xl backdrop-blur-md space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <FiAlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-200">Unable to Load Inventory</h3>
            <p className="text-xs text-primary-200/80 max-w-md mx-auto mt-1">{fetchError}</p>
          </div>
          <button
            type="button"
            onClick={fetchInventory}
            className="btn-secondary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <FiRefreshCw size={13} /> Retry Loading
          </button>
        </div>
      )}

      {/* Inventory Table / Cards */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 text-white">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent shadow-lg shadow-cyan-500/20" />
          <p className="text-xs font-medium text-cyan-200 animate-pulse">Filtering inventory records...</p>
        </div>
      ) : inventory.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-white/10 bg-slate-950/60 text-primary-200/90 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-5">Medicine & Formula</th>
                  <th className="py-4 px-4">Dosage / Form</th>
                  <th className="py-4 px-4">Unit Price</th>
                  <th className="py-4 px-4">In Stock</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    {/* Medicine Details */}
                    <td className="py-4 px-5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm sm:text-base">{item.medicineName}</p>
                          {item.requiresPrescription ? (
                            <span className="badge-rx text-[10px]">Rx</span>
                          ) : (
                            <span className="badge-otc text-[10px]">OTC</span>
                          )}
                        </div>
                        <p className="text-xs text-primary-200/80">{item.genericName || 'Molecule info N/A'}</p>
                        {item.manufacturer && (
                          <p className="text-[11px] text-primary-300/60">Mfg: {item.manufacturer}</p>
                        )}
                        {item.barcode && (
                          <p className="text-[10px] font-mono text-cyan-300/70">Barcode: {item.barcode}</p>
                        )}
                      </div>
                    </td>

                    {/* Strength / Form */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-white">{item.strength || 'Standard'}</p>
                      <p className="text-xs text-primary-200/70">{item.dosageForm || 'Tablets'}</p>
                    </td>

                    {/* Unit Price */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-cyan-300 text-sm sm:text-base">
                        ₹{Number(item.price).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-primary-300/60">per unit</p>
                    </td>

                    {/* Quantity with quick adjust stepper */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(item, -1)}
                          disabled={item.quantity <= 0}
                          className="h-7 w-7 rounded-lg border border-white/15 bg-white/5 flex items-center justify-center text-xs font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          -
                        </button>
                        <span className="font-mono text-sm font-black text-white w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(item, 1)}
                          className="h-7 w-7 rounded-lg border border-white/15 bg-white/5 flex items-center justify-center text-xs font-bold hover:bg-white/10 transition-all"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-[10px] text-primary-300/60 mt-0.5">
                        Alert at &le; {item.lowStockThreshold}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {item.stockStatus === 'AVAILABLE' && (
                        <span className="badge-available flex items-center gap-1 text-[11px] w-fit">
                          <FiCheckCircle size={12} /> Available
                        </span>
                      )}
                      {item.stockStatus === 'LOW_STOCK' && (
                        <span className="badge-low-stock flex items-center gap-1 text-[11px] w-fit">
                          <FiAlertCircle size={12} /> Low Stock
                        </span>
                      )}
                      {item.stockStatus === 'OUT_OF_STOCK' && (
                        <span className="badge-out-of-stock flex items-center gap-1 text-[11px] w-fit">
                          <FiX size={12} /> Out of Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditItem(item)}
                          className="rounded-xl border border-white/10 bg-white/5 p-2 text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-colors"
                          title="Edit Quantity & Pricing"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItem(item)}
                          className="rounded-xl border border-rose-500/20 bg-rose-950/30 p-2 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
                          title="Remove from inventory"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !fetchError ? (
        <div className="rounded-3xl border border-white/15 bg-white/10 p-12 text-center shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
            <FiPackage size={32} />
          </div>
          <div>
            <p className="text-base font-bold text-white">No inventory items matched your criteria</p>
            <p className="text-xs text-primary-200/70 max-w-md mx-auto mt-1">
              {search
                ? `No medicines found matching "${search}". Try a different keyword, scan a barcode, or add a new medicine.`
                : 'Your pharmacy inventory is currently empty. Start by scanning medicine barcodes or adding medicines from our global catalog.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsBarcodeOpen(true)}
              className="btn-secondary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2 border-cyan-400/30 text-cyan-300"
            >
              <FiCamera size={15} /> Scan Barcode
            </button>
            <button
              type="button"
              onClick={() => {
                setPreselectedMed(null);
                setIsAddOpen(true);
              }}
              className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2"
            >
              <FiPlus size={15} /> Add First Medicine
            </button>
          </div>
        </div>
      ) : null}

      {/* --- BARCODE SCANNER MODAL --- */}
      {isBarcodeOpen && (
        <BarcodeScannerModal
          isOpen={isBarcodeOpen}
          onClose={() => setIsBarcodeOpen(false)}
          onMedicineFound={handleBarcodeMedicineFound}
          onManualSearch={(barcode) => {
            setPreselectedBarcode(barcode || '');
            setIsBarcodeOpen(false);
            setIsAddOpen(true);
          }}
        />
      )}

      {/* --- ADD MEDICINE MODAL --- */}
      {isAddOpen && (
        <AddMedicineModal
          isOpen={isAddOpen}
          initialMedicine={preselectedMed}
          initialBarcode={preselectedBarcode}
          onClose={() => {
            setIsAddOpen(false);
            setPreselectedMed(null);
            setPreselectedBarcode('');
          }}
          onAdded={() => {
            setIsAddOpen(false);
            setPreselectedMed(null);
            setPreselectedBarcode('');
            fetchInventory();
          }}
          onOpenBarcodeScanner={() => {
            setIsAddOpen(false);
            setIsBarcodeOpen(true);
          }}
        />
      )}

      {/* --- EDIT STOCK MODAL --- */}
      {editItem && (
        <EditStockModal
          item={editItem}
          isOpen={Boolean(editItem)}
          onClose={() => setEditItem(null)}
          onUpdated={() => {
            setEditItem(null);
            fetchInventory();
          }}
        />
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-950 p-6 shadow-2xl space-y-5 text-white animate-scale-in">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                <FiTrash2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Remove from Inventory?</h3>
            </div>

            <p className="text-xs text-primary-200/80 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{deleteItem.medicineName}</strong> from your pharmacy inventory? Regular users will no longer see this medicine listed under your store.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="btn-secondary py-2.5 px-4 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteConfirm}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-colors"
              >
                {actionLoading ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENT: ADD MEDICINE MODAL ---
function AddMedicineModal({ isOpen, initialMedicine, initialBarcode, onClose, onAdded, onOpenBarcodeScanner }) {
  const [catalogQuery, setCatalogQuery] = useState(initialMedicine ? initialMedicine.name : '');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMed, setSelectedMed] = useState(initialMedicine || null);
  const [searching, setSearching] = useState(false);

  const [barcodeInput, setBarcodeInput] = useState(initialBarcode || '');
  const [barcodeSearching, setBarcodeSearching] = useState(false);

  const [quantity, setQuantity] = useState(20);
  const [price, setPrice] = useState('45.00');
  const [threshold, setThreshold] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialMedicine) {
      setSelectedMed(initialMedicine);
      setCatalogQuery(initialMedicine.name);
    }
  }, [initialMedicine]);

  useEffect(() => {
    if (initialBarcode) {
      setBarcodeInput(initialBarcode);
    }
  }, [initialBarcode]);


  // Search catalogue suggestions by name
  useEffect(() => {
    if (!catalogQuery.trim() || catalogQuery.trim().length < 2 || selectedMed) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await apiClient.get('/medicines/suggestions', {
          params: { q: catalogQuery.trim() },
        });
        setSuggestions(res.data?.data || []);
      } catch (err) {
        try {
          const fallbackRes = await apiClient.get('/medicines/search', {
            params: { q: catalogQuery.trim() },
          });
          setSuggestions(fallbackRes.data?.data || []);
        } catch {
          setSuggestions([]);
        }
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [catalogQuery, selectedMed]);

  // Manual Barcode Lookup inside Add Modal
  const handleBarcodeLookup = async () => {
    if (!barcodeInput.trim()) return;
    try {
      setBarcodeSearching(true);
      const res = await apiClient.get(`/medicines/barcode/${barcodeInput.trim()}`);
      if (res.data?.data) {
        setSelectedMed(res.data.data);
        setCatalogQuery(res.data.data.name);
        setBarcodeInput('');
        toast.success(`Selected "${res.data.data.name}" via barcode!`);
      } else {
        toast.error('No medicine found for this barcode.');
      }
    } catch (err) {
      toast.error('Medicine not found for this barcode.');
    } finally {
      setBarcodeSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMed) {
      toast.warning('Please select a medicine from catalog search or barcode lookup.');
      return;
    }

    const numQty = parseInt(quantity, 10);
    const numPrice = parseFloat(price);
    const numThreshold = parseInt(threshold, 10);

    if (isNaN(numQty) || numQty < 0) {
      toast.error('Quantity cannot be negative.');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error('Price must be greater than zero.');
      return;
    }

    try {
      setSaving(true);
      await pharmacyOwnerService.addInventory({
        medicineId: selectedMed.id,
        quantity: numQty,
        price: numPrice,
        lowStockThreshold: numThreshold || 10,
      });
      toast.success(`Successfully added ${selectedMed.name} to your inventory!`);
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medicine to inventory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-slate-950 p-6 sm:p-7 shadow-2xl space-y-6 text-white animate-scale-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <FiPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Medicine to Inventory</h3>
              <p className="text-xs text-primary-200/70">
                Select from central catalog, barcode scanner, or manual input
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-primary-200/70 hover:bg-white/10 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Step 1: Catalogue Medicine Search & Barcode Quick-fill */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-primary-100">
                1. Select Medicine from Central Catalog <span className="text-cyan-400">*</span>
              </label>
              {onOpenBarcodeScanner && (
                <button
                  type="button"
                  onClick={onOpenBarcodeScanner}
                  className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-1"
                >
                  <FiCamera size={13} /> Scan Barcode with Camera
                </button>
              )}
            </div>

            {/* Name Search Input */}
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-300/70" size={16} />
              <input
                type="text"
                value={catalogQuery}
                onChange={(e) => {
                  setCatalogQuery(e.target.value);
                  if (selectedMed && e.target.value !== selectedMed.name) {
                    setSelectedMed(null);
                  }
                }}
                placeholder="Search by medicine name or generic molecule..."
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-primary-300/50 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
              {searching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                </div>
              )}
            </div>

            {/* Manual Barcode Input Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeLookup();
                  }
                }}
                placeholder="Or type barcode (e.g. 8901088012345)..."
                className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 py-2 px-3 text-xs text-white placeholder:text-primary-300/40 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleBarcodeLookup}
                disabled={barcodeSearching || !barcodeInput.trim()}
                className="btn-secondary py-2 px-3 text-xs font-semibold shrink-0 disabled:opacity-40"
              >
                {barcodeSearching ? 'Searching...' : 'Lookup Barcode'}
              </button>
            </div>

            {/* Suggestions list */}
            {suggestions.length > 0 && !selectedMed && (
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-2 divide-y divide-white/10 shadow-xl space-y-1">
                {suggestions.map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => {
                      setSelectedMed(med);
                      setCatalogQuery(med.name);
                      setSuggestions([]);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-cyan-500/20 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-cyan-200">{med.name}</p>
                      <p className="text-[11px] text-primary-200/70">
                        {med.genericName} · {med.strength || ''} ({med.dosageForm || 'Tab'})
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select ➔
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Medicine Pill */}
            {selectedMed && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <FiCheck size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-200">{selectedMed.name}</p>
                    <p className="text-[11px] text-emerald-100/70">
                      {selectedMed.genericName} · {selectedMed.strength || 'Standard'} · {selectedMed.dosageForm || 'Tablets'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMed(null);
                    setCatalogQuery('');
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Quantity and Price Inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Available Quantity <span className="text-cyan-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Unit Price (₹) <span className="text-cyan-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
              <p className="text-[11px] text-primary-300/60 mt-1">
                You will receive automated low stock alerts when quantity falls below this value.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2.5 px-5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedMed}
              className="btn-primary py-2.5 px-6 text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Adding to Stock...' : 'Save to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- SUBCOMPONENT: EDIT STOCK MODAL ---
function EditStockModal({ item, isOpen, onClose, onUpdated }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [price, setPrice] = useState(item.price);
  const [threshold, setThreshold] = useState(item.lowStockThreshold || 10);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const numQty = parseInt(quantity, 10);
    const numPrice = parseFloat(price);
    const numThreshold = parseInt(threshold, 10);

    if (isNaN(numQty) || numQty < 0) {
      toast.error('Quantity cannot be negative.');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error('Price must be greater than zero.');
      return;
    }

    try {
      setSaving(true);
      await pharmacyOwnerService.updateInventory(item.id, {
        quantity: numQty,
        price: numPrice,
        lowStockThreshold: numThreshold || 10,
      });
      toast.success('Inventory stock and pricing updated successfully.');
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update inventory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950 p-6 sm:p-7 shadow-2xl space-y-6 text-white animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Update Stock & Pricing</h3>
            <p className="text-xs text-cyan-300">{item.medicineName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-primary-200/70 hover:bg-white/10 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 text-left">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Available Quantity <span className="text-cyan-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Unit Price (₹) <span className="text-cyan-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2.5 px-5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-2.5 px-6 text-xs font-bold"
            >
              {saving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
