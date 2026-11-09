import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { enIN, kn } from "date-fns/locale";
import { STRINGS } from "./strings";

const STORAGE_KEY = "alk-lang";
const DATE_LOCALES = { en: enIN, kn };

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "kn") return saved;
  } catch {
    // storage blocked, fall through to browser language
  }
  return navigator.language?.toLowerCase().startsWith("kn") ? "kn" : "en";
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = STRINGS[lang].meta.title;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // not persisted, still works for this visit
    }
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t: STRINGS[lang], dateLocale: DATE_LOCALES[lang] }),
    [lang]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LanguageContext);
}
