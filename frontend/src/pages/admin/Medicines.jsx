import { useState, useEffect } from 'react';
import {
  FiBookOpen,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiTag,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

export default function AdminMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    dosageForm: 'Tablet',
    strength: '',
    description: '',
    requiresPrescription: false,
    barcode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();

      const data = await adminService.getMedicines(params);
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load medicines', err);
      toast.error('Failed to load central medicine catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedicines();
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      genericName: '',
      manufacturer: '',
      dosageForm: 'Tablet',
      strength: '',
      description: '',
      requiresPrescription: false,
      barcode: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (medicine) => {
    setIsEditing(true);
    setCurrentId(medicine.id);
    setFormData({
      name: medicine.name || '',
      genericName: medicine.genericName || '',
      manufacturer: medicine.manufacturer || '',
      dosageForm: medicine.dosageForm || 'Tablet',
      strength: medicine.strength || '',
      description: medicine.description || '',
      requiresPrescription: Boolean(medicine.requiresPrescription),
      barcode: medicine.barcode || '',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warn('Medicine name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        const updated = await adminService.updateMedicine(currentId, formData);
        setMedicines((prev) =>
          prev.map((m) => (m.id === currentId ? updated : m))
        );
        toast.success(`Medicine '${updated.name}' updated successfully.`);
      } else {
        const created = await adminService.createMedicine(formData);
        setMedicines((prev) => [created, ...prev]);
        toast.success(`Medicine '${created.name}' added to central catalog.`);
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save medicine.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedicine = async (medicine) => {
    if (
      !window.confirm(
        `Are you sure you want to remove '${medicine.name}' from the central catalog?`
      )
    ) {
      return;
    }

    try {
      await adminService.deleteMedicine(medicine.id);
      setMedicines((prev) => prev.filter((m) => m.id !== medicine.id));
      toast.success(`Medicine '${medicine.name}' deleted.`);
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to delete central medicine.';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-white">
      {/* Header */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-3 shadow-lg shadow-cyan-900/30">
              <FiBookOpen size={14} /> Global Medicine Library
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Central Medicine Catalog
            </h1>
            <p className="mt-1 text-sm text-primary-100/80">
              Manage standard drug molecules, barcodes, dosage strengths, and prescription rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMedicines}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="btn-primary py-2.5 px-5 text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-1.5"
            >
              <FiPlus size={16} /> Add Medicine
            </button>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={17} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by brand name, generic molecule, or barcode..."
          className="w-full rounded-2xl border border-white/20 bg-slate-900/70 pl-11 pr-28 py-3.5 text-sm text-white placeholder:text-primary-200/50 backdrop-blur-xl focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="submit"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 btn-primary py-2 px-5 text-xs font-bold"
        >
          Search
        </button>
      </form>

      {/* Medicines Table */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              <tr>
                <th className="px-5 py-4">Medicine & Molecule</th>
                <th className="px-5 py-4">Manufacturer</th>
                <th className="px-5 py-4">Form / Strength</th>
                <th className="px-5 py-4">Barcode</th>
                <th className="px-5 py-4">Prescription</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-primary-200 animate-pulse">
                    Loading medicine catalog items...
                  </td>
                </tr>
              ) : medicines.length > 0 ? (
                medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-white text-sm">{med.name}</p>
                        <p className="text-xs text-primary-200/80 mt-0.5">
                          {med.genericName || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-primary-100">{med.manufacturer || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="inline-block rounded-lg bg-white/10 px-2 py-1 text-xs text-cyan-200">
                        {med.dosageForm || 'Tablet'} {med.strength ? `· ${med.strength}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-primary-200">
                      {med.barcode ? (
                        <span className="inline-flex items-center gap-1 text-cyan-300">
                          <FiTag size={11} /> {med.barcode}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {med.requiresPrescription ? (
                        <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2.5 py-0.5 text-[11px] font-bold">
                          Rx Required
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold">
                          OTC
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(med)}
                          className="rounded-xl p-2 text-cyan-400 hover:bg-white/10 transition-colors"
                          title="Edit Medicine"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedicine(med)}
                          className="rounded-xl p-2 text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Delete Medicine"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-primary-200/70">
                    No medicines found in catalog. Click "Add Medicine" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 rounded-xl p-2 text-primary-200 hover:bg-white/10 hover:text-white"
            >
              <FiX size={18} />
            </button>

            <h3 className="text-xl font-black text-white">
              {isEditing ? 'Edit Catalog Medicine' : 'Add Central Medicine'}
            </h3>
            <p className="text-xs text-primary-200 mt-1">
              {isEditing
                ? 'Update drug formulations and universal barcode mappings.'
                : 'Register a new standard medicine into the MediFindAI database.'}
            </p>

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg, Augmentin 625 Duo"
                  className="w-full rounded-xl border border-white/20 bg-slate-950/70 p-3 text-xs text-white placeholder:text-primary-200/50 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                    Generic Molecule
                  </label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) =>
                      setFormData({ ...formData, genericName: e.target.value })
                    }
                    placeholder="e.g. Paracetamol"
                    className="w-full rounded-xl border border-white/20 bg-slate-950/70 p-3 text-xs text-white placeholder:text-primary-200/50 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    placeholder="e.g. Cipla, Sun Pharma"
                    className="w-full rounded-xl border border-white/20 bg-slate-950/70 p-3 text-xs text-white placeholder:text-primary-200/50 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) =>
                      setFormData({ ...formData, dosageForm: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/20 bg-slate-950/70 p-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg, 10ml"
                    className="w-full rounded-xl border border-white/20 bg-slate-950/70 p-3 text-xs text-white placeholder:text-primary-200/50 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Universal Barcode (GTIN / EAN-13)
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g. 8901088012345"
                  className="w-full font-mono rounded-xl border border-white/20 bg-slate-950/70 p-3 text-xs text-white placeholder:text-primary-200/50 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req-rx"
                  checked={formData.requiresPrescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiresPrescription: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="req-rx" className="text-xs font-semibold text-white">
                  Requires Doctor's Prescription (Schedule H / Rx)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2.5 px-6 text-xs font-bold shadow-lg shadow-cyan-500/25"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Medicine'
                    : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
