import i18next from "i18next";
import { resources } from "./resources";
import type { Locale } from "./types";

export type {
  AppTranslationMessages,
  AuthTranslationMessages,
  Locale,
  TranslationMessages,
} from "./types";

export const locales = ["es", "en"] as const;
export const defaultLocale: Locale = "es";

export const LOCALE_COOKIE = "flowy-locale";
export const LOCALE_STORAGE_KEY = "flowy-locale";

export function setLocaleStorage(locale: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
  } catch {
    // Ignore: storage can be unavailable (private mode, disabled storage).
  }
}

export function getLocaleStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    // Ignore: storage can be unavailable (private mode, disabled storage).
  }
  return null;
}

export function setLocaleCookie(locale: string) {
  if (typeof document === "undefined") return;

  if ("cookieStore" in window) {
    void window.cookieStore.set({
      name: LOCALE_COOKIE,
      value: locale,
      path: "/",
      expires: Date.now() + 31536000 * 1000,
    });
    return;
  }

  /* biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not available in every supported browser. */
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000`;
}

export function getLocaleCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`),
  );
  return match ? match[1] : null;
}

export function normalizeLocale(locale?: string): Locale {
  if (locale?.startsWith("es")) return "es";
  if (locale?.startsWith("en")) return "en";
  return defaultLocale;
}

export { resources };

export async function getServerT(locale?: string, defaultNS?: string) {
  const instance = i18next.createInstance();
  const normalizedLocale = normalizeLocale(locale);
  await instance.init({
    resources,
    lng: normalizedLocale,
    fallbackLng: defaultLocale,
    ns: ["app", "auth"],
    defaultNS: defaultNS || "app",
    interpolation: { escapeValue: false },
  });
  return instance.t.bind(instance);
}
