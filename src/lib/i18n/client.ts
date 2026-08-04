"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLocale, getLocaleCookie, normalizeLocale } from "./index";
import { resources } from "./resources";

export const i18n = i18next.createInstance();

// Get initial locale from cookie or use default
const initialLocale = normalizeLocale(getLocaleCookie() || defaultLocale);

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: defaultLocale,
  ns: ["app", "auth"],
  defaultNS: "app",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function setI18nLocale(locale: string) {
  const normalized = normalizeLocale(locale);
  if (i18n.language !== normalized) {
    void i18n.changeLanguage(normalized);
  }
}
