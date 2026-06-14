import { useState, useEffect } from 'react';
import { translations, type Language } from '../lib/i18n';

export function useLanguage() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = translations[lang];

  return { lang, setLang, t };
}
