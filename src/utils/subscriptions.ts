import type { Locale } from "date-fns";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/date-only";
import type { BillingCycle, Subscription } from "@/types/Subscription";

export const SUBSCRIPTION_MONTHLY_FACTORS: Record<BillingCycle, number> = {
  DAILY: 30.44,
  WEEKLY: 4.33,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12,
};

/** Maximum cycles to advance when computing the next billing date (safety limit). */
const MAX_ADVANCE_CYCLES = 120;

export function subscriptionAmount(
  subscription: Pick<Subscription, "amount">,
): number {
  const { amount } = subscription;
  return typeof amount === "number" ? amount : Number(amount) || 0;
}

export function subscriptionMonthlyEquivalent(
  subscription: Subscription,
): number {
  if (!subscription.active || !subscription.billingCycle) return 0;
  return (
    subscriptionAmount(subscription) *
    SUBSCRIPTION_MONTHLY_FACTORS[subscription.billingCycle]
  );
}

export function formatSubscriptionNextPayment(
  value: string | Date,
  dateLocale?: Locale,
): string {
  const date =
    typeof value === "string"
      ? (parseDateOnly(value) ?? new Date(value))
      : value;
  return format(date, "d MMM yyyy", { locale: dateLocale });
}

/**
 * Advances a date by one billing cycle interval.
 * Uses UTC date arithmetic to avoid DST boundary issues.
 */
function addBillingCycle(date: Date, billingCycle: BillingCycle): Date {
  const next = new Date(date);
  switch (billingCycle) {
    case "DAILY":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "WEEKLY":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "MONTHLY":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case "QUARTERLY":
      next.setUTCMonth(next.getUTCMonth() + 3);
      break;
    case "YEARLY":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
  }
  return next;
}

/**
 * Advances the stored nextPayment date forward by billing cycle intervals
 * until it reaches today or the future. Returns the effective next billing date.
 * Falls back to the original date if billingCycle is missing or the subscription
 * is inactive.
 */
export function computeNextBillingDate(
  nextPayment: string | null | undefined,
  billingCycle: BillingCycle | null | undefined,
  active: boolean,
): Date | null {
  if (!nextPayment || !billingCycle || !active) {
    if (nextPayment) {
      return parseDateOnly(nextPayment) ?? new Date(nextPayment);
    }
    return null;
  }

  let date = parseDateOnly(nextPayment) ?? new Date(nextPayment);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cycles = 0;
  while (date < today && cycles < MAX_ADVANCE_CYCLES) {
    date = addBillingCycle(date, billingCycle);
    cycles++;
  }

  return date;
}

export type SubscriptionNextPaymentTone = "default" | "warning" | "danger";

export interface SubscriptionNextPaymentInfo {
  label: string;
  tone: SubscriptionNextPaymentTone;
  date: Date;
}

/**
 * Computes the effective next payment date (auto-advancing past cycles)
 * and returns a human-readable label with tone.
 */
export function getSubscriptionNextPaymentInfo(
  nextPayment: string | null | undefined,
  billingCycle: BillingCycle | null | undefined,
  active: boolean,
  locale: string,
): SubscriptionNextPaymentInfo | null {
  const effectiveDate = computeNextBillingDate(
    nextPayment,
    billingCycle,
    active,
  );

  if (!effectiveDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (effectiveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const tone: SubscriptionNextPaymentTone =
    diffDays <= 0
      ? "danger"
      : diffDays <= 3
        ? "danger"
        : diffDays <= 7
          ? "warning"
          : "default";

  const label = rtf.format(diffDays, "day");

  return {
    label,
    tone,
    date: effectiveDate,
  };
}
