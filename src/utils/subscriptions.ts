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

export type SubscriptionNextPaymentTone = "default" | "warning" | "danger";

interface SubscriptionNextPaymentInfo {
  label: string;
  tone: SubscriptionNextPaymentTone;
  date: Date;
}

export function getSubscriptionNextPaymentInfo(
  nextPayment: string | null | undefined,
  locale: string,
): SubscriptionNextPaymentInfo | null {
  if (!nextPayment) return null;

  const date = parseDateOnly(nextPayment) ?? new Date(nextPayment);
  const diffDays = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const label = rtf.format(diffDays, "day");

  const tone: SubscriptionNextPaymentTone =
    diffDays <= 3 ? "danger" : diffDays <= 7 ? "warning" : "default";

  return { label, tone, date };
}
