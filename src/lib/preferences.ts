/**
 * User preference options shared across the app — the single source of truth
 * for the sign-up form, the profile settings form, and the auth schema.
 * Kept out of components so every surface validates against the same sets.
 */

export const CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "MXN",
  "ARS",
  "CLP",
  "COP",
  "BRL",
  "CAD",
  "AUD",
  "CHF",
  "JPY",
  "PEN",
  "UYU",
] as const;

export type Currency = (typeof CURRENCIES)[number];

export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Region subtags (lowercase) → default currency, limited to CURRENCIES. */
const REGION_CURRENCY: Record<string, Currency> = {
  us: "USD",
  gb: "GBP",
  mx: "MXN",
  ar: "ARS",
  cl: "CLP",
  co: "COP",
  br: "BRL",
  ca: "CAD",
  au: "AUD",
  ch: "CHF",
  jp: "JPY",
  pe: "PEN",
  uy: "UYU",
};

/** EU regions default to the euro. */
const EURO_REGIONS = new Set([
  "at",
  "be",
  "cy",
  "ee",
  "fi",
  "fr",
  "de",
  "gr",
  "ie",
  "it",
  "lv",
  "lt",
  "lu",
  "mt",
  "nl",
  "pt",
  "sk",
  "si",
  "es",
]);

export function currencyName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

export function languageName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

/**
 * Detect a sensible default currency from a language tag (e.g. "es-ES" → EUR,
 * "en-US" → USD). Falls back to USD when the region is unknown or missing.
 */
export function detectCurrency(locale: string): Currency {
  try {
    const { region, language } = new Intl.Locale(locale);
    const area = (region ?? language).toLowerCase();
    const fromRegion = REGION_CURRENCY[area];
    if (fromRegion) return fromRegion;
    if (EURO_REGIONS.has(area)) return "EUR";
  } catch {
    // Unparseable tag — fall through to the default.
  }
  return "USD";
}
