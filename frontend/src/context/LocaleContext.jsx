import { createContext, useContext, useState } from "react";
import { translations } from "../data/translations.js";

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem("campuspilot_lang") || "en";
  });

  const t = translations[locale] || translations.en;

  const changeLocale = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem("campuspilot_lang", newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, t, changeLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within a LocaleProvider");
  return context;
}
