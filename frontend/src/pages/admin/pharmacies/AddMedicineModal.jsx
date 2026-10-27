import { useState, useEffect } from 'react';
import {
  FiX,
  FiSearch,
  FiPlus,
  FiCheck,
  FiPackage,
  FiAlertCircle,
  FiRefreshCw,
  FiShoppingBag,
  FiDollarSign,
  FiLayers,
} from 'react-icons/fi';
import adminService from '../../../services/adminService';
import { toast } from 'react-toastify';

export default function AddMedicineModal({
  isOpen,
  onClose,
  pharmacies = [],
  defaultPharmacyId = null,
  onSuccess,
}) {
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(
    defaultPharmacyId ? String(defaultPharmacyId) : (pharmacies[0]?.id ? String(pharmacies[0].id) : '')
  );

  // Medicine catalog search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Quick Catalog Creation state
  const [showCatalogCreate, setShowCatalogCreate] = useState(false);
  const [newCatalogMed, setNewCatalogMed] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    dosageForm: 'Tablet',
    strength: '',
    requiresPrescription: false,
    description: '',
  });
  const [creatingCatalogMed, setCreatingCatalogMed] = useState(false);

  // Inventory Parameters
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Set default pharmacy if provided
  useEffect(() => {
    if (defaultPharmacyId) {
      setSelectedPharmacyId(String(defaultPharmacyId));
    } else if (pharmacies.length > 0 && !selectedPharmacyId) {
      setSelectedPharmacyId(String(pharmacies[0].id));
    }
  }, [defaultPharmacyId, pharmacies]);

  // Debounced medicine catalog search
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await adminService.getMedicines({ search: trimmed, size: 15 });
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to search central medicine catalog', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  const handleSelectMedicine = (med) => {
    setSelectedMedicine(med);
    setSearchQuery('');
    setSearchResults([]);
    setShowCatalogCreate(false);
  };

  const handleCreateCatalogMedicine = async (e) => {
    e.preventDefault();
    if (!newCatalogMed.name.trim()) {
      toast.error('Medicine name is required.');
      return;
    }

    try {
      setCreatingCatalogMed(true);
      const created = await adminService.createMedicine(newCatalogMed);
      toast.success(`'${created.name}' added to central medicine catalog!`);
      setSelectedMedicine(created);
      setShowCatalogCreate(false);
      setNewCatalogMed({
        name: '',
        genericName: '',
        manufacturer: '',
        dosageForm: 'Tablet',
        strength: '',
        requiresPrescription: false,
        description: '',
      });
    } catch (err) {
      console.error('Failed to create central medicine', err);
      toast.error(err.response?.data?.message || 'Failed to create medicine in central catalog.');
    } finally {
      setCreatingCatalogMed(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!selectedPharmacyId) errs.pharmacyId = 'Please select a destination pharmacy.';
    if (!selectedMedicine) errs.medicine = 'Please search and select a medicine.';
    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'Selling price must be greater than ₹0.00.';
    }
    const numQty = parseInt(quantity, 10);
    if (quantity === '' || isNaN(numQty) || numQty < 0) {
      errs.quantity = 'Stock quantity cannot be negative.';
    }
    const numThreshold = parseInt(lowStockThreshold, 10);
    if (!lowStockThreshold || isNaN(numThreshold) || numThreshold < 1) {
      errs.lowStockThreshold = 'Low stock threshold must be at least 1.';
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
        medicineId: selectedMedicine.id,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        lowStockThreshold: parseInt(lowStockThreshold, 10),
      };

      const result = await adminService.addPharmacyInventory(Number(selectedPharmacyId), payload);
      toast.success(
        `'${selectedMedicine.name}' successfully stocked at ₹${parseFloat(price).toFixed(2)} (${quantity} units)!`
      );
      if (typeof onSuccess === 'function') {
        onSuccess(result, Number(selectedPharmacyId));
      }
      onClose();
    } catch (err) {
      console.error('Failed to add medicine to pharmacy inventory', err);
      toast.error(err.response?.data?.message || 'Failed to add medicine to pharmacy inventory.');
    } finally {
      setSubmitting(false);
    }
  };

  const targetPharmacy = pharmacies.find((p) => String(p.id) === String(selectedPharmacyId));

  // Compute preview status
  const numQty = parseInt(quantity || '0', 10);
  const numThreshold = parseInt(lowStockThreshold || '10', 10);
  let previewStatus = 'AVAILABLE';
  if (numQty <= 0) previewStatus = 'OUT_OF_STOCK';
  else if (numQty <= numThreshold) previewStatus = 'LOW_STOCK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur-2xl text-white">
        {/* Modal Header */}
        <div className="flex-shrink-0 px-6 sm:px-8 py-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <FiPlus size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Add Medicine to Pharmacy</h3>
              <p className="text-xs text-slate-400">
                {targetPharmacy ? `Stocking inventory for ${targetPharmacy.name}` : 'Select a store and medicine'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          {/* Step 1: Destination Pharmacy */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              1. Select Destination Pharmacy *
            </label>
            <select
              value={selectedPharmacyId}
              onChange={(e) => setSelectedPharmacyId(e.target.value)}
              disabled={Boolean(defaultPharmacyId)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-60"
            >
              <option value="">Select a pharmacy...</option>
              {pharmacies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city || 'City'}) · License: {p.licenseNumber || 'N/A'}
                </option>
              ))}
            </select>
            {errors.pharmacyId && <p className="text-xs text-rose-400 mt-1">{errors.pharmacyId}</p>}
          </div>

          {/* Step 2: Choose Central Medicine */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                2. Select Medicine from Central Catalog *
              </label>
              <button
                type="button"
                onClick={() => setShowCatalogCreate(!showCatalogCreate)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline"
              >
                {showCatalogCreate ? 'Back to Search' : '+ New Central Medicine'}
              </button>
            </div>

            {/* Selected Medicine Banner */}
            {selectedMedicine ? (
              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 mt-0.5">
                    <FiPackage size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-base">{selectedMedicine.name}</h4>
                      {selectedMedicine.requiresPrescription ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Prescription (Rx)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          OTC
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {selectedMedicine.genericName ? `Molecule: ${selectedMedicine.genericName}` : 'Generic Molecule'}
                      {selectedMedicine.manufacturer ? ` · Mfg: ${selectedMedicine.manufacturer}` : ''}
                    </p>
                    <p className="text-xs text-cyan-400/90 font-mono mt-1">
                      {selectedMedicine.dosageForm || 'Tablet'} {selectedMedicine.strength ? `· ${selectedMedicine.strength}` : ''}
                      {selectedMedicine.category ? ` · Category: ${selectedMedicine.category}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMedicine(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                >
                  Change
                </button>
              </div>
            ) : showCatalogCreate ? (
              /* Inline Create Central Medicine Form */
              <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Create New Central Medicine Record
                  </h4>
                  <span className="text-[11px] text-slate-400">Will be added to central catalog</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Brand / Medicine Name *</label>
                    <input
                      type="text"
                      value={newCatalogMed.name}
                      onChange={(e) => setNewCatalogMed({ ...newCatalogMed, name: e.target.value })}
                      placeholder="e.g., Augmentin 625 Duo"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Generic Molecule Name</label>
                    <input
                      type="text"
                      value={newCatalogMed.genericName}
                      onChange={(e) => setNewCatalogMed({ ...newCatalogMed, genericName: e.target.value })}
                      placeholder="e.g., Amoxicillin + Clavulanic Acid"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Manufacturer</label>
                    <input
                      type="text"
                      value={newCatalogMed.manufacturer}
                      onChange={(e) => setNewCatalogMed({ ...newCatalogMed, manufacturer: e.target.value })}
                      placeholder="e.g., GlaxoSmithKline"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Dosage Form</label>
                    <select
                      value={newCatalogMed.dosageForm}
                      onChange={(e) => setNewCatalogMed({ ...newCatalogMed, dosageForm: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Drops">Drops</option>
                      <option value="Inhaler">Inhaler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Strength</label>
                    <input
                      type="text"
                      value={newCatalogMed.strength}
                      onChange={(e) => setNewCatalogMed({ ...newCatalogMed, strength: e.target.value })}
                      placeholder="e.g., 625mg / 500mg"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={newCatalogMed.requiresPrescription}
                        onChange={(e) =>
                          setNewCatalogMed({ ...newCatalogMed, requiresPrescription: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                      />
                      <span>Requires Doctor Prescription (Rx)</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCatalogCreate(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 font-semibold hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCatalogMedicine}
                    disabled={creatingCatalogMed}
                    className="btn-primary px-4 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {creatingCatalogMed && <FiRefreshCw className="animate-spin" size={12} />}
                    <span>Save to Catalog & Select</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Search Input & Live Dropdown */
              <div className="relative">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type medicine name or generic molecule (e.g. Paracetamol, Metformin)..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                  {searching && (
                    <FiRefreshCw
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-cyan-400"
                      size={15}
                    />
                  )}
                </div>

                {/* Dropdown Results */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-xl divide-y divide-slate-800/80">
                    {searchResults.map((med) => (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => handleSelectMedicine(med)}
                        className="w-full text-left px-4 py-3 hover:bg-cyan-500/10 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{med.name}</span>
                            {med.requiresPrescription ? (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                Rx
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                OTC
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {med.genericName ? `${med.genericName} · ` : ''}
                            {med.dosageForm} {med.strength ? `(${med.strength})` : ''}
                          </p>
                        </div>
                        <span className="text-xs text-cyan-400 font-bold shrink-0">Select →</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="p-3 text-xs text-slate-400 bg-slate-950/80 border border-slate-800 rounded-xl mt-1 flex items-center justify-between">
                    <span>No medicines found matching &apos;{searchQuery}&apos;.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCatalogMed((prev) => ({ ...prev, name: searchQuery }));
                        setShowCatalogCreate(true);
                      }}
                      className="text-cyan-400 font-bold underline"
                    >
                      + Create this medicine
                    </button>
                  </div>
                )}
              </div>
            )}
            {errors.medicine && <p className="text-xs text-rose-400 mt-1">{errors.medicine}</p>}
          </div>

          {/* Step 3: Store-Specific Pricing and Stock Parameters */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              3. Store-Specific Inventory Parameters
            </h4>

            <div className="grid sm:grid-cols-3 gap-4">
              {/* Selling Price */}
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
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
                {errors.price && <p className="text-[11px] text-rose-400 mt-1">{errors.price}</p>}
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Available Stock (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  required
                />
                {errors.quantity && <p className="text-[11px] text-rose-400 mt-1">{errors.quantity}</p>}
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="10"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
                {errors.lowStockThreshold && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.lowStockThreshold}</p>
                )}
              </div>
            </div>

            {/* Real-time Status Preview */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">Initial Stock Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  previewStatus === 'AVAILABLE'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : previewStatus === 'LOW_STOCK'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                {previewStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex-shrink-0 px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedMedicine}
            className="btn-primary py-2.5 px-6 font-bold shadow-lg shadow-cyan-500/25 disabled:opacity-50 inline-flex items-center gap-2 text-sm"
          >
            {submitting && <FiRefreshCw className="animate-spin" size={14} />}
            <span>Stock Medicine in Store</span>
          </button>
        </div>
      </div>
    </div>
  );
}
