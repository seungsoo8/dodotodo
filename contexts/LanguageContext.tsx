'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { translations, Lang, Translations } from '@/lib/i18n/translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LANG_KEY = 'dodotodo_lang';

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ko',
  setLang: () => {},
  t: translations.ko,
});

function detectDeviceLang(): Lang {
  if (typeof navigator === 'undefined') return 'ko';
  const nav = navigator.language || (navigator as any).userLanguage || 'ko';
  return nav.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

async function loadSavedLang(): Promise<Lang | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: LANG_KEY });
      return (value as Lang) || null;
    } else {
      const val = localStorage.getItem(LANG_KEY);
      return (val as Lang) || null;
    }
  } catch {
    return null;
  }
}

async function saveLang(lang: Lang): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: LANG_KEY, value: lang });
    } else {
      localStorage.setItem(LANG_KEY, lang);
    }
  } catch {}
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ko');

  useEffect(() => {
    loadSavedLang().then(saved => {
      if (saved) {
        setLangState(saved);
      } else {
        setLangState(detectDeviceLang());
      }
    });
  }, []);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    saveLang(newLang);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
