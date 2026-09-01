import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
];

export default function LanguageSelector({ className = '' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLangCode = i18n.language ? i18n.language.split('-')[0] : 'en';
  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  const handleSelectLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('medifind_lang', langCode);
    }
    setOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-slate-800 hover:border-cyan-500/40 focus:outline-none shadow-sm"
        aria-expanded={open}
        aria-haspopup="true"
        title="Select Language"
      >
        <FiGlobe className="text-cyan-400 shrink-0" size={14} />
        <span className="text-xs font-medium text-slate-100">{currentLang.label}</span>
        <FiChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-36 origin-top-right rounded-2xl border border-slate-800 bg-slate-950/98 p-1.5 shadow-2xl backdrop-blur-2xl animate-fade-in z-50 divide-y divide-slate-800/80"
          role="menu"
        >
          <div className="py-1 space-y-0.5">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLangCode;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <span>{lang.label}</span>
                  {isSelected && <FiCheck size={14} className="text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
