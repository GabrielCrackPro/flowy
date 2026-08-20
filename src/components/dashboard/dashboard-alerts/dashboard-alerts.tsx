"use client";

import { RelativeTime, Skeleton, useCardMotion } from "@components/shared";
import { useAuth } from "@hooks/useAuth";
import { useNotifications } from "@hooks/useNotifications";
import { useProfile } from "@hooks/useProfile";
import { cn } from "@lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown as ChevronDownData,
  ChevronUp as ChevronUpData,
} from "lucide";
import { MorphIcon } from "morphicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Info,
  Sparkles,
  TriangleAlert,
  X,
} from "@/lib/icons";
import { getAlertAction } from "@/utils/alerts";
import { getMonthName } from "@/utils/dashboard";

interface DashboardAlertsProps {
  month: number;
  year: number;
}

type Severity = "danger" | "warning" | "success" | "info";
type BarState = "danger" | "warning" | "neutral" | "clear";

interface AlertRow {
  id: string;
  variant: Severity;
  title: string;
  description?: string;
  createdAt: string;
  type: string;
  dataUrl?: string | null;
}

const severityStyles: Record<
  Severity,
  {
    icon: typeof TriangleAlert;
    tile: string;
    rail: string;
    chip: string;
    button: string;
  }
> = {
  danger: {
    icon: TriangleAlert,
    tile: "bg-gradient-to-br from-danger/25 to-danger/10 text-danger ring-danger/15",
    rail: "bg-gradient-to-b from-danger to-danger/30",
    chip: "bg-danger/10 text-danger ring-danger/15",
    button: "bg-danger/10 text-danger hover:bg-danger/15 ring-danger/15",
  },
  warning: {
    icon: TriangleAlert,
    tile: "bg-gradient-to-br from-warning/25 to-warning/10 text-warning ring-warning/15",
    rail: "bg-gradient-to-b from-warning to-warning/30",
    chip: "bg-warning/10 text-warning ring-warning/15",
    button: "bg-warning/10 text-warning hover:bg-warning/15 ring-warning/15",
  },
  success: {
    icon: CheckCircle2,
    tile: "bg-gradient-to-br from-success/25 to-success/10 text-success ring-success/15",
    rail: "bg-gradient-to-b from-success to-success/30",
    chip: "bg-success/10 text-success ring-success/15",
    button: "bg-success/10 text-success hover:bg-success/15 ring-success/15",
  },
  info: {
    icon: Info,
    tile: "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/15",
    rail: "bg-gradient-to-b from-primary to-primary/30",
    chip: "bg-primary/10 text-primary ring-primary/15",
    button: "bg-primary/10 text-primary hover:bg-primary/15 ring-primary/15",
  },
};

const barStyles: Record<
  BarState,
  {
    bar: string;
    border: string;
    accent: string;
    rail: string;
    tile: string;
    glow: string;
    hover: string;
    interactive: string;
    icon: typeof TriangleAlert;
  }
> = {
  danger: {
    bar: "bg-gradient-to-br from-danger/10 via-card/60 to-card/40",
    border: "border-danger/25",
    rail: "bg-gradient-to-b from-danger to-danger/30",
    accent: "from-danger/60 via-danger/30 to-transparent",
    tile: "bg-gradient-to-br from-danger/25 to-danger/10 text-danger ring-danger/15",
    glow: "bg-danger/20",
    hover: "hover:shadow-[0_8px_24px_rgba(239,68,68,0.16)]",
    interactive:
      "hover:bg-gradient-to-br hover:from-danger/10 hover:via-card/60 hover:to-card/40 dark:hover:bg-transparent aria-expanded:bg-gradient-to-br aria-expanded:from-danger/10 aria-expanded:via-card/60 aria-expanded:to-card/40",
    icon: TriangleAlert,
  },
  warning: {
    bar: "bg-gradient-to-br from-warning/10 via-card/60 to-card/40",
    border: "border-warning/25",
    rail: "bg-gradient-to-b from-warning to-warning/30",
    accent: "from-warning/60 via-warning/30 to-transparent",
    tile: "bg-gradient-to-br from-warning/25 to-warning/10 text-warning ring-warning/15",
    glow: "bg-warning/20",
    hover: "hover:shadow-[0_8px_24px_rgba(245,158,11,0.16)]",
    interactive:
      "hover:bg-gradient-to-br hover:from-warning/10 hover:via-card/60 hover:to-card/40 dark:hover:bg-transparent aria-expanded:bg-gradient-to-br aria-expanded:from-warning/10 aria-expanded:via-card/60 aria-expanded:to-card/40",
    icon: TriangleAlert,
  },
  neutral: {
    bar: "bg-gradient-to-br from-primary/8 via-card/60 to-card/40",
    border: "border-border/40",
    rail: "bg-gradient-to-b from-primary to-primary/30",
    accent: "from-primary/40 via-primary/20 to-transparent",
    tile: "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/15",
    glow: "bg-primary/15",
    hover: "hover:shadow-[0_8px_24px_rgba(37,99,235,0.12)]",
    interactive:
      "hover:bg-gradient-to-br hover:from-primary/8 hover:via-card/60 hover:to-card/40 dark:hover:bg-transparent aria-expanded:bg-gradient-to-br aria-expanded:from-primary/8 aria-expanded:via-card/60 aria-expanded:to-card/40",
    icon: Info,
  },
  clear: {
    bar: "bg-gradient-to-br from-success/8 via-card/60 to-card/40",
    border: "border-success/25",
    rail: "bg-gradient-to-b from-success to-success/30",
    accent: "from-success/50 via-success/25 to-transparent",
    tile: "bg-gradient-to-br from-success/25 to-success/10 text-success ring-success/15",
    glow: "bg-success/15",
    hover: "",
    interactive:
      "hover:bg-gradient-to-br hover:from-success/8 hover:via-card/60 hover:to-card/40 dark:hover:bg-transparent aria-expanded:bg-gradient-to-br aria-expanded:from-success/8 aria-expanded:via-card/60 aria-expanded:to-card/40",
    icon: CheckCircle2,
  },
};

