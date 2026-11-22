import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STRINGS, type Lang, type StringKey } from './strings';

interface I18n {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  num: (n: number, digits?: number) => string;
}

const Ctx = createContext<I18n | null>(null);
const KEY = 'mawrid.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('ar') ? 'ar' : 'en';
}

export function I18nProvider({ children, lang: forced }: { children: ReactNode; lang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(forced ?? initialLang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    // Western digits in both languages: they are standard on WASH forms in Gaza and avoid mixed-digit confusion.
    const locale = lang === 'ar' ? 'ar-u-nu-latn' : 'en';
    const fmts = new Map<number, Intl.NumberFormat>();
    return {
      lang,
      dir,
      setLang,
      t: (key, vars) => {
        let s: string = (STRINGS[lang] as Record<string, string>)[key] ?? STRINGS.en[key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
        return s;
      },
      num: (n, digits = 0) => {
        if (!Number.isFinite(n)) return '∞';
        if (!fmts.has(digits))
          fmts.set(digits, new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }));
        return fmts.get(digits)!.format(n);
      },
    };
  }, [lang, dir, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
