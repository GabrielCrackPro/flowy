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
import { getLocaleCookie, normalizeLocale, setLocaleCookie } from "@/lib/i18n";
import { setI18nLocale } from "@/lib/i18n/client";

export interface LocaleContextValue {
  locale: string;
  setLocale: (locale: string) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { profile, update: updateProfile } = useProfile();

  const [cookieLocale] = useState(getLocaleCookie);

  const locale = useMemo(() => {
    const fromProfile = profile?.locale;
    if (fromProfile) return normalizeLocale(fromProfile);
    if (cookieLocale) return normalizeLocale(cookieLocale);
    return "es";
  }, [profile?.locale, cookieLocale]);

  useEffect(() => {
    setI18nLocale(locale);
  }, [locale]);

  const setLocale = useCallback(
    async (newLocale: string) => {
      setLocaleCookie(newLocale);
      if (profile) {
        try {
          await updateProfile({ locale: newLocale });
        } catch {
          // Silently fail — cookie will keep the preference
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
    return { locale: "es", setLocale: () => {} };
  }
  return context;
}