export function DashboardAlerts({ month, year }: DashboardAlertsProps) {
  const { user } = useAuth();
  const {
    alerts: inboxAlerts,
    isLoading,
    dismiss,
  } = useNotifications(user?.id);
  const { profile } = useProfile();
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const { container, item } = useCardMotion();

  const locale = profile?.locale ?? "es-ES";

  const alerts: AlertRow[] = inboxAlerts
    .filter((alert) => !alert.readAt && !alert.resolvedAt)
    .map((alert) => ({
      id: alert.id,
      variant: alert.severity,
      title: alert.title,
      description: alert.description ?? undefined,
      createdAt: alert.createdAt,
      type: alert.type,
      dataUrl: alert.data?.url,
    }));

  const handleDismiss = (id: string) => {
    setDismissingIds((prev) => new Set(prev).add(id));
    dismiss(id).finally(() => {
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  };

  const handleDismissAll = () => {
    for (const alert of alerts) {
      void handleDismiss(alert.id);
    }
  };

  if (isLoading) {
    return (
      <section aria-label={t("alerts.barTitle")} className="space-y-0">
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-[var(--shadow-card)]"
        >
          <div className="size-10 shrink-0">
            <Skeleton variant="rounded" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-40">
              <Skeleton />
            </div>
            <div className="h-3 w-28">
              <Skeleton />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="h-5 w-8">
              <Skeleton variant="rounded" />
            </div>
            <div className="size-7">
              <Skeleton variant="circular" />
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

  const hasAlerts = alerts.length > 0;
  const isExpanded = hasAlerts && open;

  const state: BarState = !hasAlerts
    ? "clear"
    : alerts.some((alert) => alert.variant === "danger")
      ? "danger"
      : alerts.some((alert) => alert.variant === "warning")
        ? "warning"
        : "neutral";

  const bar = barStyles[state];
  const hasPulse = state === "danger" || state === "warning";

  const counts = { danger: 0, warning: 0, info: 0 };
  for (const alert of alerts) {
    if (alert.variant === "danger") counts.danger += 1;
    else if (alert.variant === "warning") counts.warning += 1;
    else counts.info += 1;
  }
  const chips = (["danger", "warning", "info"] as const).filter(
    (key) => counts[key] > 0,
  );

  return (
    <section aria-label={t("alerts.barTitle")} className="space-y-0">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border shadow-[var(--shadow-card)] transition duration-300",
          bar.border,
          isExpanded && "border-border/60 shadow-[var(--shadow-card-hover)]",
        )}
      >
        <Button
          variant="ghost"
          onClick={() => {
            if (!hasAlerts) {
              router.push("/dashboard/notifications");
              return;
            }
            setOpen((value) => !value);
          }}
          aria-expanded={isExpanded}
          aria-controls="dashboard-alerts-panel"
          aria-label={
            hasAlerts
              ? open
                ? t("alerts.hide")
                : t("alerts.show")
              : t("alerts.viewAll")
          }
          className={cn(
            "group relative flex h-auto w-full items-center gap-3.5 border-0 px-4 py-3.5 text-left transition duration-300",
            bar.bar,
            hasAlerts && bar.interactive,
            isExpanded
              ? "cursor-pointer border-b border-border/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              : hasAlerts
                ? cn(
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    bar.hover,
                  )
                : "cursor-pointer hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
              bar.accent,
            )}
            aria-hidden="true"
          />

          {/* Icon tile with layered glow */}
          <span className="relative flex shrink-0 items-center justify-center">
            <span
              className={cn(
                "absolute inset-0 rounded-xl opacity-40 blur-md transition-opacity duration-300",
                bar.glow,
                hasAlerts && "group-hover:opacity-70",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-1/2 h-10 w-0.5 -translate-y-1/2 rounded-r-full",
                bar.rail,
              )}
              aria-hidden="true"
            />
            <motion.span
              whileHover={hasAlerts ? { scale: 1.06, rotate: -3 } : undefined}
              whileTap={hasAlerts ? { scale: 0.94 } : undefined}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className={cn(
                "relative flex size-10 items-center justify-center rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-inset",
                bar.tile,
              )}
            >
              <bar.icon className="size-4.5" />

              {hasPulse && (
                <span className="absolute -right-1 -top-1" aria-hidden="true">
                  <span className="relative flex size-2.5">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                        state === "danger" ? "bg-danger" : "bg-warning",
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex size-2.5 rounded-full ring-2 ring-background",
                        state === "danger" ? "bg-danger" : "bg-warning",
                      )}
                    />
                  </span>
                </span>
              )}
            </motion.span>
          </span>

          <span className="relative min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
              {hasAlerts ? t("alerts.barTitle") : t("alerts.allClear")}
            </span>
            {!isExpanded && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {hasAlerts
                  ? alerts[0].title
                  : getMonthName(month, year, locale)}
              </span>
            )}
          </span>

          {hasAlerts && (
            <>
              {/* Severity count chips */}
              <span className="relative hidden shrink-0 items-center gap-1.5 sm:flex">
                {chips.map((key) => (
                  <span
                    key={key}
                    className={cn(
                      "flex h-5 min-w-6 items-center justify-center gap-1 rounded-full px-1.5 text-[0.65rem] font-bold tabular-nums ring-1 ring-inset",
                      severityStyles[key].chip,
                    )}
                  >
                    <span
                      className="size-1.5 rounded-full bg-current"
                      aria-hidden="true"
                    />
                    {counts[key]}
                  </span>
                ))}
              </span>
            </>
          )}
          <motion.span
            whileHover={hasAlerts ? undefined : { x: 3 }}
            className="relative flex size-7 shrink-0 items-center justify-center rounded-full border border-border/40 bg-background/40 text-muted-foreground shadow-sm transition-colors group-hover:border-primary/50 group-hover:text-primary"
            aria-hidden="true"
          >
            {hasAlerts ? (
              <MorphIcon
                icon={open ? ChevronUpData : ChevronDownData}
                size={14}
                reducedMotion="user"
              />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </motion.span>
        </Button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.section
              key="alert-panel"
              id="dashboard-alerts-panel"
              aria-label={t("alerts.barTitle")}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-card/40 p-3">
                {/* Header with dismiss all */}
                {alerts.length > 0 && (
                  <div className="mb-3 flex items-center justify-between px-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("alerts.actionsLabel")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Link
                        href="/dashboard/notifications"
                        className="flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground/70 transition duration-200 hover:bg-muted/60 hover:text-foreground"
                      >
                        <Bell className="size-3.5" />
                        {t("alerts.viewAll")}
                      </Link>
                      {alerts.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("alerts.dismissAll")}
                          onClick={handleDismissAll}
                          disabled={dismissingIds.size > 0}
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition duration-200 hover:bg-none hover:bg-muted/60 hover:text-foreground active:scale-95 disabled:opacity-50"
                        >
                          {dismissingIds.size > 0 ? (
                            <Sparkles className="size-3.5 animate-spin" />
                          ) : (
                            <X className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </span>
                  </div>
                )}

                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {alerts.map((alert) => {
                      const style = severityStyles[alert.variant];
                      const action = getAlertAction(alert.type);
                      const ActionIcon = action?.icon ?? ArrowRight;
                      const isDismissing = dismissingIds.has(alert.id);

                      function handleAction() {
                        if (action) router.push(action.url);
                      }

                      return (
                        <motion.div
                          key={alert.id}
                          layout
                          variants={item}
                          exit={{
                            opacity: 0,
                            x: 28,
                            transition: { duration: 0.18, ease: "easeIn" },
                          }}
                        >
                          <div className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-card to-card/50 px-3.5 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition duration-200 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
                            {/* Severity rail */}
                            <div
                              className={cn(
                                "absolute inset-y-2 left-0 w-1 rounded-full transition duration-300 group-hover:inset-y-1",
                                style.rail,
                              )}
                            />

                            <span
                              className={cn(
                                "relative flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-inset transition-transform duration-300 group-hover:scale-105",
                                style.tile,
                              )}
                            >
                              <style.icon className="size-4" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                                {alert.title}
                              </p>
                              {alert.description && (
                                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                  {alert.description}
                                </p>
                              )}
                              <RelativeTime
                                date={alert.createdAt}
                                locale={locale}
                                className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50"
                              />
                            </div>

                            {action && (
                              <Button
                                size="sm"
                                onClick={handleAction}
                                disabled={isDismissing}
                                className={cn(
                                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition duration-200 ring-1 ring-inset sm:px-3",
                                  "bg-none hover:bg-none",
                                  style.button,
                                  "active:scale-95",
                                )}
                              >
                                <span className="hidden sm:inline">
                                  {t(action.labelKey)}
                                </span>
                                <ActionIcon className="size-3.5" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("alerts.dismiss")}
                              onClick={() => handleDismiss(alert.id)}
                              disabled={isDismissing}
                              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition duration-200 hover:bg-none hover:bg-muted/60 hover:text-foreground active:scale-95 disabled:opacity-50"
                            >
                              {isDismissing ? (
                                <Sparkles className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>

                {/* Empty state */}
                {alerts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success mb-3">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {t("alerts.allClear")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("alerts.noAlerts")}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
