import { FiMic, FiMicOff } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import useVoiceSearch from '../../hooks/useVoiceSearch';

export default function VoiceSearchButton({
  onVoiceResult,
  disabled = false,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  lang,
}) {
  const { t } = useTranslation();
  const { isListening, isSupported, startListening, stopListening } = useVoiceSearch({
    lang,
    onResult: (spokenText) => {
      if (onVoiceResult) {
        onVoiceResult(spokenText);
      }
    },
  });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={
          isListening
            ? t('voice.clickToCancel', 'Listening... Click to stop')
            : isSupported
            ? t('voice.buttonLabel', 'Search medicine with voice')
            : t('voice.notSupported', 'Voice search not supported')
        }
        title={
          isListening
            ? t('voice.clickToCancel', 'Listening... Click to stop')
            : isSupported
            ? t('voice.buttonLabel', 'Speak medicine name (e.g. "Paracetamol")')
            : t('voice.notSupported', 'Voice search is not supported in this browser')
        }
        className={`relative inline-flex items-center justify-center rounded-xl p-2 sm:p-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
          isListening
            ? 'bg-rose-500/20 text-rose-400 border border-rose-400/50 shadow-lg shadow-rose-500/30 animate-pulse'
            : isSupported
            ? 'text-cyan-400 hover:text-cyan-300 hover:bg-white/10 active:scale-95 border border-transparent hover:border-cyan-400/30'
            : 'text-primary-200/40 cursor-not-allowed border border-transparent'
        } ${className}`}
      >
        {isListening ? (
          <div className="flex items-center gap-1.5">
            {/* Animated soundwave bars */}
            <span className="flex items-center gap-0.5 h-4 px-0.5">
              <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <FiMicOff size={iconSizes[size] || 18} className="shrink-0 animate-pulse" />
          </div>
        ) : (
          <FiMic size={iconSizes[size] || 18} className="shrink-0" />
        )}
      </button>

      {/* Floating listening feedback pill */}
      {isListening && (
        <span
          role="status"
          aria-live="polite"
          className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-950/90 border border-rose-500/50 px-3 py-0.5 text-[11px] font-bold text-rose-200 shadow-xl backdrop-blur-md animate-fade-in z-50 pointer-events-none"
        >
          {t('voice.listening', 'Listening... speak medicine name now')}
        </span>
      )}
    </div>
  );
}
