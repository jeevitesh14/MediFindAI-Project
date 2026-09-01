import { useState, useEffect, useRef } from 'react';
import {
  FiCamera,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiMaximize,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import apiClient from '../../api/axiosConfig';

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export default function BarcodeScannerModal({ isOpen, onClose, onMedicineFound, onManualSearch }) {
  const [cameraState, setCameraState] = useState('initializing'); // 'initializing' | 'scanning' | 'detected' | 'error' | 'not_found'
  const [errorMessage, setErrorMessage] = useState('');
  const [detectedBarcode, setDetectedBarcode] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  const scannerRef = useRef(null);
  const isStoppingRef = useRef(false);
  const readerId = 'barcode-reader-view';

  // Stop camera helper
  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Camera stop warning:', err);
      } finally {
        isStoppingRef.current = false;
      }
    }
  };

  // Perform backend medicine lookup by barcode
  const lookupMedicine = async (barcode) => {
    if (!barcode || !barcode.trim()) return;
    const cleanCode = barcode.trim();
    setLookupLoading(true);
    try {
      const res = await apiClient.get(`/medicines/barcode/${cleanCode}`);
      if (res.data?.data) {
        toast.success(`Found "${res.data.data.name}" in central catalog!`);
        await stopCamera();
        onMedicineFound(res.data.data);
      } else {
        setCameraState('not_found');
      }
    } catch (err) {
      console.warn('Barcode not found in catalog', err);
      setCameraState('not_found');
    } finally {
      setLookupLoading(false);
    }
  };

  // Initialize and start scanner
  const startScanner = async (cameraId) => {
    try {
      setCameraState('initializing');
      setErrorMessage('');

      await stopCamera();

      const html5QrCode = new Html5Qrcode(readerId, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333333,
      };

      const cameraConstraint = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConstraint,
        config,
        async (decodedText) => {
          // Success callback
          setDetectedBarcode(decodedText);
          setCameraState('detected');
          await stopCamera();
          lookupMedicine(decodedText);
        },
        () => {
          // Frame scan callback (ignore scanning frames)
        }
      );

      setCameraState('scanning');
    } catch (err) {
      console.error('Camera start error:', err);
      let msg = 'Failed to access camera. Please check camera permissions.';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings or use manual barcode entry below.';
      } else if (err?.name === 'NotFoundError' || err?.message?.includes('No device')) {
        msg = 'No camera found on this device. You can enter the barcode manually below.';
      }
      setErrorMessage(msg);
      setCameraState('error');
    }
  };

  // On Modal Open: Detect available cameras and start
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const init = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (mounted && devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCamera = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          const targetId = backCamera ? backCamera.id : devices[0].id;
          setSelectedCameraId(targetId);
          startScanner(targetId);
        } else if (mounted) {
          startScanner(null);
        }
      } catch (err) {
        if (mounted) {
          console.warn('Error discovering camera devices, falling back to facingMode:', err);
          startScanner(null);
        }
      }
    };

    // Small delay to ensure modal DOM container is mounted
    const timer = setTimeout(() => {
      init();
    }, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) {
      toast.warning('Please enter a barcode number');
      return;
    }
    setDetectedBarcode(manualBarcode.trim());
    lookupMedicine(manualBarcode.trim());
  };

  const handleRetryScan = () => {
    setDetectedBarcode('');
    setCameraState('initializing');
    startScanner(selectedCameraId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950 p-6 sm:p-7 shadow-2xl space-y-5 text-white animate-scale-in my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <FiCamera size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Scan Medicine Barcode</h3>
              <p className="text-xs text-primary-200/70">
                Point your camera at the barcode on the medicine package
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await stopCamera();
              onClose();
            }}
            className="rounded-xl p-2 text-primary-200/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Viewfinder / Camera Area */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border-2 border-white/15 bg-slate-900 aspect-4/3 flex flex-col items-center justify-center min-h-[240px]">
            {/* HTML5 QR/Barcode Video Mount */}
            <div id={readerId} className="w-full h-full overflow-hidden" />

            {/* Overlays during scanning */}
            {cameraState === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Aiming Reticle */}
                <div className="relative w-64 h-36 rounded-xl border-2 border-cyan-400/80 bg-cyan-400/5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-cyan-300" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-cyan-300" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-cyan-300" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-cyan-300" />

                  {/* Animated laser scanning line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-4 text-[11px] font-semibold text-cyan-200 bg-slate-950/80 px-3 py-1 rounded-full border border-cyan-500/30 backdrop-blur-sm">
                  Align medicine barcode inside the frame (EAN-13, UPC, Code 128)
                </p>
              </div>
            )}

            {/* Initializing Spinner */}
            {cameraState === 'initializing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 space-y-3 z-10">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-cyan-400 border-t-transparent" />
                <p className="text-xs text-primary-200">Requesting camera access...</p>
              </div>
            )}

            {/* Barcode Detected State */}
            {cameraState === 'detected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 space-y-3 z-10 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <FiCheckCircle size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-200">Barcode Detected!</h4>
                  <p className="font-mono text-base font-black text-white mt-1">{detectedBarcode}</p>
                </div>
                {lookupLoading && (
                  <p className="text-xs text-cyan-300 animate-pulse flex items-center gap-2">
                    <FiRefreshCw className="animate-spin" size={13} /> Searching central medicine database...
                  </p>
                )}
              </div>
            )}

            {/* Not Found State */}
            {cameraState === 'not_found' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 space-y-3 z-10 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                  <FiAlertCircle size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-200">Medicine Not Found</h4>
                  {detectedBarcode && (
                    <p className="font-mono text-xs text-primary-200/80 mt-1">Scanned Barcode: {detectedBarcode}</p>
                  )}
                  <p className="text-xs text-amber-100/90 max-w-sm mt-2 font-medium leading-relaxed">
                    Medicine information was not found for this barcode. Please enter the details manually.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRetryScan}
                    className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FiRefreshCw size={13} /> Scan Again
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await stopCamera();
                      onClose();
                      if (onManualSearch) onManualSearch(detectedBarcode);
                    }}
                    className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                  >
                    <FiSearch size={13} /> Enter Details Manually
                  </button>
                </div>
              </div>
            )}


            {/* Camera Error State */}
            {cameraState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 space-y-3 z-10 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                  <FiAlertCircle size={28} />
                </div>
                <h4 className="text-sm font-bold text-rose-200">Camera Unavailable</h4>
                <p className="text-xs text-primary-200/80 max-w-sm">{errorMessage}</p>
                <button
                  type="button"
                  onClick={handleRetryScan}
                  className="btn-secondary py-2 px-4 text-xs font-semibold mt-2 flex items-center gap-1.5"
                >
                  <FiRefreshCw size={13} /> Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Camera switcher (if multi-camera) */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between text-xs text-primary-200/70 px-1">
              <span>Switch Camera:</span>
              <select
                value={selectedCameraId || ''}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startScanner(e.target.value);
                }}
                className="rounded-xl border border-white/15 bg-slate-900 px-3 py-1 text-xs text-white focus:outline-none"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Fallback */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <label className="block text-xs font-bold text-primary-100">
            Or Enter Barcode Number Manually:
          </label>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="e.g. 8901088012345"
                className="w-full rounded-2xl border border-white/15 bg-slate-900 py-2.5 px-4 text-xs sm:text-sm text-white placeholder:text-primary-300/50 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading || !manualBarcode.trim()}
              className="btn-primary py-2.5 px-5 text-xs font-bold shrink-0 disabled:opacity-40"
            >
              {lookupLoading ? 'Searching...' : 'Lookup'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-primary-300/60">
          <span>Camera frames are processed locally on your device for privacy.</span>
          <button
            type="button"
            onClick={async () => {
              await stopCamera();
              onClose();
            }}
            className="text-primary-200/80 hover:text-white underline font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
