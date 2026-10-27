import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  FiPlus,
  FiEdit2,
  FiEye,
  FiUser,
  FiGrid,
  FiList,
  FiToggleLeft,
  FiToggleRight,
  FiDollarSign,
  FiSliders,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import AddMedicineModal from './pharmacies/AddMedicineModal';
import EditInventoryModal from './pharmacies/EditInventoryModal';
import RemoveInventoryModal from './pharmacies/RemoveInventoryModal';
import PharmacyInventoryTab from './pharmacies/PharmacyInventoryTab';
import PharmacyReservationsTab from './pharmacies/PharmacyReservationsTab';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];

const ACTIVE_FILTERS = [
  { value: '', label: 'All Operations' },
  { value: 'ACTIVE', label: 'Active Only' },
  { value: 'INACTIVE', label: 'Inactive Only' },
];

const INITIAL_FORM = {
  name: '',
  licenseNumber: '',
  ownerId: '',
  description: '',
  addressLine: '',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500001',
  latitude: 17.3850,
  longitude: 78.4867,
  phone: '',
  email: '',
  openingTime: '08:00',
  closingTime: '22:00',
  is24Hours: false,
  active: true,
  verificationStatus: 'VERIFIED',
  logoUrl: '',
};

export default function AdminPharmacies() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Core state
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedActive, setSelectedActive] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Owner list for dropdowns
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // Add / Edit Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPharmacyId, setEditingPharmacyId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pharmacy Details / Profile Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPharmacyDetails, setSelectedPharmacyDetails] = useState(null);
  const [detailsTab, setDetailsTab] = useState('overview'); // 'overview' | 'inventory'
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Details Inventory state
  const [pharmacyInventory, setPharmacyInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');

  // Inventory sub-modals state
  const [addMedicineModalOpen, setAddMedicineModalOpen] = useState(false);
  const [addMedicinePharmacyId, setAddMedicinePharmacyId] = useState(null);

  const [editInventoryModalOpen, setEditInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);

  const [removeInventoryModalOpen, setRemoveInventoryModalOpen] = useState(false);
  const [removingInventoryItem, setRemovingInventoryItem] = useState(null);

  // Pharmacy Reservations state
  const [pharmacyReservations, setPharmacyReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  // Reassign Owner Modal state
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [pharmacyForOwner, setPharmacyForOwner] = useState(null);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pharmacyToDelete, setPharmacyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Fetch Owners for Dropdowns ---
  const fetchOwners = async () => {
    try {
      setLoadingOwners(true);
      const data = typeof adminService.getPharmacyOwners === 'function'
        ? await adminService.getPharmacyOwners()
        : [];
      setOwners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load pharmacy owners list', err);
    } finally {
      setLoadingOwners(false);
    }
  };

  // --- Fetch Pharmacies List ---
  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus) params.status = selectedStatus;
      if (selectedActive === 'ACTIVE') params.active = true;
      if (selectedActive === 'INACTIVE') params.active = false;
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
    fetchOwners();
  }, []);

  useEffect(() => {
    fetchPharmacies();
  }, [selectedStatus, selectedActive]);

  // Handle URL query trigger (e.g. ?action=new)
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreateModal();
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPharmacies();
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchPharmacies();
  };

  // Lock background body scroll when the form modal is open
  useEffect(() => {
    if (formModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [formModalOpen]);

  // --- Open Create Pharmacy Modal ---
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingPharmacyId(null);
    setFormData({ ...INITIAL_FORM });
    setFormErrors({});
    setFormModalOpen(true);
  };

  // --- Open Edit Pharmacy Modal ---
  const handleOpenEditModal = async (pharmacy) => {
    try {
      setIsEditing(true);
      setEditingPharmacyId(pharmacy.id);
      setFormErrors({});
      setFormData({
        name: pharmacy.name || '',
        licenseNumber: pharmacy.licenseNumber || '',
        ownerId: pharmacy.ownerId ? String(pharmacy.ownerId) : '',
        description: pharmacy.description || '',
        addressLine: pharmacy.addressLine || '',
        city: pharmacy.city || 'Hyderabad',
        state: pharmacy.state || 'Telangana',
        postalCode: pharmacy.postalCode || '',
        latitude: pharmacy.latitude ?? 17.3850,
        longitude: pharmacy.longitude ?? 78.4867,
        phone: pharmacy.phone || '',
        email: pharmacy.email || '',
        openingTime: pharmacy.openingTime ? pharmacy.openingTime.substring(0, 5) : '08:00',
        closingTime: pharmacy.closingTime ? pharmacy.closingTime.substring(0, 5) : '22:00',
        is24Hours: Boolean(pharmacy.is24Hours),
        active: Boolean(pharmacy.active),
        verificationStatus: pharmacy.verificationStatus || 'VERIFIED',
        logoUrl: pharmacy.logoUrl || '',
      });
      setFormModalOpen(true);
    } catch (err) {
      toast.error('Failed to prepare pharmacy edit form.');
    }
  };

  // --- Validate Pharmacy Form ---
  const validateForm = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Pharmacy name is required';
    if (!formData.licenseNumber?.trim()) errs.licenseNumber = 'License / Registration number is required';
    if (!formData.phone?.trim()) errs.phone = 'Contact phone number is required';
    if (!formData.addressLine?.trim()) errs.addressLine = 'Address line is required';
    if (!formData.city?.trim()) errs.city = 'City is required';
    if (!formData.state?.trim()) errs.state = 'State is required';
    if (formData.latitude === '' || isNaN(Number(formData.latitude))) errs.latitude = 'Valid latitude coordinate is required';
    if (formData.longitude === '' || isNaN(Number(formData.longitude))) errs.longitude = 'Valid longitude coordinate is required';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // --- Submit Create / Edit Pharmacy ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        openingTime: formData.openingTime ? `${formData.openingTime}:00` : '08:00:00',
        closingTime: formData.closingTime ? `${formData.closingTime}:00` : '22:00:00',
      };
      if (formData.ownerId) {
        payload.ownerId = Number(formData.ownerId);
      } else {
        delete payload.ownerId;
      }

      if (isEditing && editingPharmacyId) {
        const updated = await adminService.updatePharmacy(editingPharmacyId, payload);
        toast.success(`Pharmacy '${updated.name}' details updated successfully.`);
        setPharmacies((prev) => prev.map((p) => (p.id === editingPharmacyId ? updated : p)));
      } else {
        const created = await adminService.createPharmacy(payload);
        toast.success(`Pharmacy '${created.name}' registered successfully!`);
        setPharmacies((prev) => [created, ...prev]);
      }

      setFormModalOpen(false);
      // Clean query params if action=new was in URL
      if (searchParams.get('action')) {
        searchParams.delete('action');
        setSearchParams(searchParams);
      }
    } catch (err) {
      console.error('Error saving pharmacy', err);
      const msg = err.response?.data?.message || 'Failed to save pharmacy. Please check entered details.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Toggle Active Status ---
  const handleToggleActive = async (pharmacy) => {
    const nextStatus = !pharmacy.active;
    try {
      const updated = await adminService.togglePharmacyActive(pharmacy.id, nextStatus);
      setPharmacies((prev) => prev.map((p) => (p.id === pharmacy.id ? { ...p, active: nextStatus } : p)));
      if (selectedPharmacyDetails?.id === pharmacy.id) {
        setSelectedPharmacyDetails((prev) => ({ ...prev, active: nextStatus }));
      }
      toast.success(
        nextStatus
          ? `'${pharmacy.name}' activated and accepting reservations.`
          : `'${pharmacy.name}' deactivated. Users cannot make new holds.`
      );
    } catch (err) {
      console.error('Failed to toggle pharmacy active status', err);
      toast.error(err.response?.data?.message || 'Failed to change active status.');
    }
  };

  // --- Live Open/Closed Operating Status Helper ---
  const getOperatingStatus = (pharmacy) => {
    if (pharmacy.is24Hours) {
      return { isOpen: true, label: 'Open 24/7', badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    }
    if (!pharmacy.openingTime || !pharmacy.closingTime) {
      return { isOpen: true, label: 'Standard Hours', badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-700' };
    }
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = pharmacy.openingTime.split(':').map(Number);
      const [closeH, closeM] = pharmacy.closingTime.split(':').map(Number);
      const openMinutes = openH * 60 + (openM || 0);
      const closeMinutes = closeH * 60 + (closeM || 0);

      const isOpen =
        openMinutes <= closeMinutes
          ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
          : currentMinutes >= openMinutes || currentMinutes <= closeMinutes;

      if (isOpen) {
        return {
          isOpen: true,
          label: `Open Now (${pharmacy.openingTime.substring(0, 5)} - ${pharmacy.closingTime.substring(0, 5)})`,
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      } else {
        return {
          isOpen: false,
          label: `Closed (Opens ${pharmacy.openingTime.substring(0, 5)})`,
          badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
        };
      }
    } catch (e) {
      return { isOpen: true, label: 'Open', badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-700' };
    }
  };

  // --- Open Details Modal ---
  const handleOpenDetails = async (pharmacy, initialTab = 'overview') => {
    try {
      setLoadingDetails(true);
      setDetailsTab(initialTab);
      setDetailsModalOpen(true);
      const details = await adminService.getPharmacyDetails(pharmacy.id);
      setSelectedPharmacyDetails(details);
      // Fetch both inventory and reservations
      fetchPharmacyInventory(pharmacy.id);
      fetchPharmacyReservations(pharmacy.id);
    } catch (err) {
      console.error('Failed to load pharmacy details', err);
      toast.error('Could not load complete pharmacy details.');
      setSelectedPharmacyDetails(pharmacy);
    } finally {
      setLoadingDetails(false);
    }
  };

  // --- Fetch Pharmacy Inventory for Details Tab ---
  const fetchPharmacyInventory = async (pharmacyId, searchKeyword = '') => {
    try {
      setLoadingInventory(true);
      const params = {};
      if (searchKeyword.trim()) params.search = searchKeyword.trim();
      const items = await adminService.getPharmacyInventory(pharmacyId, params);
      setPharmacyInventory(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load pharmacy inventory', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // --- Fetch Pharmacy Reservations for Details Tab ---
  const fetchPharmacyReservations = async (pharmacyId) => {
    try {
      setLoadingReservations(true);
      const items = await adminService.getPharmacyReservations(pharmacyId);
      setPharmacyReservations(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load pharmacy reservations', err);
    } finally {
      setLoadingReservations(false);
    }
  };

  // --- Inventory Management Action Handlers ---
  const handleOpenAddMedicineModal = (pharmacyId = null) => {
    setAddMedicinePharmacyId(pharmacyId || selectedPharmacyDetails?.id || null);
    setAddMedicineModalOpen(true);
  };

  const handleOpenEditInventoryModal = (item) => {
    setEditingInventoryItem(item);
    setEditInventoryModalOpen(true);
  };

  const handleOpenRemoveInventoryModal = (item) => {
    setRemovingInventoryItem(item);
    setRemoveInventoryModalOpen(true);
  };

  const handleQuickStockAdjust = async (item, newQuantity) => {
    if (!selectedPharmacyDetails) return;
    try {
      const updated = await adminService.updatePharmacyStockQuantity(
        selectedPharmacyDetails.id,
        item.id,
        newQuantity
      );
      setPharmacyInventory((prev) =>
        prev.map((i) => (i.id === item.id ? updated : i))
      );
      toast.success(`Updated stock for '${item.medicineName}' to ${newQuantity} units.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock quantity.');
    }
  };

  const handleInventoryAdded = (newItem, pharmacyId) => {
    if (selectedPharmacyDetails?.id === pharmacyId) {
      setPharmacyInventory((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
      setSelectedPharmacyDetails((prev) => ({
        ...prev,
        totalMedicinesStocked: (prev.totalMedicinesStocked || 0) + 1,
      }));
    }
    setPharmacies((prev) =>
      prev.map((p) =>
        p.id === pharmacyId
          ? { ...p, totalMedicinesStocked: (p.totalMedicinesStocked || 0) + 1 }
          : p
      )
    );
  };

  const handleInventoryUpdated = (updatedItem) => {
    setPharmacyInventory((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    );
  };

  const handleInventoryRemoved = (removedItemId) => {
    setPharmacyInventory((prev) => prev.filter((i) => i.id !== removedItemId));
    if (selectedPharmacyDetails) {
      setSelectedPharmacyDetails((prev) => ({
        ...prev,
        totalMedicinesStocked: Math.max(0, (prev.totalMedicinesStocked || 1) - 1),
      }));
      setPharmacies((prev) =>
        prev.map((p) =>
          p.id === selectedPharmacyDetails.id
            ? { ...p, totalMedicinesStocked: Math.max(0, (p.totalMedicinesStocked || 1) - 1) }
            : p
        )
      );
    }
  };

  // --- Open Reassign Owner Modal ---
  const handleOpenReassignModal = (pharmacy) => {
    setPharmacyForOwner(pharmacy);
    setNewOwnerId(pharmacy.ownerId ? String(pharmacy.ownerId) : '');
    setOwnerModalOpen(true);
  };

  // --- Submit Owner Reassignment ---
  const handleConfirmReassign = async (e) => {
    e.preventDefault();
    if (!pharmacyForOwner || !newOwnerId || isReassigning) return;

    try {
      setIsReassigning(true);
      const updated = await adminService.assignPharmacyOwner(pharmacyForOwner.id, Number(newOwnerId));
      setPharmacies((prev) => prev.map((p) => (p.id === pharmacyForOwner.id ? updated : p)));
      if (selectedPharmacyDetails?.id === pharmacyForOwner.id) {
        setSelectedPharmacyDetails((prev) => ({
          ...prev,
          ownerId: updated.ownerId,
          ownerName: updated.ownerName,
          ownerEmail: updated.ownerEmail,
          ownerPhone: updated.ownerPhone,
        }));
      }
      toast.success(`Owner for '${pharmacyForOwner.name}' reassigned to ${updated.ownerName || updated.ownerEmail}.`);
      setOwnerModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign pharmacy owner.');
    } finally {
      setIsReassigning(false);
    }
  };

  // --- Verification Modal Handlers ---
  const handleOpenVerifyModal = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setVerifyStatus(pharmacy.verificationStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED');
    setRemarks('');
    setVerifyModalOpen(true);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPharmacy || isVerifying) return;

    try {
      setIsVerifying(true);
      const updated = await adminService.verifyPharmacy(selectedPharmacy.id, {
        status: verifyStatus,
        remarks: remarks.trim() || undefined,
      });

      setPharmacies((prev) => prev.map((p) => (p.id === selectedPharmacy.id ? updated : p)));
      if (selectedPharmacyDetails?.id === selectedPharmacy.id) {
        setSelectedPharmacyDetails((prev) => ({ ...prev, verificationStatus: verifyStatus }));
      }
      toast.success(`Pharmacy '${selectedPharmacy.name}' verification status updated to ${verifyStatus}.`);
      setVerifyModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verification status.');
    } finally {
      setIsVerifying(false);
    }
  };

  // --- Delete Modal Handlers ---
  const handleOpenDeleteModal = (pharmacy) => {
    setPharmacyToDelete(pharmacy);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pharmacyToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await adminService.deletePharmacy(pharmacyToDelete.id);
      setPharmacies((prev) => prev.filter((p) => p.id !== pharmacyToDelete.id));
      if (detailsModalOpen && selectedPharmacyDetails?.id === pharmacyToDelete.id) {
        setDetailsModalOpen(false);
      }
      toast.success(`Pharmacy '${pharmacyToDelete.name}' and all associated records have been removed.`);
      setDeleteModalOpen(false);
      setPharmacyToDelete(null);
    } catch (err) {
      console.error('Failed to remove pharmacy', err);
      toast.error(err.response?.data?.message || 'Failed to remove pharmacy partner.');
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

  // Calculations for telemetry bar
  const activeCount = pharmacies.filter((p) => p.active).length;
  const inactiveCount = pharmacies.filter((p) => !p.active).length;
  const pendingCount = pharmacies.filter((p) => p.verificationStatus === 'PENDING').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-white pb-16">
      {/* Header Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-3 shadow-lg shadow-cyan-900/30">
              <FiShoppingBag size={14} /> Comprehensive Pharmacy Administration
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Pharmacy Partners
            </h1>
            <p className="mt-1 text-sm text-primary-100/80 max-w-2xl">
              Register new pharmacy partners, assign store owners, review drug licenses, inspect live medicine stock, and manage operational status across the MediFindAI network.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchPharmacies}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 hover:border-cyan-400/40 disabled:opacity-50 transition-all shadow-md"
              title="Refresh pharmacy network data"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => handleOpenAddMedicineModal()}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-950/60 px-4 py-3 text-xs font-bold text-cyan-300 backdrop-blur-md hover:bg-cyan-900/60 hover:text-white transition-all shadow-md shadow-cyan-950/40"
              title="Stock medicine in any registered pharmacy"
            >
              <FiPackage size={15} />
              <span>+ Stock Medicine</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="btn-primary py-3 px-5 text-xs font-bold shadow-lg shadow-cyan-500/25 inline-flex items-center gap-2"
            >
              <FiPlus size={16} />
              <span>Add New Pharmacy</span>
            </button>
          </div>
        </div>

        {/* Live Counters Pill Bar */}
        <div className="mt-7 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Partners:</span>
            <strong className="text-white font-bold text-sm">{pharmacies.length}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Active:</span>
            <strong className="text-emerald-300 font-bold text-sm">{activeCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="text-slate-400">Inactive:</span>
            <strong className="text-rose-300 font-bold text-sm">{inactiveCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-400">Pending Review:</span>
            <strong className="text-amber-300 font-bold text-sm">{pendingCount}</strong>
          </div>
        </div>
      </section>

      {/* Filters, Search Toolbar & View Toggles */}
      <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-3xl backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={17} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by pharmacy name, city, owner, license #..."
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

          {/* View Mode Toggle Button */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-2xl self-end lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Cards Grid View"
            >
              <FiGrid size={15} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Data Table View"
            >
              <FiList size={15} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Verification Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Verification:</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value || 'ALL_STATUS'}
                onClick={() => setSelectedStatus(f.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                  selectedStatus === f.value
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/40'
                    : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Active / Inactive Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Operations:</span>
            {ACTIVE_FILTERS.map((f) => (
              <button
                key={f.value || 'ALL_ACTIVE'}
                onClick={() => setSelectedActive(f.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                  selectedActive === f.value
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 border border-emerald-400/40'
                    : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area: Loading / Grid / Table / Empty */}
      {loading ? (
        <div className="py-24 text-center">
          <FiRefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-slate-300 text-sm font-medium">Loading pharmacy partner network...</p>
        </div>
      ) : pharmacies.length > 0 ? (
        viewMode === 'grid' ? (
          /* ================= Cards Grid View ================= */
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
                        {pharmacy.is24Hours ? (
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 text-[10px] font-semibold border border-teal-500/30">
                            24/7 Active
                          </span>
                        ) : (
                          (() => {
                            const op = getOperatingStatus(pharmacy);
                            return (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${op.badgeClass}`}>
                                {op.label}
                              </span>
                            );
                          })()
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            pharmacy.active
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {pharmacy.active ? 'Operational' : 'Deactivated'}
                        </span>
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
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <FiUser size={13} className="text-cyan-400" />
                        <span>Owner: <strong className="text-slate-200 font-semibold">{pharmacy.ownerName || 'Unassigned'}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenReassignModal(pharmacy)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                      >
                        Reassign
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Stock Info & Action Buttons */}
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

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                    {/* Manage Store Inventory Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(pharmacy, 'inventory')}
                      className="px-3 py-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                      title="Manage Store Inventory & Stock"
                    >
                      <FiPackage size={14} />
                      <span>Manage Stock</span>
                    </button>

                    {/* Quick Add Medicine to this store */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddMedicineModal(pharmacy.id)}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-all shadow-sm"
                      title="Add Medicine to this Pharmacy"
                      aria-label="Add Medicine to this Pharmacy"
                    >
                      <FiPlus size={15} />
                    </button>

                    {/* View Reservations for this store */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(pharmacy, 'reservations')}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-300 transition-all shadow-sm"
                      title="View Pharmacy Reservations"
                      aria-label="View Pharmacy Reservations"
                    >
                      <FiClock size={15} />
                    </button>

                    {/* View Details Profile */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(pharmacy, 'overview')}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-sm"
                      title="View Pharmacy Profile"
                      aria-label="View Pharmacy Profile"
                    >
                      <FiEye size={15} />
                    </button>

                    {/* Edit Pharmacy */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(pharmacy)}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-all shadow-sm"
                      title="Edit Pharmacy Details"
                      aria-label="Edit Pharmacy Details"
                    >
                      <FiEdit2 size={15} />
                    </button>

                    {/* Quick Active Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(pharmacy)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all inline-flex items-center gap-1.5 ${
                        pharmacy.active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                      title={pharmacy.active ? 'Click to deactivate' : 'Click to activate'}
                      aria-label={pharmacy.active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {pharmacy.active ? <FiToggleRight size={16} className="text-emerald-400" /> : <FiToggleLeft size={16} />}
                      <span>{pharmacy.active ? 'Active' : 'Inactive'}</span>
                    </button>

                    {/* Verify / Review Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenVerifyModal(pharmacy)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                    >
                      <FiShield size={13} />
                      <span>Verify / Review</span>
                    </button>

                    {/* Remove Pharmacy Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(pharmacy)}
                      className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-all"
                      title="Remove Pharmacy"
                      aria-label="Remove Pharmacy"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ================= Data Table View ================= */
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4">Pharmacy & License</th>
                    <th className="px-4 py-4">Owner</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Hours</th>
                    <th className="px-3 py-4 text-center">Catalog</th>
                    <th className="px-3 py-4 text-center">Active</th>
                    <th className="px-4 py-4 text-center">Compliance</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {pharmacies.map((pharmacy) => (
                    <tr key={pharmacy.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{pharmacy.name}</div>
                        <div className="text-[11px] font-mono text-cyan-400 mt-0.5">{pharmacy.licenseNumber}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-200">{pharmacy.ownerName || 'Unassigned'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{pharmacy.ownerEmail}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-300">{pharmacy.city}, {pharmacy.state}</div>
                        <div className="text-[11px] text-slate-500">{pharmacy.addressLine}</div>
                      </td>
                      <td className="px-4 py-4">
                        {pharmacy.is24Hours ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            24/7 Active
                          </span>
                        ) : (
                          (() => {
                            const op = getOperatingStatus(pharmacy);
                            return (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${op.badgeClass}`}>
                                {op.label}
                              </span>
                            );
                          })()
                        )}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(pharmacy, 'inventory')}
                          className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 font-bold text-xs inline-flex items-center gap-1 transition-all"
                          title="Manage Inventory"
                        >
                          <FiPackage size={12} />
                          <span>{pharmacy.totalMedicinesStocked || 0}</span>
                        </button>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(pharmacy)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            pharmacy.active
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-700 bg-slate-800 text-slate-500'
                          }`}
                          title={pharmacy.active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {pharmacy.active ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(pharmacy.verificationStatus)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(pharmacy, 'inventory')}
                            className="p-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30"
                            title="Manage Store Stock"
                          >
                            <FiPackage size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAddMedicineModal(pharmacy.id)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="Add Medicine to Store"
                          >
                            <FiPlus size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(pharmacy, 'reservations')}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300"
                            title="View Reservations"
                          >
                            <FiClock size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(pharmacy, 'overview')}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                            title="View Pharmacy Profile"
                          >
                            <FiEye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(pharmacy)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="Edit Pharmacy"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(pharmacy)}
                            className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
                            title="Verify / Review"
                          >
                            <FiShield size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(pharmacy)}
                            className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20"
                            title="Remove Pharmacy"
                            aria-label="Remove Pharmacy"
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
        )
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center backdrop-blur-xl shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <FiShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Pharmacy Partners Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            No pharmacies matched your search or status filter criteria. Try adjusting your search query, active status, or registering a new pharmacy.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(search || selectedStatus || selectedActive) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedStatus('');
                  setSelectedActive('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-colors"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={handleOpenCreateModal}
              className="btn-primary py-2 px-5 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <FiPlus size={14} />
              <span>Register New Pharmacy</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: Add / Edit Pharmacy Form ================= */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
            {/* Modal Header */}
            <div className="flex-shrink-0 px-6 sm:px-8 py-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FiShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {isEditing ? 'Edit Pharmacy Details' : 'Register New Pharmacy'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isEditing
                      ? 'Modify partner license, location coordinates, and operational hours.'
                      : 'Onboard a licensed pharmacy partner into the MediFindAI network.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFormModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 text-xs sm:text-sm">
              {/* Section 1: Core Pharmacy Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">1. Basic Information</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Pharmacy Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Apollo Care Pharmacy"
                      className={`w-full rounded-xl border bg-slate-950/80 px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none ${
                        formErrors.name ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-cyan-400'
                      }`}
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Registration / License Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="e.g. LIC-TS-10023"
                      className={`w-full rounded-xl border bg-slate-950/80 px-4 py-2.5 text-white font-mono placeholder:text-slate-600 focus:outline-none ${
                        formErrors.licenseNumber ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-cyan-400'
                      }`}
                    />
                    {formErrors.licenseNumber && <p className="text-[11px] text-rose-400 mt-1">{formErrors.licenseNumber}</p>}
                  </div>


                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-300 mb-1.5">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of specialties, neighbourhood presence, delivery radius..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Location */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">2. Contact & Location</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        city: 'Hyderabad',
                        state: 'Telangana',
                        postalCode: '500034',
                        latitude: 17.4126,
                        longitude: 78.4483,
                      }));
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                  >
                    Auto-Fill Hyderabad Coordinates
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9100000001"
                      className={`w-full rounded-xl border bg-slate-950/80 px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none ${
                        formErrors.phone ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-cyan-400'
                      }`}
                    />
                    {formErrors.phone && <p className="text-[11px] text-rose-400 mt-1">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. contact@pharmacy.example.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Address Line <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine}
                      onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                      placeholder="e.g. Road No. 12, Banjara Hills"
                      className={`w-full rounded-xl border bg-slate-950/80 px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none ${
                        formErrors.addressLine ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-cyan-400'
                      }`}
                    />
                    {formErrors.addressLine && <p className="text-[11px] text-rose-400 mt-1">{formErrors.addressLine}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      City <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      State <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="e.g. 500034"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Operating Timings & Status */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">3. Operations & Status</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Opening Time</label>
                    <input
                      type="time"
                      value={formData.openingTime}
                      disabled={formData.is24Hours}
                      onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-white focus:border-cyan-400 focus:outline-none disabled:opacity-40"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Closing Time</label>
                    <input
                      type="time"
                      value={formData.closingTime}
                      disabled={formData.is24Hours}
                      onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-white focus:border-cyan-400 focus:outline-none disabled:opacity-40"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:col-span-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is24Hours}
                        onChange={(e) => setFormData({ ...formData, is24Hours: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                      />
                      <span className="font-semibold text-slate-300 text-xs sm:text-sm">
                        24-Hour Pharmacy (Always Open)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                      />
                      <span className="font-semibold text-slate-300 text-xs sm:text-sm">
                        Active for User Reservations
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Verification Status</label>
                    <select
                      value={formData.verificationStatus}
                      onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="VERIFIED">Verified (Approved Partner)</option>
                      <option value="PENDING">Pending Review</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Pharmacy Logo URL</label>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://.../logo.png"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              </div>

              {/* Modal Footer / Action Buttons */}
              <div className="flex-shrink-0 px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2.5 px-6 font-bold shadow-lg shadow-cyan-500/25 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSubmitting && <FiRefreshCw className="animate-spin" size={14} />}
                  <span>{isEditing ? 'Save Pharmacy Changes' : 'Register Pharmacy'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Pharmacy Profile & Inventory Details ================= */}
      {detailsModalOpen && selectedPharmacyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl my-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30">
                  <FiShoppingBag size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-2xl font-black text-white">{selectedPharmacyDetails.name}</h3>
                    {getStatusBadge(selectedPharmacyDetails.verificationStatus)}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        selectedPharmacyDetails.active
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {selectedPharmacyDetails.active ? 'Operational' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-cyan-300 mt-1">
                    License: {selectedPharmacyDetails.licenseNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditModal(selectedPharmacyDetails);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 inline-flex items-center gap-1.5"
                >
                  <FiEdit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 text-xs font-bold">
              <button
                onClick={() => setDetailsTab('overview')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  detailsTab === 'overview'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Store Profile & Owner
              </button>
              <button
                onClick={() => setDetailsTab('inventory')}
                className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 ${
                  detailsTab === 'inventory'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FiPackage size={14} />
                <span>Stock Catalog ({selectedPharmacyDetails.totalMedicinesStocked || pharmacyInventory.length || 0})</span>
              </button>
              <button
                onClick={() => setDetailsTab('reservations')}
                className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 ${
                  detailsTab === 'reservations'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FiClock size={14} />
                <span>Reservations ({pharmacyReservations.length || selectedPharmacyDetails.totalReservations || 0})</span>
              </button>
            </div>

            {/* Tab 1: Overview */}
            {detailsTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Medicines Stocked</span>
                    <strong className="text-lg font-black text-white">{selectedPharmacyDetails.totalMedicinesStocked || 0}</strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Low Stock Items</span>
                    <strong className="text-lg font-black text-amber-300">{selectedPharmacyDetails.lowStockItemsCount || 0}</strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Total Reservations</span>
                    <strong className="text-lg font-black text-cyan-300">{selectedPharmacyDetails.totalReservations || 0}</strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Completed Holds</span>
                    <strong className="text-lg font-black text-emerald-300">{selectedPharmacyDetails.completedReservations || 0}</strong>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 text-xs sm:text-sm">
                  {/* Location & Contact Info Card */}
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Location & Contact</h4>
                    <p className="flex items-start gap-2.5 text-slate-300">
                      <FiMapPin size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        {selectedPharmacyDetails.addressLine}, {selectedPharmacyDetails.city}, {selectedPharmacyDetails.state} {selectedPharmacyDetails.postalCode}
                      </span>
                    </p>
                    <p className="flex items-center gap-2.5 text-slate-300">
                      <FiPhone size={16} className="text-cyan-400 shrink-0" />
                      <span>{selectedPharmacyDetails.phone}</span>
                    </p>
                    <p className="flex items-center gap-2.5 text-slate-300">
                      <FiMail size={16} className="text-cyan-400 shrink-0" />
                      <span>{selectedPharmacyDetails.email || 'No store email specified'}</span>
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                      GPS: {selectedPharmacyDetails.latitude}, {selectedPharmacyDetails.longitude}
                    </p>
                  </div>

                  {/* Owner & Operating Hours Card */}
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Assigned Store Owner</h4>
                        <button
                          type="button"
                          onClick={() => handleOpenReassignModal(selectedPharmacyDetails)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline"
                        >
                          Change Owner
                        </button>
                      </div>
                      <div className="pt-2 space-y-1">
                        <p className="font-bold text-white text-sm">{selectedPharmacyDetails.ownerName || 'Unassigned'}</p>
                        <p className="text-xs text-slate-300">{selectedPharmacyDetails.ownerEmail}</p>
                        {selectedPharmacyDetails.ownerPhone && (
                          <p className="text-xs text-slate-400">{selectedPharmacyDetails.ownerPhone}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">Operational Hours</h4>
                      <p className="text-slate-300 text-xs">
                        {selectedPharmacyDetails.is24Hours ? (
                          <span className="text-teal-300 font-bold">Open 24 Hours / 7 Days a Week</span>
                        ) : (
                          `${selectedPharmacyDetails.openingTime?.substring(0, 5) || '08:00'} to ${selectedPharmacyDetails.closingTime?.substring(0, 5) || '22:00'}`
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedPharmacyDetails.description && (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 text-xs sm:text-sm text-slate-300">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">Description</h4>
                    <p className="leading-relaxed">{selectedPharmacyDetails.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Medicine Inventory Catalog */}
            {detailsTab === 'inventory' && (
              <PharmacyInventoryTab
                pharmacy={selectedPharmacyDetails}
                inventory={pharmacyInventory}
                loading={loadingInventory}
                onRefresh={() => fetchPharmacyInventory(selectedPharmacyDetails.id)}
                onOpenAddModal={() => handleOpenAddMedicineModal(selectedPharmacyDetails.id)}
                onOpenEditModal={handleOpenEditInventoryModal}
                onOpenRemoveModal={handleOpenRemoveInventoryModal}
                onQuickStockAdjust={handleQuickStockAdjust}
              />
            )}

            {/* Tab 3: Pharmacy Reservations */}
            {detailsTab === 'reservations' && (
              <PharmacyReservationsTab
                pharmacy={selectedPharmacyDetails}
                reservations={pharmacyReservations}
                loading={loadingReservations}
                onRefresh={() => fetchPharmacyReservations(selectedPharmacyDetails.id)}
              />
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: Reassign Owner ================= */}
      {ownerModalOpen && pharmacyForOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FiUser size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Assign Pharmacy Owner</h3>
                  <p className="text-xs text-slate-400">{pharmacyForOwner.name}</p>
                </div>
              </div>
              <button
                onClick={() => setOwnerModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Registered Owner
                </label>
                <select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  required
                >
                  <option value="">Select owner...</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.fullName} ({o.email}) {o.phone ? `- ${o.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Assigning ownership grants this user access to manage store inventory, fulfill patient medicine holds, and receive order notifications for this pharmacy.
              </p>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOwnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning || !newOwnerId}
                  className="btn-primary py-2 px-5 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isReassigning && <FiRefreshCw className="animate-spin" size={12} />}
                  <span>Save Owner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Verification Review ================= */}
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
                  <p className="text-xs text-slate-400">{selectedPharmacy.name}</p>
                </div>
              </div>
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Verification Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerifyStatus('VERIFIED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      verifyStatus === 'VERIFIED'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/20'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <FiCheckCircle size={15} /> Approve (Verified)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyStatus('REJECTED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      verifyStatus === 'REJECTED'
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-md shadow-rose-500/20'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <FiXCircle size={15} /> Reject License
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Auditor Remarks (Optional)</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record regulatory license verification notes or rejection reasons..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="btn-primary py-2 px-5 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isVerifying && <FiRefreshCw className="animate-spin" size={13} />}
                  <span>Save Audit Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Remove Confirmation ================= */}
      {deleteModalOpen && pharmacyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <FiAlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Remove Pharmacy Partner</h3>
                <p className="text-xs text-rose-300/80">Permanent removal confirmation</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-white font-semibold">'{pharmacyToDelete.name}'</strong>?
              This will remove all associated medicine inventory listings and reservations.
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting && <FiRefreshCw className="animate-spin" size={13} />}
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Add Medicine to Pharmacy ================= */}
      <AddMedicineModal
        isOpen={addMedicineModalOpen}
        onClose={() => setAddMedicineModalOpen(false)}
        pharmacies={pharmacies}
        defaultPharmacyId={addMedicinePharmacyId}
        onSuccess={handleInventoryAdded}
      />

      {/* ================= MODAL: Edit Pharmacy Inventory ================= */}
      <EditInventoryModal
        isOpen={editInventoryModalOpen}
        onClose={() => setEditInventoryModalOpen(false)}
        pharmacy={selectedPharmacyDetails}
        item={editingInventoryItem}
        onSuccess={handleInventoryUpdated}
      />

      {/* ================= MODAL: Remove Pharmacy Inventory Confirmation ================= */}
      <RemoveInventoryModal
        isOpen={removeInventoryModalOpen}
        onClose={() => setRemoveInventoryModalOpen(false)}
        pharmacy={selectedPharmacyDetails}
        item={removingInventoryItem}
        onSuccess={handleInventoryRemoved}
        onMarkOutOfStock={handleInventoryUpdated}
      />
    </div>
  );
}
