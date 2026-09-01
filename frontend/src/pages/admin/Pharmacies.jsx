import { useState, useEffect } from 'react';
import {
  FiShoppingBag,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMapPin,
  FiPhone,
  FiMail,
  FiFileText,
  FiRefreshCw,
  FiX,
  FiCheck,
  FiTrash2,
  FiAlertTriangle,
  FiShield,
  FiPackage,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Delete / Remove confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pharmacyToDelete, setPharmacyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus) params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const data = await adminService.getPharmacies(params);
      setPharmacies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pharmacies', err);
      toast.error(err.response?.data?.message || 'Failed to load pharmacy network partners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPharmacies();
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchPharmacies();
  };

  // --- Open Verification Modal ---
  const handleOpenVerifyModal = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setVerifyStatus(
      pharmacy.verificationStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED'
    );
    setRemarks('');
    setVerifyModalOpen(true);
  };

  // --- Submit Verification Status ---
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPharmacy || isVerifying) return;

    try {
      setIsVerifying(true);
      const updated = await adminService.verifyPharmacy(selectedPharmacy.id, {
        status: verifyStatus,
        remarks: remarks.trim() || undefined,
      });

      setPharmacies((prev) =>
        prev.map((p) => (p.id === selectedPharmacy.id ? updated : p))
      );
      toast.success(
        `Pharmacy '${selectedPharmacy.name}' verification updated to ${verifyStatus}.`
      );
      setVerifyModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update pharmacy verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  // --- Open Delete Confirmation Modal ---
  const handleOpenDeleteModal = (pharmacy) => {
    setPharmacyToDelete(pharmacy);
    setDeleteModalOpen(true);
  };

  // --- Confirm Delete Pharmacy ---
  const handleConfirmDelete = async () => {
    if (!pharmacyToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await adminService.deletePharmacy(pharmacyToDelete.id);

      // Remove immediately from UI state
      setPharmacies((prev) => prev.filter((p) => p.id !== pharmacyToDelete.id));
      toast.success(`Pharmacy '${pharmacyToDelete.name}' and all associated records have been removed.`);
      setDeleteModalOpen(false);
      setPharmacyToDelete(null);
    } catch (err) {
      console.error('Failed to remove pharmacy', err);
      toast.error(err.response?.data?.message || 'Failed to remove pharmacy. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 text-xs font-bold shadow-sm">
            <FiCheckCircle size={13} className="text-emerald-400" />
            <span>Verified</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 px-3 py-1 text-xs font-bold shadow-sm">
            <FiXCircle size={13} className="text-rose-400" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 text-xs font-bold shadow-sm animate-pulse">
            <FiClock size={13} className="text-amber-400" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-white pb-12">
      {/* Header Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-3 shadow-lg shadow-cyan-900/30">
              <FiShoppingBag size={14} /> Pharmacy Network & Licensing
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Pharmacy Partners
            </h1>
            <p className="mt-1 text-sm text-primary-100/80 max-w-2xl">
              Audit regulatory drug licenses, approve or reject partner registrations, inspect stocked inventory, and manage registered pharmacy listings.
            </p>
          </div>

          <button
            onClick={fetchPharmacies}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 hover:border-cyan-400/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            title="Refresh pharmacy partners"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </section>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-3xl backdrop-blur-xl shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pharmacy name, city, location, phone, email, or license #..."
            className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 pl-11 pr-28 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 backdrop-blur-xl focus:border-cyan-400 focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              title="Clear search"
            >
              <FiX size={15} />
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 py-1.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'ALL'}
              onClick={() => setSelectedStatus(f.value)}
              className={`rounded-xl px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                selectedStatus === f.value
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                  : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pharmacies Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <FiRefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-slate-300 text-sm font-medium">Loading pharmacy partner network...</p>
        </div>
      ) : pharmacies.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {pharmacies.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 shadow-2xl backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/90 transition-all space-y-5"
            >
              <div className="space-y-4">
                {/* Pharmacy Header & Badge */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                        {pharmacy.name}
                      </h2>
                      {pharmacy.is24Hours && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 text-[10px] font-semibold border border-teal-500/30">
                          24/7 Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-cyan-300 flex items-center gap-1.5 mt-1">
                      <FiFileText size={13} className="text-cyan-400 shrink-0" />
                      <span>{pharmacy.licenseNumber || 'License Pending'}</span>
                    </p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(pharmacy.verificationStatus)}</div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 leading-relaxed">
                  {pharmacy.description || 'Verified local community healthcare pharmacy partner.'}
                </p>

                {/* Contact & Location Details */}
                <div className="space-y-2 rounded-2xl bg-slate-950/60 border border-slate-800/60 p-4 text-xs text-slate-300">
                  <p className="flex items-start gap-2">
                    <FiMapPin size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      {pharmacy.addressLine}, {pharmacy.city}, {pharmacy.state} {pharmacy.postalCode}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FiPhone size={14} className="text-cyan-400 shrink-0" />
                    <span>{pharmacy.phone || 'Phone not provided'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FiMail size={14} className="text-cyan-400 shrink-0" />
                    <span>{pharmacy.email || pharmacy.ownerEmail || 'Email not provided'}</span>
                  </p>
                  {pharmacy.ownerName && (
                    <p className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-slate-400">
                      <span>Owner: <strong className="text-slate-200 font-semibold">{pharmacy.ownerName}</strong></span>
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer with Stock Info & Actions */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FiPackage size={16} />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Stock Catalog</span>
                    <span className="text-sm font-bold text-white">
                      {pharmacy.totalMedicinesStocked || 0} medicines listed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {/* Remove Pharmacy Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(pharmacy)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/50 hover:text-rose-200 transition-all active:scale-95 shadow-sm"
                    title="Permanently remove pharmacy from platform"
                  >
                    <FiTrash2 size={13} className="text-rose-400" />
                    <span>Remove Pharmacy</span>
                  </button>

                  {/* Verify / Review Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenVerifyModal(pharmacy)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                  >
                    <FiShield size={13} />
                    <span>Verify / Review</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center backdrop-blur-xl shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <FiShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Pharmacy Partners Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            No pharmacies matched your search or status filter criteria. Try adjusting your search query or selecting "All Statuses".
          </p>
          {(search || selectedStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedStatus('');
              }}
              className="mt-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Verification Action Modal */}
      {verifyModalOpen && selectedPharmacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FiShield size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Review Pharmacy License</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{selectedPharmacy.licenseNumber || 'License Pending'}</p>
                </div>
              </div>
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Set regulatory compliance status for <strong className="text-cyan-300 font-bold">{selectedPharmacy.name}</strong>.
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Verification Decision *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerifyStatus('VERIFIED')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                      verifyStatus === 'VERIFIED'
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 border border-emerald-400'
                        : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <FiCheck size={15} /> Approve (Verified)
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerifyStatus('REJECTED')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                      verifyStatus === 'REJECTED'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500'
                        : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <FiXCircle size={15} /> Reject License
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Compliance Remarks / Reason
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter audit notes or license validation remarks (e.g. Schedule H license verified)..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isVerifying && <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isVerifying ? 'Saving Decision...' : 'Save Decision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Remove Confirmation Modal */}
      {deleteModalOpen && pharmacyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <FiAlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Remove Pharmacy Partner</h3>
                <p className="text-xs text-rose-300/80">Irreversible administrative action</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                Are you sure you want to permanently remove <strong className="text-white font-semibold">"{pharmacyToDelete.name}"</strong>?
              </p>
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-200/90 space-y-1.5">
                <p className="font-semibold text-rose-300">Warning: The following will be purged:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200/80">
                  <li>All listed medicine inventory stock for this pharmacy</li>
                  <li>Active & completed reservations at this counter</li>
                  <li>Online customer orders linked to this pharmacy</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPharmacyToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing Pharmacy...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>Confirm Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
