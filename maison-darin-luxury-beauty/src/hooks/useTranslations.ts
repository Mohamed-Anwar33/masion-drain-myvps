import { useState, useEffect } from 'react';
import { translations } from '@/data/translations';

type Language = 'en' | 'ar';
type TranslationKey = keyof typeof translations.en;

export function useTranslations() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lang') as Language;
    return saved || 'en';
  });

  useEffect(() => {
    // Update document attributes when language changes
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
    localStorage.setItem('lang', currentLang);

    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('lang:change', { detail: currentLang }));
  }, [currentLang]);

  const t = (key: string, section?: string): string => {
    try {
      const keys = section ? `${section}.${key}` : key;
      const keyPath = keys.split('.');
      
      let value: any = translations[currentLang];
      for (const k of keyPath) {
        value = value?.[k];
      }
      
      return value || key; // Fallback to key if translation not found
    } catch {
      return key;
    }
  };

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
  };

  return {
    currentLang,
    changeLanguage,
    t,
    isRTL: currentLang === 'ar',
  };
}

// Specialized hook for admin translations
export function useAdminTranslations() {
  const { currentLang, changeLanguage, isRTL } = useTranslations();
  
  const t = (key: string, section: string = 'admin'): string => {
    try {
      const keyPath = `${section}.${key}`.split('.');
      let value: any = translations[currentLang];
      
      for (const k of keyPath) {
        value = value?.[k];
      }
      
      return value || key;
    } catch {
      return key;
    }
  };

  return {
    currentLang,
    changeLanguage,
    t,
    isRTL,
  };
}

// Hook for auth-specific translations
export function useAuthTranslations() {
  const { currentLang, changeLanguage, isRTL } = useTranslations();
  
  const t = (key: string): string => {
    try {
      const value = translations[currentLang]?.auth?.[key as keyof typeof translations.en.auth];
      return value || key;
    } catch {
      return key;
    }
  };

  return {
    currentLang,
    changeLanguage,
    t,
    isRTL,
  };
}