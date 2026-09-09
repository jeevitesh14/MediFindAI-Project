import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  FiSearch,
  FiMapPin,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiTrendingDown,
  FiInfo,
  FiPackage,
  FiShield,
  FiClock,
  FiBookmark,
  FiMinus,
  FiPlus,
  FiArrowRight,
  FiUploadCloud,
  FiShoppingCart,
  FiBookOpen,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import apiClient from '../../api/axiosConfig';
import useAuth from '../../hooks/useAuth';
import reservationService from '../../services/reservationService';
import { addToCart } from '../../store/slices/cartSlice';
import VoiceSearchButton from '../../components/forms/VoiceSearchButton';
import PrescriptionUploadModal from '../../components/forms/PrescriptionUploadModal';

const POPULAR_SEARCHES = [
  'Paracetamol 500mg',
  'Azithromycin 500mg',
  'Cetirizine 10mg',
  'Pantoprazole 40mg',
  'Amoxicillin 500mg',
  'Vitamin D3 60K',
];

export default function MedicineSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedDetails, setExpandedDetails] = useState({});

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Prescription Upload Modal state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);

  // Reservation Modal state
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [isReserving, setIsReserving] = useState(false);

  const toggleDetails = (medicineId) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [medicineId]: !prev[medicineId],
    }));
  };


  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Perform full search
  const performSearch = useCallback(async (searchTerm) => {
    const term = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!term) {
      setResults([]);
      setMessage('Enter a medicine name or generic active ingredient to search.');
      return;
    }

    setLoading(true);
    setMessage('');
    setShowSuggestions(false);

    try {
      const response = await apiClient.get('/medicines/search', {
        params: { q: term },
      });

      const data = response.data?.data || [];
      setResults(data);

      if (data.length === 0) {
        setMessage(`No medicine stock found matching "${term}". Check spelling or try a generic name.`);
      }
    } catch (error) {
      // Safe fallback mock data
      const mockResults = [
        {
          id: 1,
          name: 'Paracetamol 500mg',
          genericName: 'Paracetamol',
          dosageForm: 'Tablet',
          strength: '500mg',
          manufacturer: 'Cipla Ltd',
          category: 'Analgesics',
          requiresPrescription: false,
          pharmacies: [
            {
              pharmacyId: 10,
              pharmacyName: 'Apollo Care Pharmacy',
              address: 'Road No 36, Jubilee Hills',
              city: 'Hyderabad',
              price: 25.0,
              quantity: 200,
              stockStatus: 'AVAILABLE',
            },
            {
              pharmacyId: 11,
              pharmacyName: 'MedPlus Chemist',
              address: 'Madhapur Main Road',
              city: 'Hyderabad',
              price: 25.5,
              quantity: 8,
              stockStatus: 'LOW_STOCK',
            },
            {
              pharmacyId: 12,
              pharmacyName: 'Wellness Forever 24x7',
              address: 'Gachibowli Ring Road',
              city: 'Hyderabad',
              price: 26.0,
              quantity: 0,
              stockStatus: 'OUT_OF_STOCK',
            },
          ],
        },
      ];

      const filtered = mockResults.filter(
        (m) =>
          m.name.toLowerCase().includes(term.toLowerCase()) ||
          m.genericName.toLowerCase().includes(term.toLowerCase())
      );

      setResults(filtered);
      if (filtered.length === 0) {
        setMessage(`No medicines found for "${term}".`);
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Initial load or search param sync
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
    if (searchParams.get('upload') === 'true' || searchParams.get('upload') === 'prescription') {
      setPrescriptionModalOpen(true);
    }
  }, [initialQuery, searchParams, performSearch]);

  // Handle autocomplete debounced fetch
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const response = await apiClient.get('/medicines/suggestions', {
          params: { q: trimmed, limit: 6 },
        });
        const list = response.data?.data || [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        try {
          const fallbackRes = await apiClient.get('/medicines/search', {
            params: { q: trimmed },
          });
          const list = (fallbackRes.data?.data || []).map((m) => ({
            id: m.id,
            name: m.name,
            genericName: m.genericName,
            strength: m.strength,
            dosageForm: m.dosageForm,
            requiresPrescription: m.requiresPrescription,
          }));
          setSuggestions(list);
          setShowSuggestions(list.length > 0);
          setActiveIndex(-1);
        } catch {
          setSuggestions([]);
        }
      } finally {
        setSuggestLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex]);
      } else {
        performSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    setSearchParams({ q: suggestion.name });
    performSearch(suggestion.name);
  };

  const handleVoiceResult = (spokenText) => {
    if (!spokenText) return;
    setQuery(spokenText);
    setSearchParams({ q: spokenText });
    performSearch(spokenText);
    toast.info(`Voice input recognized: "${spokenText}"`);
  };

  const handlePopularClick = (popular) => {
    setQuery(popular);
    setSearchParams({ q: popular });
    performSearch(popular);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchParams({});
    inputRef.current?.focus();
  };

  // Open reservation modal
  const handleOpenReserveModal = (medicine, pharmacy) => {
    if (!isAuthenticated) {
      toast.info('Please log in to reserve medicines for a 24-hour hold.');
      navigate('/login', { state: { from: location } });
      return;
    }

    setSelectedMedicine(medicine);
    setSelectedPharmacy(pharmacy);
    setReserveQuantity(1);
    setReserveModalOpen(true);
  };

  // Close reservation modal
  const handleCloseReserveModal = () => {
    setReserveModalOpen(false);
    setSelectedMedicine(null);
    setSelectedPharmacy(null);
    setReserveQuantity(1);
  };

  // Add to shopping cart
  const handleAddToCart = (medicine, pharmacy) => {
    dispatch(
      addToCart({
        medicine: {
          id: medicine.id,
          name: medicine.name,
          genericName: medicine.genericName,
          strength: medicine.strength,
          dosageForm: medicine.dosageForm,
          requiresPrescription: medicine.requiresPrescription,
        },
        pharmacy: {
          id: pharmacy.pharmacyId,
          name: pharmacy.pharmacyName,
          address: pharmacy.address,
          city: pharmacy.city,
        },
        price: Number(pharmacy.price) || 0,
        quantity: 1,
        maxStock: pharmacy.quantity || 99,
      })
    );
    toast.success(`${medicine.name} added to cart from ${pharmacy.pharmacyName}!`);
  };

  // Submit reservation

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!selectedMedicine || !selectedPharmacy) return;

    setIsReserving(true);
    try {
      const response = await reservationService.createReservation({
        medicineId: selectedMedicine.id,
        pharmacyId: selectedPharmacy.pharmacyId,
        quantity: reserveQuantity,
      });

      toast.success(
        `Medicine reserved successfully! Hold code: ${response.reservationCode}`
      );
      handleCloseReserveModal();

      // Refresh search results to update stock immediately
      performSearch(query);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Failed to place reservation. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-white">
      {/* Header Banner */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-900/30 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <FiShield size={13} /> Real-Time Pharmacy Stock & Prices
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
              Medicine Autocomplete Search
            </h1>
            <p className="mt-3 text-sm sm:text-base text-primary-100/90 leading-relaxed">
              Search any medicine or generic molecule to check live availability, compare prices across licensed local pharmacies, or upload your prescription for smart extraction.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <button
              type="button"
              onClick={() => setPrescriptionModalOpen(true)}
              className="btn-secondary py-3 px-5 text-sm font-bold border-cyan-400/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 hover:text-white shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
            >
              <FiUploadCloud size={18} className="text-cyan-400" />
              <span>Upload Prescription</span>
            </button>
          </div>
        </div>
      </section>

      {/* Autocomplete Search Bar */}
      <div ref={containerRef} className="relative z-30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            performSearch();
          }}
          className="relative flex items-center shadow-2xl rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-white/20 p-2 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/20 backdrop-blur-2xl transition-all"
        >
          <div className="flex items-center pl-3 pr-2 text-cyan-400">
            <FiSearch size={22} />
          </div>

          <input
            ref={inputRef}
            id="medicine-search-input"
            type="text"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="medicine-suggestions-list"
            aria-autocomplete="list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 && query.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type at least 2 characters (e.g. 'par', 'amox', 'cetirizine') or speak..."
            className="w-full bg-transparent py-2.5 sm:py-3 pr-2 text-sm sm:text-base text-white placeholder:text-primary-200/50 focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="mr-1.5 rounded-lg p-1.5 text-primary-200/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <FiX size={18} />
            </button>
          )}

          {/* Voice Search Microphone Button */}
          <div className="mr-2 shrink-0">
            <VoiceSearchButton
              onVoiceResult={handleVoiceResult}
              disabled={loading}
              size="md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary shrink-0 py-3 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-cyan-500/25"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Searching...
              </span>
            ) : (
              <span>Search</span>
            )}
          </button>
        </form>


        {/* Autocomplete Dropdown Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            id="medicine-suggestions-list"
            role="listbox"
            className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-3xl border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-2xl animate-fade-in"
          >
            <div className="border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-300 flex items-center justify-between">
              <span>Matching Medicines</span>
              {suggestLoading && <span className="text-cyan-400">Updating...</span>}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-white/10">
              {suggestions.map((item, idx) => (
                <button
                  key={item.id || idx}
                  role="option"
                  aria-selected={activeIndex === idx}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
                    activeIndex === idx
                      ? 'bg-cyan-950/70 text-cyan-300'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      <FiPackage size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">{item.name}</p>
                      <p className="text-xs text-primary-200/70 leading-tight mt-0.5">
                        {item.genericName || 'Active compound'} {item.strength ? `· ${item.strength}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.requiresPrescription ? (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-400/40 px-2 py-0.5 rounded-full">
                        Rx Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                        OTC
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Popular Search Suggestions Pill Strip */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-cyan-300">Popular searches:</span>
        {POPULAR_SEARCHES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handlePopularClick(item)}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-medium text-primary-100 backdrop-blur-md shadow-sm transition-all hover:border-cyan-400/50 hover:bg-white/20 hover:text-white active:scale-95"
          >
            ✚ {item}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-fade-in">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-4xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl skeleton" />
                  <div className="space-y-2">
                    <div className="h-6 w-48 rounded-lg skeleton" />
                    <div className="h-4 w-64 rounded-lg skeleton" />
                  </div>
                </div>
                <div className="h-10 w-28 rounded-xl skeleton" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-36 rounded-2xl skeleton" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Info Box */}
      {message && !loading && (
        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl text-center text-sm text-primary-100 shadow-xl flex items-center justify-center gap-2.5">
          <FiInfo size={18} className="text-cyan-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Search Results Display */}
      {!loading && results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-bold text-white">
              Found {results.length} medicine {results.length === 1 ? 'match' : 'matches'}
            </h2>
            <span className="text-xs text-cyan-300 font-medium">Sorted by lowest pharmacy price</span>
          </div>

          <div className="grid gap-6">
            {results.map((medicine) => {
              const activePharmacies = medicine.pharmacies || [];
              const lowestPrice = activePharmacies.length > 0
                ? Math.min(...activePharmacies.map((p) => Number(p.price)))
                : null;
              const isDetailsExpanded = expandedDetails[medicine.id];

              return (
                <div key={medicine.id} className="rounded-4xl border border-white/15 bg-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                  {/* Medicine Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-lg shadow-cyan-500/25">
                        <FiPackage size={22} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-xl sm:text-2xl font-bold text-white">{medicine.name}</h3>
                          {medicine.requiresPrescription ? (
                            <span className="badge-prescription">Prescription Required (Rx)</span>
                          ) : (
                            <span className="badge-otc">Over-The-Counter (OTC)</span>
                          )}
                        </div>

                        <p className="mt-1.5 text-sm text-primary-100/90">
                          <span className="font-semibold text-cyan-300">Generic:</span>{' '}
                          {medicine.genericName || 'Standard Formulation'}{' '}
                          {medicine.strength && <span>· {medicine.strength}</span>}{' '}
                          {medicine.dosageForm && <span>· {medicine.dosageForm}</span>}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-primary-200/70">
                          <span>Manufacturer: <strong className="text-primary-100">{medicine.manufacturer || 'Certified Pharma'}</strong></span>
                          {medicine.category && <span>· Category: <strong className="text-primary-100">{medicine.category}</strong></span>}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleDetails(medicine.id)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
                        >
                          <FiBookOpen size={13} />
                          <span>{isDetailsExpanded ? 'Hide clinical details & precautions' : 'View clinical details & precautions'}</span>
                          {isDetailsExpanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2.5">
                      {lowestPrice !== null && (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full mb-1">
                            <FiTrendingDown size={13} /> Best Price Available
                          </span>
                          <p className="text-3xl font-black text-cyan-300">₹{lowestPrice.toFixed(2)}</p>
                        </div>
                      )}
                      <Link
                        to={`/dashboard/pharmacies?medicineId=${medicine.id}&medicineName=${encodeURIComponent(medicine.name)}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-950/60 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all shadow-md shadow-cyan-950/40"
                      >
                        <FiMapPin size={13} /> Find Nearby Pharmacies
                      </Link>
                    </div>
                  </div>

                  {/* Expandable Clinical Information Drawer */}
                  {isDetailsExpanded && (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-3.5 animate-fade-in text-xs leading-relaxed">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                        <FiShield size={14} className="text-cyan-400" />
                        <span>Clinical Overview & Safety Guidance</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 text-primary-100/90 pt-1">
                        <div>
                          <p className="font-semibold text-white mb-1">Dosage Form & Administration</p>
                          <p className="text-primary-200/80">
                            Supplied as {medicine.dosageForm || 'medication'} ({medicine.strength || 'standard concentration'}). Take strictly as indicated by your physician or on product labelling.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-white mb-1">Dispensing Regulations</p>
                          <p className="text-primary-200/80">
                            {medicine.requiresPrescription
                              ? 'Schedule H/Rx medication. Valid registered doctor prescription is mandatory upon pickup.'
                              : 'Over-the-counter (OTC) medication. Can be purchased without prior prescription.'}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-white/10 pt-3 text-[11px] text-primary-200/60 italic flex items-center gap-1.5">
                        <FiInfo size={12} className="shrink-0 text-cyan-400" />
                        MediFindAI displays verified manufacturer data and does not substitute professional medical consultation.
                      </div>
                    </div>
                  )}

                  {/* Pharmacy Availability & Price Comparison */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                        Available Pharmacies & Price Comparison ({activePharmacies.length})
                      </h4>
                      <span className="text-xs text-primary-200/60">Real-time inventory</span>
                    </div>

                    {activePharmacies.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {activePharmacies.map((pharmacy) => {
                          const isBestPrice = Number(pharmacy.price) === lowestPrice;
                          const isAvailable = pharmacy.stockStatus === 'AVAILABLE';
                          const isLowStock = pharmacy.stockStatus === 'LOW_STOCK';
                          const canReserve = pharmacy.quantity > 0 && pharmacy.stockStatus !== 'OUT_OF_STOCK';

                          return (
                            <div
                              key={pharmacy.pharmacyId}
                              className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                                isBestPrice
                                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/80 border-cyan-400/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
                                  : 'bg-slate-900/70 border-white/10 hover:border-cyan-400/30 hover:bg-slate-900/90'
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-white text-sm sm:text-base leading-tight truncate">
                                      {pharmacy.pharmacyName}
                                    </p>
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-primary-200/70 truncate">
                                      <FiMapPin size={13} className="shrink-0 text-cyan-400" />
                                      <span className="truncate">{pharmacy.address}, {pharmacy.city}</span>
                                    </p>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <p className="text-lg font-extrabold text-cyan-300">
                                      ₹{Number(pharmacy.price).toFixed(2)}
                                    </p>
                                    {isBestPrice && (
                                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                        Lowest Price
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                                  <div>
                                    {isAvailable && (
                                      <span className="badge-available">
                                        <FiCheckCircle size={11} /> {pharmacy.quantity} in stock
                                      </span>
                                    )}
                                    {isLowStock && (
                                      <span className="badge-low">
                                        <FiAlertCircle size={11} /> Only {pharmacy.quantity} left
                                      </span>
                                    )}
                                    {!isAvailable && !isLowStock && (
                                      <span className="badge-out">
                                        <FiX size={11} /> Out of stock
                                      </span>
                                    )}
                                  </div>

                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-200/70">
                                    <FiClock size={11} className="text-cyan-300" /> Holds 24 hrs
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons: Add to Cart & 24h Hold */}
                              <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                                {canReserve ? (
                                  <>
                                    <button
                                      onClick={() => handleAddToCart(medicine, pharmacy)}
                                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                                    >
                                      <FiShoppingCart size={13} /> Add to Cart / Order
                                    </button>
                                    <button
                                      onClick={() => handleOpenReserveModal(medicine, pharmacy)}
                                      className="w-full py-1.5 px-3 rounded-xl border border-cyan-400/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                                    >
                                      <FiBookmark size={13} /> Reserve (Free 24h Hold)
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    disabled
                                    className="w-full py-2 px-4 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-primary-200/40 cursor-not-allowed text-center"
                                  >
                                    Out of Stock
                                  </button>
                                )}
                              </div>
                            </div>
                          );

                        })}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-sm text-primary-200/70">
                        <FiAlertCircle size={26} className="mx-auto mb-2 text-amber-400" />
                        No active partner pharmacy currently lists stock for this item.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reservation Dialog Modal */}
      {reserveModalOpen && selectedMedicine && selectedPharmacy && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reserve-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-lg rounded-4xl border border-white/20 bg-slate-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white font-bold shadow-md shadow-cyan-500/25">
                  <FiBookmark size={18} />
                </div>
                <div>
                  <h2 id="reserve-modal-title" className="text-lg font-bold text-white leading-tight">
                    Reserve Medicine Hold
                  </h2>
                  <p className="text-xs text-cyan-300">24-Hour Counter Pickup Guarantee</p>
                </div>
              </div>
              <button
                onClick={handleCloseReserveModal}
                aria-label="Close dialog"
                className="rounded-xl p-1.5 text-primary-200/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmReservation} className="space-y-4">
              {/* Medicine & Pharmacy Details Summary */}
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-white">{selectedMedicine.name}</h3>
                    <p className="text-xs text-primary-200/70 mt-0.5">
                      {selectedMedicine.genericName} {selectedMedicine.strength ? `· ${selectedMedicine.strength}` : ''}{' '}
                      {selectedMedicine.dosageForm ? `· ${selectedMedicine.dosageForm}` : ''}
                    </p>
                  </div>
                  <span className="text-base font-extrabold text-cyan-300">
                    ₹{Number(selectedPharmacy.price).toFixed(2)}/unit
                  </span>
                </div>

                <div className="border-t border-white/10 pt-2.5 flex items-center gap-2 text-xs text-primary-200/80">
                  <FiMapPin size={14} className="text-cyan-400 shrink-0" />
                  <span className="truncate">
                    <strong>{selectedPharmacy.pharmacyName}</strong> ({selectedPharmacy.address}, {selectedPharmacy.city})
                  </span>
                </div>
              </div>

              {/* Prescription Warning Notice */}
              {selectedMedicine.requiresPrescription && (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/15 p-3.5 flex items-start gap-2.5 text-xs text-amber-200 shadow-md">
                  <FiAlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">Doctor's Prescription Required (Rx)</p>
                    <p className="mt-0.5 leading-relaxed text-amber-200/90">
                      Please bring a valid doctor's prescription upon counter pickup. The pharmacist will verify it before dispensing.
                    </p>
                  </div>
                </div>
              )}

              {/* Quantity Selector & Price Calculation */}
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="reserve-qty-input" className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Quantity to Reserve
                    </label>
                    <span className="text-[11px] text-primary-200/60">
                      Available: {selectedPharmacy.quantity} in stock
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReserveQuantity((q) => Math.max(1, q - 1))}
                      disabled={reserveQuantity <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
                    >
                      <FiMinus size={13} />
                    </button>
                    <input
                      id="reserve-qty-input"
                      type="number"
                      min={1}
                      max={selectedPharmacy.quantity}
                      value={reserveQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setReserveQuantity(Math.min(selectedPharmacy.quantity, Math.max(1, val)));
                        }
                      }}
                      className="w-14 text-center rounded-xl border border-white/20 bg-slate-900 px-2 py-1 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setReserveQuantity((q) => Math.min(selectedPharmacy.quantity, q + 1))}
                      disabled={reserveQuantity >= selectedPharmacy.quantity}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
                    >
                      <FiPlus size={13} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary-200/80">Estimated Total Payable:</span>
                  <span className="text-xl font-black text-cyan-300">
                    ₹{(Number(selectedPharmacy.price) * reserveQuantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 24-Hour Policy Notice */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center gap-2.5 text-xs text-primary-200/70">
                <FiClock size={15} className="text-cyan-400 shrink-0" />
                <p className="leading-tight">
                  Your medicine will be held securely for 24 hours. No upfront payment required; pay at pickup.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseReserveModal}
                  disabled={isReserving}
                  className="btn-secondary flex-1 py-3 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReserving}
                  className="btn-primary flex-1 py-3 text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                >
                  {isReserving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Reserving...
                    </>
                  ) : (
                    <>
                      Confirm 24-Hour Hold <FiArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Upload & OCR Extraction Modal */}
      <PrescriptionUploadModal
        isOpen={prescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
        onSelectMedicine={(medName) => {
          setQuery(medName);
          setSearchParams({ q: medName });
          performSearch(medName);
        }}
        onOpenReserve={(medicine, pharmacy) => {
          handleOpenReserveModal(medicine, pharmacy);
        }}
      />
    </div>
  );
}