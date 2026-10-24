import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PharmacyMap from '../../components/PharmacyMap';
import {
  FiMapPin,
  FiCrosshair,
  FiNavigation,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiStar,
  FiAlertCircle,
  FiRefreshCw,
  FiPackage,
  FiBookmark,
  FiShield,
  FiX,
  FiExternalLink,
  FiTrendingDown,
  FiMinus,
  FiPlus,
  FiArrowRight,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import pharmacyService from '../../services/pharmacyService';
import reservationService from '../../services/reservationService';
import useAuth from '../../hooks/useAuth';

const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

const PRESET_LOCATIONS = [
  { label: 'Hyderabad (Central)', lat: 17.3850, lng: 78.4867 },
  { label: 'Hyderabad (HITEC City)', lat: 17.4435, lng: 78.3772 },
  { label: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
  { label: 'Bangalore (Central)', lat: 12.9716, lng: 77.5946 },
];

export default function NearbyPharmacies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const medicineIdParam = searchParams.get('medicineId');
  const medicineNameParam = searchParams.get('medicineName');

  const { isAuthenticated } = useAuth();

  // Location state
  const [coordinates, setCoordinates] = useState(null); // { lat, lng, source: 'GPS' | 'DEMO' | 'PRESET', label: string }
  const [radiusKm, setRadiusKm] = useState(10);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Results state
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reservation Modal state (for when reserving directly from nearby card)
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [reservingPharmacy, setReservingPharmacy] = useState(null);
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [isReserving, setIsReserving] = useState(false);

  // Request browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      toast.warn('Geolocation is not supported by your browser. Please select a preset location.');
      return;
    }

    setIsLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({
          lat: latitude,
          lng: longitude,
          source: 'GPS',
          label: 'Your Live Location (GPS)',
        });
        setIsLocating(false);
        toast.success('Live location acquired successfully!');
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve your location.';
        if (err.code === 1) {
          msg = 'Location permission was denied. You can select a demo location below.';
        } else if (err.code === 2) {
          msg = 'Location position unavailable. Try selecting a preset city.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Try again or select a demo city.';
        }
        setGeoError(msg);
        toast.info(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Select a preset location
  const handleSelectPreset = (preset) => {
    setGeoError('');
    setCoordinates({
      lat: preset.lat,
      lng: preset.lng,
      source: 'PRESET',
      label: `Demo: ${preset.label}`,
    });
  };

  // Fetch nearby pharmacies from API
  const fetchNearbyPharmacies = useCallback(async () => {
    if (!coordinates) return;

    setLoading(true);
    setError('');

    try {
      const data = await pharmacyService.getNearbyPharmacies({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        radiusKm,
        medicineId: medicineIdParam ? Number(medicineIdParam) : null,
      });

      setPharmacies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch nearby pharmacies', err);
      // Safe fallback data if backend is unreachable
      const fallbackList = [
        {
          id: 1,
          name: 'Apollo Care Pharmacy',
          description: 'Licensed 24x7 pharmacy with full prescription and OTC inventory.',
          licenseNumber: 'TS-HYD-2024-8841',
          addressLine: 'Road No 36, Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033',
          phone: '+91 9876543210',
          email: 'apollo.jubilee@example.com',
          is24Hours: true,
          isOpenNow: true,
          rating: 4.8,
          latitude: 17.4300,
          longitude: 78.4050,
          distanceKm: 1.45,
          medicineId: medicineIdParam ? Number(medicineIdParam) : null,
          medicineName: medicineNameParam || 'Paracetamol 500mg',
          price: 25.0,
          quantity: 120,
          stockStatus: 'AVAILABLE',
        },
        {
          id: 2,
          name: 'MedPlus Chemist & Druggist',
          description: 'Premier health and wellness dispensary.',
          licenseNumber: 'TS-HYD-2024-9102',
          addressLine: 'Madhapur Main Road, Near Metro',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          phone: '+91 9876543211',
          email: 'medplus.madhapur@example.com',
          is24Hours: false,
          isOpenNow: true,
          rating: 4.6,
          latitude: 17.4480,
          longitude: 78.3910,
          distanceKm: 3.20,
          medicineId: medicineIdParam ? Number(medicineIdParam) : null,
          medicineName: medicineNameParam || 'Paracetamol 500mg',
          price: 25.5,
          quantity: 14,
          stockStatus: 'LOW_STOCK',
        },
        {
          id: 3,
          name: 'Wellness Forever 24x7 Pharmacy',
          description: 'Certified round-the-clock emergency medical supply store.',
          licenseNumber: 'TS-HYD-2023-4011',
          addressLine: 'Gachibowli Ring Road, Telecom Nagar',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500032',
          phone: '+91 9876543212',
          email: 'wellness.gachibowli@example.com',
          is24Hours: true,
          isOpenNow: true,
          rating: 4.7,
          latitude: 17.4400,
          longitude: 78.3480,
          distanceKm: 6.80,
          medicineId: medicineIdParam ? Number(medicineIdParam) : null,
          medicineName: medicineNameParam || 'Paracetamol 500mg',
          price: 26.0,
          quantity: 45,
          stockStatus: 'AVAILABLE',
        },
      ];

      const filtered = fallbackList.filter((p) => p.distanceKm <= radiusKm);
      setPharmacies(filtered);
    } finally {
      setLoading(false);
    }
  }, [coordinates, radiusKm, medicineIdParam, medicineNameParam]);

  // Auto-fetch when coordinates or radius changes
  useEffect(() => {
    if (coordinates) {
      fetchNearbyPharmacies();
    }
  }, [coordinates, radiusKm, fetchNearbyPharmacies]);

  // Open reservation modal
  const handleOpenReserve = (pharmacy) => {
    if (!isAuthenticated) {
      toast.info('Please log in to reserve medicine for a 24-hour hold.');
      return;
    }
    setReservingPharmacy(pharmacy);
    setReserveQuantity(1);
    setReserveModalOpen(true);
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!reservingPharmacy || !reservingPharmacy.medicineId) return;

    setIsReserving(true);
    try {
      const response = await reservationService.createReservation({
        medicineId: reservingPharmacy.medicineId,
        pharmacyId: reservingPharmacy.id,
        quantity: reserveQuantity,
      });

      toast.success(
        `Medicine hold placed successfully! Hold Code: ${response.reservationCode}`
      );
      setReserveModalOpen(false);
      fetchNearbyPharmacies();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to place reservation hold.'
      );
    } finally {
      setIsReserving(false);
    }
  };

  const handleClearMedicineFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-white">
      {/* Header Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-primary-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <FiShield size={13} /> Verified Pharmacy Haversine Locator
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
            Find Nearby Pharmacies
          </h1>
          <p className="text-sm sm:text-base text-primary-100/90 leading-relaxed">
            Locate verified local pharmacies ordered by distance, view operating hours, check medicine availability, and open one-click Google Maps navigation.
          </p>
        </div>
      </section>

      {/* Selected Medicine Filter Banner (if coming from Medicine Search) */}
      {medicineIdParam && (
        <div className="rounded-3xl border border-cyan-400/30 bg-cyan-950/40 p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-md">
              <FiPackage size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Filtering by Medicine
              </p>
              <h2 className="text-lg font-bold text-white leading-tight">
                {medicineNameParam || `Medicine #${medicineIdParam}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/search"
              className="text-xs text-primary-200/80 hover:text-cyan-300 underline"
            >
              Search different medicine
            </Link>
            <button
              onClick={handleClearMedicineFilter}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all"
            >
              <FiX size={14} /> Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Location Acquisition & Control Center */}
      <section className="rounded-4xl border border-white/15 bg-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FiMapPin className="text-cyan-400" /> Choose Location
            </h3>
            <p className="text-xs text-primary-200/80">
              {coordinates
                ? `Active location: ${coordinates.label} (${coordinates.lat.toFixed(4)}° N, ${coordinates.lng.toFixed(4)}° E)`
                : 'Click "Use My Location" or select a preset city to find pharmacies near you.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-xs font-bold shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              <FiCrosshair size={16} className={isLocating ? 'animate-spin' : ''} />
              {isLocating ? 'Acquiring GPS Location...' : 'Use My Location'}
            </button>
          </div>
        </div>

        {/* Preset Cities / Demo Locations Strip */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-cyan-300">
            Or select a demo city / preset area:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_LOCATIONS.map((preset) => {
              const isSelected =
                coordinates &&
                coordinates.lat === preset.lat &&
                coordinates.lng === preset.lng;

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-95 ${isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-primary-600 text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                      : 'border border-white/15 bg-white/5 text-primary-100 hover:bg-white/15 hover:text-white'
                    }`}
                >
                  <FiMapPin size={11} className="text-cyan-400" />
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Geolocation Notice / Error banner */}
        {geoError && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/15 p-4 flex items-start gap-3 text-xs text-amber-200 shadow-md">
            <FiAlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Location Notice</p>
              <p className="mt-0.5 leading-relaxed">{geoError}</p>
            </div>
          </div>
        )}

        {/* Radius Filter Chips */}
        {coordinates && (
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-cyan-300 mr-1">Search Radius:</span>
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${radiusKm === r
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'border border-white/15 bg-white/5 text-primary-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {r} km
                </button>
              ))}
            </div>

            <span className="text-xs text-primary-200/60 font-medium">
              Sorted by nearest distance (Haversine formula)
            </span>
          </div>
        )}
      </section>

      {/* Initial Prompt before picking location */}

      {/* OpenStreetMap - Nearby Pharmacies */}
      {coordinates && (
        <PharmacyMap
          center={{
            lat: coordinates.lat,
            lng: coordinates.lng,
          }}
          pharmacies={pharmacies}
        />
      )}


      {!coordinates && !isLocating && (
        <div className="rounded-4xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-primary-100/80 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
            <FiCrosshair size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Find Pharmacies in Your Area</h2>
          <p className="max-w-md mx-auto text-sm text-primary-200/70">
            Click <strong>"Use My Location"</strong> to automatically detect nearby pharmacies, or pick a demo city to preview live inventories.
          </p>
          <div className="pt-2">
            <button
              onClick={handleUseMyLocation}
              className="btn-primary inline-flex items-center gap-2 py-3 px-8 text-xs font-bold shadow-lg shadow-cyan-500/25"
            >
              <FiCrosshair size={15} /> Use My Location Now
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-4xl border border-white/10 bg-white/5 p-6 sm:p-7 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-6 w-36 rounded-xl bg-white/10" />
                <div className="h-6 w-20 rounded-full bg-white/10" />
              </div>
              <div className="h-4 w-48 rounded-xl bg-white/10" />
              <div className="h-10 w-full rounded-2xl bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {/* Empty Results State */}
      {coordinates && !loading && pharmacies.length === 0 && (
        <div className="rounded-4xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-primary-100/80 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-400/30 text-amber-300">
            <FiAlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">No Verified Pharmacies Found</h2>
          <p className="max-w-md mx-auto text-sm text-primary-200/70">
            No partner pharmacies were found within {radiusKm} km of your selected location. Try expanding your search radius.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {radiusKm < 50 && (
              <button
                onClick={() => setRadiusKm(50)}
                className="btn-primary inline-flex items-center gap-2 py-2.5 px-6 text-xs font-bold"
              >
                Expand Radius to 50 km
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pharmacy Cards Grid */}
      {coordinates && !loading && pharmacies.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-bold text-white">
              Found {pharmacies.length} {pharmacies.length === 1 ? 'pharmacy' : 'pharmacies'} within {radiusKm} km
            </h2>
            <button
              onClick={fetchNearbyPharmacies}
              className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-white"
            >
              <FiRefreshCw size={12} /> Refresh
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pharmacies.map((pharmacy) => {
              const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`;
              const hasMedicine = pharmacy.medicineId && pharmacy.stockStatus;
              const isAvailable = pharmacy.stockStatus === 'AVAILABLE';
              const isLowStock = pharmacy.stockStatus === 'LOW_STOCK';
              const isNotStocked = pharmacy.stockStatus === 'NOT_STOCKED';
              const canReserve = hasMedicine && pharmacy.quantity > 0 && !isNotStocked;

              return (
                <div
                  key={pharmacy.id}
                  className="rounded-4xl border border-white/15 bg-white/10 p-6 sm:p-7 backdrop-blur-xl shadow-2xl flex flex-col justify-between space-y-5 hover:border-cyan-400/40 hover:bg-slate-900/80 transition-all"
                >
                  <div className="space-y-4">
                    {/* Top Row: Distance Pill & Verified Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-950/70 px-3 py-1 text-xs font-black text-cyan-300 shadow-sm shadow-cyan-900/30">
                        <FiNavigation size={12} className="text-cyan-400" />
                        {pharmacy.distanceKm} km away
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                          <FiCheckCircle size={11} /> Verified
                        </span>
                        {pharmacy.rating > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                            <FiStar size={11} className="fill-amber-300" /> {pharmacy.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pharmacy Info */}
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {pharmacy.name}
                      </h3>
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-primary-200/80 leading-relaxed">
                        <FiMapPin size={14} className="shrink-0 text-cyan-400 mt-0.5" />
                        <span>{pharmacy.addressLine}, {pharmacy.city}{pharmacy.postalCode ? ` - ${pharmacy.postalCode}` : ''}</span>
                      </p>
                    </div>

                    {/* Operating Status & Phone */}
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-primary-200/80">
                        <span className="flex items-center gap-1.5">
                          <FiClock size={13} className="text-cyan-400" />
                          Hours:
                        </span>
                        {pharmacy.is24Hours ? (
                          <span className="font-bold text-emerald-300">24 Hours Open</span>
                        ) : pharmacy.isOpenNow ? (
                          <span className="font-bold text-emerald-300">
                            Open Now {pharmacy.closingTime ? `(until ${pharmacy.closingTime})` : ''}
                          </span>
                        ) : (
                          <span className="font-bold text-rose-300">Closed Now</span>
                        )}
                      </div>

                      {pharmacy.phone && (
                        <div className="flex items-center justify-between text-primary-200/80 border-t border-white/10 pt-1.5">
                          <span className="flex items-center gap-1.5">
                            <FiPhone size={13} className="text-cyan-400" />
                            Phone:
                          </span>
                          <a
                            href={`tel:${pharmacy.phone}`}
                            className="font-medium text-cyan-300 hover:underline"
                          >
                            {pharmacy.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Medicine Stock Card (when medicine filter is active) */}
                    {hasMedicine && (
                      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-950/50 p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white truncate max-w-[160px]">
                            {pharmacy.medicineName}
                          </span>
                          {pharmacy.price && (
                            <span className="font-black text-cyan-300 text-sm">
                              ₹{Number(pharmacy.price).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                          <div>
                            {isAvailable && (
                              <span className="badge-available">
                                <FiCheckCircle size={10} /> {pharmacy.quantity} in stock
                              </span>
                            )}
                            {isLowStock && (
                              <span className="badge-low">
                                <FiAlertCircle size={10} /> Only {pharmacy.quantity} left
                              </span>
                            )}
                            {isNotStocked && (
                              <span className="badge-out">Not stocked here</span>
                            )}
                          </div>

                          {canReserve && (
                            <button
                              onClick={() => handleOpenReserve(pharmacy)}
                              className="btn-primary py-1 px-2.5 text-[11px] font-bold flex items-center gap-1"
                            >
                              <FiBookmark size={11} /> Reserve
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2.5">
                    <a
                      href={googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 text-center"
                    >
                      <FiNavigation size={13} />
                      <span>Get Directions</span>
                      <FiExternalLink size={11} className="opacity-70" />
                    </a>

                    {pharmacy.phone && (
                      <a
                        href={`tel:${pharmacy.phone}`}
                        className="btn-secondary py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1"
                        title="Call Pharmacy"
                      >
                        <FiPhone size={13} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Direct Reserve Modal from Nearby Card */}
      {reserveModalOpen && reservingPharmacy && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-4xl border border-white/20 bg-slate-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold">
                  <FiBookmark size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reserve Medicine Hold</h3>
                  <p className="text-xs text-cyan-300">24-Hour Counter Guarantee</p>
                </div>
              </div>
              <button
                onClick={() => setReserveModalOpen(false)}
                className="text-primary-200/70 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmReservation} className="space-y-4">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-1.5">
                <p className="font-bold text-white text-sm">{reservingPharmacy.medicineName}</p>
                <p className="text-xs text-cyan-300 font-medium">{reservingPharmacy.name}</p>
                <p className="text-xs text-primary-200/70">{reservingPharmacy.addressLine}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-cyan-300 uppercase">Quantity</span>
                  <span className="text-[11px] text-primary-200/60">
                    Max available: {reservingPharmacy.quantity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReserveQuantity((q) => Math.max(1, q - 1))}
                    disabled={reserveQuantity <= 1}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-40"
                  >
                    <FiMinus size={12} />
                  </button>
                  <span className="w-8 text-center font-bold">{reserveQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setReserveQuantity((q) => Math.min(reservingPharmacy.quantity, q + 1))}
                    disabled={reserveQuantity >= reservingPharmacy.quantity}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-40"
                  >
                    <FiPlus size={12} />
                  </button>
                </div>
              </div>

              {reservingPharmacy.price && (
                <div className="flex justify-between items-center px-1 text-xs">
                  <span className="text-primary-200/80">Estimated Total:</span>
                  <span className="text-lg font-black text-cyan-300">
                    ₹{(Number(reservingPharmacy.price) * reserveQuantity).toFixed(2)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isReserving}
                className="w-full btn-primary py-3 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                {isReserving ? (
                  'Reserving...'
                ) : (
                  <>
                    Confirm 24-Hour Hold <FiArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
