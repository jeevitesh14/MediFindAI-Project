import { useState, useEffect } from 'react';
import {
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiShield,
  FiSave,
  FiNavigation,
  FiCheckCircle,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import pharmacyOwnerService from '../../services/pharmacyOwnerService';

export default function PharmacyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    openingTime: '08:00',
    closingTime: '22:00',
    is24Hours: false,
    logoUrl: '',
  });

  const [fetchError, setFetchError] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await pharmacyOwnerService.getProfile();
      setProfile(data);
      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          addressLine: data.addressLine || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          phone: data.phone || '',
          email: data.email || '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? '',
          openingTime: data.openingTime || '08:00',
          closingTime: data.closingTime || '22:00',
          is24Hours: Boolean(data.is24Hours),
          logoUrl: data.logoUrl || '',
        });
      }
    } catch (err) {
      console.error('Failed to load pharmacy profile', err);
      const message =
        err.response?.data?.message ||
        'Failed to load pharmacy profile details. Please try again.';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setLocating(false);
        toast.success('Updated coordinates from current GPS position.');
      },
      (err) => {
        setLocating(false);
        toast.error('Could not retrieve GPS location: ' + err.message);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.addressLine.trim() || !formData.city.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      toast.error('Longitude must be a valid number between -180 and 180.');
      return;
    }

    try {
      setSaving(true);
      const updated = await pharmacyOwnerService.updateProfile({
        ...formData,
        latitude: lat,
        longitude: lon,
      });
      setProfile(updated);
      toast.success('Pharmacy profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update pharmacy profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center space-y-4 text-white">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent shadow-lg shadow-cyan-500/20" />
        <p className="text-xs font-medium text-cyan-200 animate-pulse">Loading pharmacy profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-white pb-12">
      {/* Error & Retry Banner (if any) */}
      {fetchError && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
              <FiAlertCircle size={22} />
            </div>
            <div>
              <p className="font-bold text-rose-200">Unable to Load Pharmacy Profile</p>
              <p className="text-xs text-rose-200/80">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadProfile}
            className="btn-secondary py-2 px-4 text-xs font-bold shrink-0 border-rose-400/30 text-rose-200 hover:bg-rose-500/20 flex items-center gap-1.5"
          >
            <FiRefreshCw size={13} /> Retry Loading
          </button>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl overflow-hidden">

        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-2 shadow-sm">
              <FiUser size={13} /> Pharmacy Partner Profile
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Manage Pharmacy Information
            </h1>
            <p className="text-xs sm:text-sm text-primary-200/80 mt-1">
              Keep your contact information, location coordinates, and operating hours accurate for customer discovery.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {profile?.verificationStatus === 'VERIFIED' ? (
              <span className="badge-available flex items-center gap-1.5 text-xs py-1.5 px-3">
                <FiCheckCircle size={14} /> License Verified
              </span>
            ) : (
              <span className="badge-low-stock flex items-center gap-1.5 text-xs py-1.5 px-3">
                <FiAlertCircle size={14} /> {profile?.verificationStatus || 'Pending Verification'}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* License Banner */}
      <div className="rounded-3xl border border-cyan-500/30 bg-cyan-950/40 p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
            <FiShield size={20} />
          </div>
          <div>
            <p className="font-bold text-white text-sm">
              Registered Drug License: <span className="font-mono text-cyan-300">{profile?.licenseNumber}</span>
            </p>
            <p className="text-primary-200/80 mt-0.5">
              Verified by MediFindAI Compliance. License and ownership changes require administrator approval.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details Card */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <FiUser className="text-cyan-400" /> Basic Store Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Pharmacy Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Description / Highlights
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="E.g. Certified 24/7 retail chemist stocking all major branded and generic pharmaceuticals..."
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Contact Phone Number <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-300/60" size={15} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 9876543210"
                  className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Contact Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-300/60" size={15} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="pharmacy@example.com"
                  className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location & GPS Coordinates Card */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FiMapPin className="text-cyan-400" /> Physical Location & Coordinates
            </h2>
            <button
              type="button"
              disabled={locating}
              onClick={handleUseCurrentLocation}
              className="btn-secondary py-2 px-3.5 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
            >
              <FiNavigation size={13} className={locating ? 'animate-spin' : ''} />
              {locating ? 'Detecting GPS...' : 'Use My Current Location'}
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Street Address / Building <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="addressLine"
                value={formData.addressLine}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                City <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                State <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Postal PIN Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="500081"
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Latitude <span className="text-cyan-400">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                placeholder="17.4485"
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-100 mb-1.5">
                Longitude <span className="text-cyan-400">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                placeholder="78.3752"
                className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours Card */}
        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <FiClock className="text-cyan-400" /> Operating Hours & Schedule
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="is24Hours"
                checked={formData.is24Hours}
                onChange={handleChange}
                className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
              />
              <span className="text-xs sm:text-sm font-bold text-white">
                Operates 24 Hours / 7 Days a week (Overnight Open)
              </span>
            </label>

            {!formData.is24Hours && (
              <div className="grid gap-5 sm:grid-cols-2 pt-2">
                <div>
                  <label className="block text-xs font-bold text-primary-100 mb-1.5">
                    Daily Opening Time
                  </label>
                  <input
                    type="time"
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary-100 mb-1.5">
                    Daily Closing Time
                  </label>
                  <input
                    type="time"
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/15 bg-slate-900/80 py-2.5 px-4 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary py-3.5 px-8 text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
          >
            <FiSave size={16} />
            {saving ? 'Saving Profile...' : 'Save Pharmacy Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
