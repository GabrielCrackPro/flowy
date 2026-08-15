"use client";

import { useProfile } from "@hooks/useProfile";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getLocaleCookie,
  getLocaleStorage,
  normalizeLocale,
  setLocaleCookie,
  setLocaleStorage,
} from "@/lib/i18n";
import { setI18nLocale } from "@/lib/i18n/client";

export interface LocaleContextValue {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { profile, update: updateProfile } = useProfile();

  const [storedLocale, setStoredLocale] = useState(
    () => getLocaleStorage() ?? getLocaleCookie() ?? null,
  );

  const locale = useMemo(() => {
    const fromProfile = profile?.locale;
    if (storedLocale) return normalizeLocale(storedLocale);
    if (fromProfile) return normalizeLocale(fromProfile);
    return "es";
  }, [profile?.locale, storedLocale]);

  useEffect(() => {
    setI18nLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    async (newLocale: string) => {
      const normalized = normalizeLocale(newLocale);
      setLocaleStorage(normalized);
      setLocaleCookie(normalized);
      setStoredLocale(normalized);
      if (profile) {
        try {
          await updateProfile({ locale: normalized });
        } catch {
          // Silently fail — storage and cookie will keep the preference
        }
      }
    },
    [profile, updateProfile],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) {
    return { locale: "es", setLocale: async () => {} };
  }
  return context;
}
