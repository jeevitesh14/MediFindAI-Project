import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiX,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiPackage,
  FiMapPin,
  FiBookmark,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiCheck,
  FiSearch,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import prescriptionService from '../../services/prescriptionService';
import useAuth from '../../hooks/useAuth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export default function PrescriptionUploadModal({
  isOpen,
  onClose,
  onSelectMedicine,
  onOpenReserve,
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  // Reset state on close or open
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handleReset = () => {
    setFile(null);
    if (previewUrl && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setUploadProgress(0);
    setIsScanning(false);
    setScanResult(null);
    setShowRawText(false);
    setCopied(false);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile) => {
    setErrorMessage('');
    if (!selectedFile) return;

    // 1. Validate file extension & MIME type
    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
    const isMimeValid = ALLOWED_TYPES.includes(selectedFile.type.toLowerCase());
    const isExtValid = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isMimeValid && !isExtValid) {
      const err = `Invalid file format (${selectedFile.name}). Only JPG, JPEG, PNG, and WEBP images are supported.`;
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    // 2. Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      const err = `File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`;
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setFile(selectedFile);
    const objectUrl =
      typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(selectedFile)
        : `blob:mock/${selectedFile.name}`;
    setPreviewUrl(objectUrl);
  };


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndScan = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to upload and analyze your prescriptions.');
      onClose();
      navigate('/login');
      return;
    }

    if (!file) {
      setErrorMessage('Please select a prescription image file to upload.');
      return;
    }

    setIsScanning(true);
    setUploadProgress(10);
    setErrorMessage('');

    try {
      const data = await prescriptionService.scanPrescription(file, (percent) => {
        setUploadProgress(percent);
      });

      setScanResult(data);
      if (data?.statusMessage) {
        toast.info(data.statusMessage);
      } else {
        toast.success('Prescription analyzed successfully!');
      }
    } catch (err) {
      console.error('Prescription extraction failed:', err);
      const status = err.response?.status;
      let msg = err.response?.data?.message || err.message;

      // Map generic or missing errors to specific user-friendly messages
      if (!msg || msg === 'An unexpected error occurred') {
        if (status === 413) {
          msg = 'File is too large. Please upload an image under 5 MB.';
        } else if (status === 415) {
          msg = 'Unsupported file format. Please upload a JPG, PNG, or WEBP prescription image.';
        } else if (status === 400) {
          msg = 'Invalid prescription upload. Please select a valid JPG, PNG, or WEBP file.';
        } else if (status === 401) {
          msg = 'Your session has expired. Please log in again to upload prescriptions.';
        } else if (status === 503) {
          msg = 'Prescription extraction is temporarily unavailable. Please try again.';
        } else {
          msg = 'The prescription image could not be read. Please upload a clearer image or search medicines manually.';
        }
      }

      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyRawText = () => {
    if (scanResult?.rawExtractedText) {
      navigator.clipboard.writeText(scanResult.rawExtractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Extracted text copied to clipboard!');
    }
  };

  const handleSelectMedicineFromScan = (medicineName) => {
    if (onSelectMedicine) {
      onSelectMedicine(medicineName);
    }
    onClose();
  };

  const handleReserveDirectly = (medicine, pharmacy) => {
    if (onOpenReserve) {
      onOpenReserve(medicine, pharmacy);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prescription-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-600 text-white shadow-md shadow-cyan-500/20">
              <FiFileText size={20} />
            </div>
            <div>
              <h2 id="prescription-modal-title" className="text-lg sm:text-xl font-bold text-white leading-tight">
                Upload Prescription & Extract Medicines
              </h2>
              <p className="text-xs text-primary-200/70">
                AI-powered text extraction with live pharmacy stock matching
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close prescription upload dialog"
            className="rounded-xl p-2 text-primary-200/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-white text-sm">
          {/* Privacy & Safety Consent Box (REQUIRED) */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/40 p-4 backdrop-blur-md flex items-start gap-3.5 shadow-inner">
            <FiShield size={20} className="shrink-0 text-cyan-400 mt-0.5" />
            <p className="text-xs text-cyan-100/90 leading-relaxed">
              <strong className="text-cyan-300 font-semibold">Privacy & Safety Notice: </strong>
              Prescription images may contain sensitive health information. Upload only with your consent. MediFindAI helps identify medicine names but does not provide diagnosis, dosage, or medical advice.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/50 p-4 text-xs text-rose-200 flex items-start gap-3 shadow-lg">
              <FiAlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* State 1: Upload / Dropzone Form */}
          {!scanResult && (
            <div className="space-y-5">
              {!previewUrl ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-cyan-400 bg-cyan-950/50 scale-[1.01]'
                      : 'border-white/20 bg-white/5 hover:border-cyan-400/60 hover:bg-white/10'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Upload prescription image"
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      <FiUploadCloud size={30} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        Click to browse or drag and drop prescription image
                      </p>
                      <p className="text-xs text-primary-200/70 mt-1">
                        Supported formats: JPG, JPEG, PNG, WEBP (Max: 5 MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Preview & Actions */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/15 bg-slate-900/80 p-4 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={previewUrl}
                      alt="Prescription preview"
                      className="h-32 w-32 rounded-xl object-cover border border-white/20 shrink-0 shadow-md"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-bold text-white truncate">{file?.name}</p>
                      <p className="text-xs text-primary-200/70 mt-0.5">
                        Size: {(file?.size / (1024 * 1024)).toFixed(2)} MB · Type: {file?.type}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline"
                        >
                          Replace Image
                        </button>
                        <span className="text-white/20">|</span>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {isScanning && (
                    <div className="space-y-2 py-2">
                      <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold">
                        <span className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                          Analyzing prescription text & matching medicines...
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-primary-500 transition-all duration-300"
                          style={{ width: `${Math.max(uploadProgress, 20)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isScanning}
                      className="btn-secondary py-2.5 px-5 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadAndScan}
                      disabled={isScanning}
                      className="btn-primary py-2.5 px-6 text-xs font-bold"
                    >
                      {isScanning ? (
                        <span className="flex items-center gap-2">
                          <FiRefreshCw size={14} className="animate-spin" /> Scanning...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <FiFileText size={14} /> Extract & Match Medicines
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* State 2: Scan Results View */}
          {scanResult && (
            <div className="space-y-6">
              {/* Fallback Notice Banner (if fallback mode) */}
              {scanResult.fallbackMode && (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs text-amber-200 flex items-start gap-3 shadow-inner">
                  <FiAlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300 mb-0.5">Manual Search Mode (No OCR API Key Configured)</p>
                    <p className="leading-relaxed">
                      {scanResult.fallbackNotice ||
                        'OCR is in fallback demo mode. You can search medicine names manually from your prescription below.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Matched Medicines Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <FiPackage size={16} />
                    Detected Medicines ({scanResult.matchedMedicines?.length || 0})
                  </h3>
                  <span className="text-xs text-primary-200/60">
                    Provider: {scanResult.ocrProvider || 'Standard OCR'}
                  </span>
                </div>

                {scanResult.matchedMedicines && scanResult.matchedMedicines.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {scanResult.matchedMedicines.map((med) => {
                      const activePharmacies = med.pharmacies || [];
                      const lowestPrice =
                        activePharmacies.length > 0
                          ? Math.min(...activePharmacies.map((p) => Number(p.price)))
                          : null;
                      const availableCount = activePharmacies.filter(
                        (p) => p.stockStatus === 'AVAILABLE'
                      ).length;

                      return (
                        <div
                          key={med.id}
                          className="rounded-2xl border border-white/15 bg-slate-900/80 p-4 flex flex-col justify-between hover:border-cyan-400/40 transition-all space-y-4"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-white text-base leading-tight">
                                  {med.name}
                                </h4>
                                <p className="text-xs text-cyan-300/90 mt-0.5">
                                  {med.genericName || 'Active Formula'} {med.strength ? `· ${med.strength}` : ''}
                                </p>
                              </div>
                              {med.requiresPrescription ? (
                                <span className="badge-prescription text-[10px]">Rx Required</span>
                              ) : (
                                <span className="badge-otc text-[10px]">OTC</span>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                              <div>
                                {lowestPrice !== null ? (
                                  <p className="font-black text-cyan-300 text-sm">
                                    From ₹{lowestPrice.toFixed(2)}
                                  </p>
                                ) : (
                                  <p className="text-primary-200/50">Price unavailable</p>
                                )}
                              </div>
                              <div>
                                {availableCount > 0 ? (
                                  <span className="badge-available text-[10px]">
                                    <FiCheckCircle size={10} /> {availableCount} store(s) in stock
                                  </span>
                                ) : (
                                  <span className="badge-low text-[10px]">Check stock</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                            <button
                              type="button"
                              onClick={() => handleSelectMedicineFromScan(med.name)}
                              className="btn-primary py-2 px-3 text-xs w-full font-bold flex items-center justify-center gap-1.5"
                            >
                              <FiSearch size={13} /> View Availability & Prices
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                navigate(
                                  `/dashboard/pharmacies?medicineId=${med.id}&medicineName=${encodeURIComponent(med.name)}`
                                );
                              }}
                              className="btn-secondary py-1.5 px-3 text-xs w-full font-medium flex items-center justify-center gap-1.5 text-cyan-300"
                            >
                              <FiMapPin size={12} /> Find Nearby Pharmacies
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-xs text-primary-200/80 space-y-3">
                    <p>No exact catalog matches were detected automatically from this scan.</p>
                    <p className="text-primary-100">
                      You can manually type medicine names from your prescription into the search bar.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/dashboard/search');
                      }}
                      className="btn-primary py-2 px-4 text-xs font-bold mx-auto inline-flex items-center gap-1.5"
                    >
                      <FiSearch size={13} /> Open Medicine Search
                    </button>
                  </div>
                )}
              </div>

              {/* Unmatched Medicines Section */}
              {scanResult.unmatchedMedicineNames && scanResult.unmatchedMedicineNames.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <FiAlertCircle size={15} />
                    <span>Prescribed medicines not in catalog ({scanResult.unmatchedMedicineNames.length})</span>
                  </div>
                  <p className="text-[11px] text-amber-100/80 leading-relaxed">
                    Some extracted medicines could not be matched with our inventory. You can search for alternative brand names in the medicine search bar:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {scanResult.unmatchedMedicineNames.map((name, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-900/40 px-2.5 py-1 text-xs text-amber-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Extracted Text Drawer (Collapsible) */}
              <div className="rounded-2xl border border-white/15 bg-slate-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-primary-100 hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FiFileText size={14} className="text-cyan-400" />
                    Raw Extracted OCR Text
                  </span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    {showRawText ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </span>
                </button>

                {showRawText && (
                  <div className="p-4 border-t border-white/10 bg-slate-950/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-primary-200/60">
                        Extracted text may contain OCR variations
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyRawText}
                        className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200"
                      >
                        {copied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
                        {copied ? 'Copied' : 'Copy Text'}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-primary-100/90 whitespace-pre-wrap bg-black/40 p-3 rounded-xl border border-white/10 max-h-48 overflow-y-auto">
                      {scanResult.rawExtractedText || 'No readable text was detected in the uploaded image.'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Mandatory Medical Safety Disclaimer */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-xs text-primary-200/80 flex items-start gap-2.5">
                <FiShield size={16} className="shrink-0 text-cyan-400 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-white font-semibold">Important: </strong>
                  Always verify prescription details with a pharmacist or qualified healthcare professional.
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <FiRefreshCw size={13} /> Scan Another
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary py-2 px-6 text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
