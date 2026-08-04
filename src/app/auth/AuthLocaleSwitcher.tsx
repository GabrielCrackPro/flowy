"use client";

import { useLocaleContext } from "@/context/LocaleContext";

export function AuthLocaleSwitcher() {
  const { locale, setLocale } = useLocaleContext();

  const nextLocale = locale === "es" ? "en" : "es";
  const label = locale === "es" ? "EN" : "ES";

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      aria-label={locale === "es" ? "Switch to English" : "Cambiar a español"}
    >
      {label}
    </button>
  );
}
