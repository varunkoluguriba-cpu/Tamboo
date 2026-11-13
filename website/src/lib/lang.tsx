import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ENABLED_LANGS, LANGS, isRTL, t as translate, type LangStrings } from '../../../customer-app/src/i18n';

// The website uses the customer app's own string file, so every screen reads the same in
// English, Telugu, Hindi and Urdu on both.
const KEY = 'tamboo-web-lang';
type Ctx = { lang: string; setLang: (l: string) => void; t: LangStrings; rtl: boolean };
const LangContext = createContext<Ctx | null>(null);

function initialLang(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && ENABLED_LANGS.includes(saved)) return saved;
  } catch { /* ignore */ }
  const nav = (navigator.language || 'en').slice(0, 2);
  return ENABLED_LANGS.includes(nav) ? nav : 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(initialLang);
  const setLang = (l: string) => { setLangState(l); try { localStorage.setItem(KEY, l); } catch { /* ignore */ } };
  const value = useMemo(() => ({ lang, setLang, t: translate(lang) as LangStrings, rtl: isRTL(lang) }), [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = value.rtl ? 'rtl' : 'ltr';
  }, [lang, value.rtl]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const c = useContext(LangContext);
  if (!c) throw new Error('useLang outside LangProvider');
  return c;
}
export { LANGS };
export type { LangStrings };
