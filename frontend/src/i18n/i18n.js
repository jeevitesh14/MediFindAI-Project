import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import te from './locales/te.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  te: { translation: te },
  hi: { translation: hi },
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('medifind_lang') || 'en' : 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'medifind_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
