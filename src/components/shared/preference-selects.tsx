"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Coins, Languages } from "@/lib/icons";
import {
  CURRENCIES,
  currencyName,
  LOCALES,
  type Locale,
} from "@/lib/preferences";
import { cn } from "@/lib/utils";

/** Each language shown in its own language — the standard for pickers. */
const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
};

/** Best-effort currency symbol ("$", "€"…) from Intl, or "" when unavailable. */
function currencySymbol(code: string, locale: string): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? "";
  } catch {
    return "";
  }
}

/** Full option label, e.g. "US Dollar (USD) · $". */
function currencyOptionLabel(code: string, locale: string): string {
  const symbol = currencySymbol(code, locale);
  const suffix = symbol && symbol !== code ? ` · ${symbol}` : "";
  return `${currencyName(code, locale)} (${code})${suffix}`;
}

/** Compact trigger label, e.g. "USD · $". */
function currencyTriggerLabel(code: string, locale: string): string {
  const symbol = currencySymbol(code, locale);
  if (!symbol || symbol === code) return code;
  return `${code} · ${symbol}`;
}

interface LanguageSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Header-style ghost trigger: borderless, icon + uppercase code. */
  ghost?: boolean;
  /** Hide the leading Languages icon (rows that already show one). */
  withIcon?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function LanguageSelect({
  value,
  onValueChange,
  ghost = false,
  withIcon = true,
  className,
  ariaLabel,
}: LanguageSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "justify-between",
          ghost &&
            "h-8 w-auto gap-1.5 rounded-lg border-0 bg-none px-2 shadow-none hover:bg-accent focus:ring-0",
          className,
        )}
      >
        {withIcon ? (
          <Languages
            className={ghost ? "size-4" : "size-4 text-muted-foreground"}
          />
        ) : null}
        {ghost ? (
          <span className="hidden text-xs font-semibold uppercase tracking-wider sm:inline">
            {value.toUpperCase()}
          </span>
        ) : (
          <SelectValue
            placeholder={LOCALE_LABELS[value as Locale] ?? value}
            options={LOCALES.map((locale) => ({
              value: locale,
              label: LOCALE_LABELS[locale],
            }))}
          />
        )}
      </SelectTrigger>
      <SelectContent align={ghost ? "end" : undefined}>
        {LOCALES.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Compact trigger: short "USD · $" label without an icon (preference rows). */
  compact?: boolean;
  /** Hide the leading Coins icon (rows that already show one). */
  withIcon?: boolean;
  /** Locale used to render currency names and symbols. */
  displayLocale?: string;
  className?: string;
  ariaLabel?: string;
}

export function CurrencySelect({
  value,
  onValueChange,
  compact = false,
  withIcon = true,
  displayLocale = "en",
  className,
  ariaLabel,
}: CurrencySelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "justify-between",
          compact ? "h-9 w-auto max-w-44" : "w-full",
          className,
        )}
      >
        {withIcon ? <Coins className="size-4 text-muted-foreground" /> : null}
        {compact ? (
          <span className="truncate text-sm font-medium">
            {currencyTriggerLabel(value, displayLocale)}
          </span>
        ) : (
          <SelectValue
            placeholder={currencyOptionLabel(value, displayLocale)}
            options={CURRENCIES.map((currency) => ({
              value: currency,
              label: currencyOptionLabel(currency, displayLocale),
            }))}
          />
        )}
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency} value={currency}>
            {currencyOptionLabel(currency, displayLocale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
