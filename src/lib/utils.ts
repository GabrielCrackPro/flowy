import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Profile } from "@/types/Profile";
import type { ProfileIdentity } from "@/types/ProfileIdentity";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** True on macOS / iOS devices (used to pick ⌘ vs Ctrl in shortcut hints). */
export function isMacPlatform(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
  );
}

export function getUserInitials(
  profile: Profile | ProfileIdentity | null,
): string {
  const source = profile?.name || profile?.email;

  if (!source) {
    return "U";
  }

  return source
    .split(/[ ._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("");
}

export function formatCurrency(
  value: number | bigint | string | null | undefined,
  locale = "es-ES",
  currency = "USD",
): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num))
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(0);
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    num,
  );
}

export function formatPercentage(
  value: number | string | null | undefined,
  locale = "es-ES",
  fractionDigits = 1,
): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num))
    return new Intl.NumberFormat(locale, { style: "percent" }).format(0);
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(num / 100);
}

export function formatCount(
  value: number | string | null | undefined,
  locale = "es-ES",
): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat(locale).format(Math.round(num));
}
