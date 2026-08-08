"use client";

import { EntityAudit, Icon, Skeleton } from "@components/shared";
import { Badge, Button, Card } from "@components/ui";
import { useDateLocale } from "@hooks/useDateLocale";
import { cn, formatCurrency } from "@lib/utils";
import { useTranslation } from "react-i18next";
import { CARD_SHELL } from "@/components/shared/card-tokens";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import {
  Calendar,
  CreditCard,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
} from "@/lib/icons";
import type { Subscription } from "@/types/Subscription";
import {
  formatSubscriptionNextPayment,
  getSubscriptionNextPaymentInfo,
  subscriptionAmount,
  subscriptionMonthlyEquivalent,
} from "@/utils/subscriptions";

interface SubscriptionCardProps {
  subscription: Subscription;
  compact?: boolean;
  onEdit?: (subscription: Subscription) => void;
  onDelete?: (subscription: Subscription) => void;
  onQuickPayment?: (subscription: Subscription) => void;
  className?: string;
}

const NEXT_PAYMENT_TONE_CLASSES = {
  default: "text-muted-foreground",
  warning: "text-warning",
  danger: "text-destructive",
} as const;

export function SubscriptionCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <Card
      className={cn(
        CARD_SHELL,
        // Keep the shell's look but stay inert on hover
        "hover:-translate-y-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
      )}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton variant="rounded" className="size-10 rounded-xl" />
            <div className="min-w-0 space-y-1.5">
              <Skeleton
                className={cn("h-3.5", index % 2 === 0 ? "w-28" : "w-24")}
              />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton variant="rounded" className="h-5 w-14 shrink-0" />
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="shrink-0 space-y-1.5">
            <Skeleton className="ml-auto h-3 w-16" />
            <Skeleton className="ml-auto h-3.5 w-24" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/30 pt-3">
          <Skeleton className="h-3 w-1/3" />
          <div className="flex items-center gap-1.5">
            <Skeleton variant="rounded" className="size-7" />
            <Skeleton variant="rounded" className="size-7" />
            <Skeleton variant="rounded" className="size-7" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SubscriptionCard({
  subscription,
  compact = false,
  onEdit,
  onDelete,
  onQuickPayment,
  className,
}: SubscriptionCardProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { locale } = useLocaleContext();
  const currency = profile?.currency ?? "USD";
  const dateLocale = useDateLocale(locale);

  const amount = subscriptionAmount(subscription);
  const monthly = subscriptionMonthlyEquivalent(subscription);
  const nextPayment = getSubscriptionNextPaymentInfo(
    subscription.nextPayment,
    locale,
  );
  const hasActions = Boolean(onEdit || onDelete);

  const merchant = subscription.merchant ?? t("profile.noMerchant");
  const cycleLabel = subscription.billingCycle
    ? t(`subscriptions.cycles.${subscription.billingCycle}`)
    : null;

  const shellClass = cn(
    CARD_SHELL,
    subscription.active
      ? "border-violet-500/25 bg-gradient-to-br from-violet-500/[0.06] via-card to-card"
      : "border-border/30 opacity-60 hover:-translate-y-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
    className,
  );

  const statusBadge = (
    <Badge
      variant={subscription.active ? "default" : "secondary"}
      className={cn(
        "shrink-0",
        subscription.active &&
          "border-0 bg-gradient-to-r from-violet-500 to-violet-600 text-white",
      )}
    >
      {subscription.active ? t("profile.active") : t("profile.inactive")}
    </Badge>
  );

  const nextPaymentLabel = nextPayment && (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        NEXT_PAYMENT_TONE_CLASSES[nextPayment.tone],
      )}
      title={
        subscription.nextPayment
          ? formatSubscriptionNextPayment(subscription.nextPayment, dateLocale)
          : undefined
      }
    >
      <Icon icon={Calendar} className="size-3" />
      {nextPayment.label}
    </span>
  );

  const actions = hasActions && (
    <div className="flex shrink-0 items-center gap-1.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
      {onQuickPayment && subscription.active && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t("subscriptions.quickPayment")}
          onClick={() => onQuickPayment(subscription)}
          className="size-7 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <Icon icon={Plus} className="size-3.5" />
        </Button>
      )}
      {onEdit && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t("common.edit")}
          onClick={() => onEdit(subscription)}
          className="size-7"
        >
          <Icon icon={Pencil} className="size-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t("common.delete")}
          onClick={() => onDelete(subscription)}
          className="size-7 text-destructive hover:text-destructive"
        >
          <Icon icon={Trash2} className="size-3.5" />
        </Button>
      )}
    </div>
  );

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t border-border/30 px-5 py-3.5 transition-colors duration-200 hover:bg-muted/40 sm:px-6",
          !subscription.active && "opacity-60",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110",
              subscription.active
                ? "bg-gradient-to-br from-violet-500/20 to-violet-500/10 text-violet-600 dark:from-violet-500/30 dark:to-violet-500/20 dark:text-violet-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon icon={CreditCard} className="size-4" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate text-sm font-medium text-foreground">
              {merchant}
            </h3>

            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatCurrency(amount, locale, currency)}
              </span>

              {cycleLabel && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="capitalize">{cycleLabel}</span>
                </>
              )}

              {nextPaymentLabel && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  {nextPaymentLabel}
                </>
              )}
            </div>
          </div>
        </div>

        {statusBadge}
      </div>
    );
  }

  return (
    <Card className={shellClass}>
      {subscription.active && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-violet-400 to-violet-500" />
      )}

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-[1.04]",
                subscription.active
                  ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon icon={CreditCard} className="size-4.5" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold tracking-tight">
                {merchant}
              </h3>
              {cycleLabel && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon icon={Repeat2} className="size-3" />
                  {cycleLabel}
                </p>
              )}
            </div>
          </div>

          {statusBadge}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {t("subscriptions.totalMonthly")}
            </p>
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {formatCurrency(amount, locale, currency)}
            </p>
            {subscription.active && subscription.billingCycle !== "MONTHLY" && (
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground/60">
                ≈ {formatCurrency(monthly, locale, currency)}/
                {t("subscriptions.cycles.MONTHLY").toLowerCase()}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">
              {t("subscriptions.nextPayment")}
            </p>
            {nextPayment ? (
              <div className="mt-0.5 space-y-0.5">
                <p
                  className={cn(
                    "flex items-center justify-end gap-1.5 text-sm font-medium",
                    NEXT_PAYMENT_TONE_CLASSES[nextPayment.tone],
                  )}
                >
                  <Icon icon={Calendar} className="size-3.5" />
                  {nextPayment.label}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {formatSubscriptionNextPayment(nextPayment.date, dateLocale)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("subscriptions.noNextPayment")}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/30 pt-3">
          <EntityAudit
            createdAt={subscription.createdAt}
            createdBy={subscription.user}
            updatedAt={subscription.updatedAt}
            updatedBy={subscription.updatedByProfile}
            className="min-w-0"
          />
          {actions}
        </div>
      </div>
    </Card>
  );
}
