"use client";

import {
  AnimatedNumber,
  CardSkeleton,
  EmptyState,
  Icon,
  SectionCard,
} from "@components/shared";
import { formatCurrency } from "@lib/utils";
import { useTranslation } from "react-i18next";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import { parseDateOnly } from "@/lib/date-only";
import { CalendarClock } from "@/lib/icons";
import type { Subscription } from "@/types/Subscription";

interface UpcomingPaymentsCardProps {
  data: Subscription[];
  error: string | null;
  loading: boolean;
}

function hasNextPayment(
  subscription: Subscription,
): subscription is Subscription & { nextPayment: string } {
  return Boolean(subscription.active && subscription.nextPayment);
}

export function UpcomingPaymentsCard({
  data,
  error: _error,
  loading,
}: UpcomingPaymentsCardProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { locale } = useLocaleContext();
  const currency = profile?.currency ?? "USD";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const now = new Date();
  const upcoming = data
    .filter(hasNextPayment)
    .sort(
      (a, b) =>
        (parseDateOnly(a.nextPayment) ?? new Date(a.nextPayment)).getTime() -
        (parseDateOnly(b.nextPayment) ?? new Date(b.nextPayment)).getTime(),
    )
    .slice(0, 5);

  return (
    <SectionCard
      title={t("dashboard.upcomingPayments")}
      description={t("dashboard.upcomingPaymentsDesc")}
    >
      {loading && data.length === 0 ? (
        <CardSkeleton variant="row" count={3} />
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={<Icon icon={CalendarClock} className="size-5" />}
          title={t("dashboard.noUpcomingPayments")}
        />
      ) : (
        <div>
          {upcoming.map((sub) => {
            const nextDate =
              parseDateOnly(sub.nextPayment) ?? new Date(sub.nextPayment);
            const diffDays = Math.ceil(
              (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between border-t border-border/30 px-6 py-3.5 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {sub.merchant ?? t("profile.noMerchant")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sub.amount != null ? (
                      <AnimatedNumber
                        value={sub.amount}
                        formatter={(v) => formatCurrency(v, locale, currency)}
                      />
                    ) : (
                      "—"
                    )}
                    {sub.billingCycle && ` · ${sub.billingCycle}`}
                  </p>
                </div>

                <span
                  className={`shrink-0 text-xs font-medium ${
                    diffDays <= 3
                      ? "text-destructive"
                      : diffDays <= 7
                        ? "text-amber-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {diffDays <= 0
                    ? rtf.format(0, "day")
                    : rtf.format(diffDays, "day")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
