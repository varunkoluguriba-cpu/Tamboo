import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t as translate, isRTL, type LangStrings } from '../i18n';

const LANG_KEY = 'tamboo-customer-lang';

interface LanguageContextValue {
  lang: string;
  setLang: (lang: string) => void;
  t: LangStrings;
  rtl: boolean;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LANG_KEY);
      if (saved) setLangState(saved);
      setReady(true);
    })();
  }, []);

  const setLang = useCallback((next: string) => {
    setLangState(next);
    AsyncStorage.setItem(LANG_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: translate(lang), rtl: isRTL(lang), ready }),
    [lang, setLang, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
