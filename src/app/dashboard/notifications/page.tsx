"use client";

import { BackHeader } from "@components/dashboard";
import {
  ConfirmDialog,
  EmptyState,
  FinancePageShell,
  Icon,
  RelativeTime,
  SummaryMetricCard,
  SummaryMetricGrid,
} from "@components/shared";
import { Button } from "@components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/shared/toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfile } from "@/hooks/useProfile";
import { type InboxAlert, notificationsApi } from "@/lib/api/notifications";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Info,
  Trash2,
  TriangleAlert,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { getAlertAction } from "@/utils/alerts";

type Severity = InboxAlert["severity"];
type Filter = "all" | "unread" | "read";

const SEVERITY_STYLES: Record<
  Severity,
  { icon: typeof TriangleAlert; tile: string; rail: string; chip: string }
> = {
  danger: {
    icon: TriangleAlert,
    tile: "bg-gradient-to-br from-danger/25 to-danger/10 text-danger ring-danger/15",
    rail: "bg-gradient-to-b from-danger to-danger/30",
    chip: "bg-danger/10 text-danger ring-danger/15",
  },
  warning: {
    icon: TriangleAlert,
    tile: "bg-gradient-to-br from-warning/25 to-warning/10 text-warning ring-warning/15",
    rail: "bg-gradient-to-b from-warning to-warning/30",
    chip: "bg-warning/10 text-warning ring-warning/15",
  },
  success: {
    icon: CheckCircle2,
    tile: "bg-gradient-to-br from-success/25 to-success/10 text-success ring-success/15",
    rail: "bg-gradient-to-b from-success to-success/30",
    chip: "bg-success/10 text-success ring-success/15",
  },
  info: {
    icon: Info,
    tile: "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/15",
    rail: "bg-gradient-to-b from-primary to-primary/30",
    chip: "bg-primary/10 text-primary ring-primary/15",
  },
};

function AlertRow({
  alert,
  locale,
  onDismiss,
  dismissing,
  absoluteDate = false,
}: {
  alert: InboxAlert;
  locale: string;
  onDismiss: (id: string) => void;
  dismissing: boolean;
  absoluteDate?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const style = SEVERITY_STYLES[alert.severity];
  const action = getAlertAction(alert.type);
  const ActionIcon = action?.icon ?? ArrowRight;
  const isUnread = !alert.readAt && !alert.resolvedAt;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "group relative flex items-start gap-3 overflow-hidden rounded-xl border bg-card px-4 py-3.5 shadow-[var(--shadow-card)] transition duration-200 hover:shadow-[var(--shadow-card-hover)]",
        isUnread
          ? "border-primary/25 bg-gradient-to-br from-primary/[0.03] to-transparent"
          : "border-border/40 opacity-75 hover:opacity-100",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-2.5 left-0 w-1 rounded-r-full",
          style.rail,
        )}
        aria-hidden
      />

      <span
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset",
          style.tile,
        )}
      >
        <style.icon className="size-4.5" />
        {isUnread && (
          <span className="absolute -right-1 -top-1 flex size-2.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                alert.severity === "danger" ? "bg-danger" : "bg-primary",
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full ring-2 ring-background",
                alert.severity === "danger" ? "bg-danger" : "bg-primary",
              )}
            />
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p
            className={cn(
              "truncate text-sm font-semibold tracking-tight",
              isUnread ? "text-foreground" : "text-foreground/80",
            )}
          >
            {alert.title}
          </p>
          {isUnread && (
            <span
              className={cn(
                "flex h-4 shrink-0 items-center rounded-full px-1.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                style.chip,
              )}
            >
              {t("notifications.unreadBadge")}
            </span>
          )}
        </div>
        {alert.description && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {alert.description}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          {absoluteDate ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
              {new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date(alert.createdAt))}
            </span>
          ) : (
            <RelativeTime
              date={alert.createdAt}
              locale={locale}
              className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50"
            />
          )}
          {alert.resolvedAt && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-success/70">
              {t("notifications.resolved")}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {action && (
          <Button
            size="sm"
            onClick={() => router.push(action.url)}
            className="hidden h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold sm:inline-flex"
          >
            <span>{t(action.labelKey)}</span>
            <ActionIcon className="size-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("notifications.markRead")}
          onClick={() => onDismiss(alert.id)}
          disabled={dismissing || !isUnread}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/60 transition duration-200 hover:bg-muted/60 hover:text-foreground active:scale-95 disabled:opacity-40"
        >
          <Icon icon={Check} className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}

const FILTERS: { id: Filter; labelKey: string }[] = [
  { id: "all", labelKey: "notifications.tabAll" },
  { id: "unread", labelKey: "notifications.tabUnread" },
  { id: "read", labelKey: "notifications.tabRead" },
];

type DayGroup = "today" | "yesterday" | "thisWeek" | "earlier";

/** Bucket alerts into local-day groups so the list reads as a timeline. */
function groupAlerts(
  alerts: InboxAlert[],
  now: Date,
): { key: DayGroup; alerts: InboxAlert[] }[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  // Week starts on Monday (getDay(): 0 = Sunday).
  const day = startOfToday.getDay();
  startOfWeek.setDate(startOfToday.getDate() - ((day + 6) % 7));

  const buckets: Record<DayGroup, InboxAlert[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  for (const alert of alerts) {
    const created = new Date(alert.createdAt);
    if (created >= startOfToday) buckets.today.push(alert);
    else if (created >= startOfYesterday) buckets.yesterday.push(alert);
    else if (created >= startOfWeek) buckets.thisWeek.push(alert);
    else buckets.earlier.push(alert);
  }

  return ["today", "yesterday", "thisWeek", "earlier"]
    .filter((key) => buckets[key as DayGroup].length > 0)
    .map((key) => ({ key: key as DayGroup, alerts: buckets[key as DayGroup] }));
}

const DAY_GROUP_LABEL_KEYS: Record<DayGroup, string> = {
  today: "notifications.groups.today",
  yesterday: "notifications.groups.yesterday",
  thisWeek: "notifications.groups.thisWeek",
  earlier: "notifications.groups.earlier",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { alerts, isLoading, dismiss } = useNotifications(user?.id);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const locale = profile?.locale ?? "es-ES";

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.readAt && !alert.resolvedAt).length,
    [alerts],
  );
  const readCount = alerts.length - unreadCount;

  const visible = useMemo(() => {
    switch (filter) {
      case "unread":
        return alerts.filter((alert) => !alert.readAt && !alert.resolvedAt);
      case "read":
        return alerts.filter((alert) => alert.readAt || alert.resolvedAt);
      default:
        return alerts;
    }
  }, [alerts, filter]);

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

  const markAllRead = async () => {
    await notificationsApi.markRead({ all: true });
    await queryClient.invalidateQueries({
      queryKey: ["notifications", user?.id],
    });
  };
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await notificationsApi.clearAll();
      await queryClient.invalidateQueries({
        queryKey: ["notifications", user?.id],
      });
      toast.success(t("notifications.clearSuccess"));
      setClearOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("notifications.clearError"),
      );
    } finally {
      setClearing(false);
    }
  };

  const groups = useMemo(() => groupAlerts(visible, new Date()), [visible]);

  return (
    <FinancePageShell>
      <BackHeader title={t("notifications.title")} href="/dashboard" />

      <p className="text-sm text-muted-foreground">
        {t("notifications.description")}
      </p>

      {alerts.length > 0 && (
        <SummaryMetricGrid className="sm:grid-cols-2">
          <SummaryMetricCard
            label={t("notifications.total")}
            value={alerts.length}
            icon={Bell}
            tone="info"
          />
          <SummaryMetricCard
            label={t("notifications.unread")}
            value={unreadCount}
            icon={unreadCount > 0 ? TriangleAlert : CheckCircle2}
            tone={unreadCount > 0 ? "warning" : "positive"}
          />
        </SummaryMetricGrid>
      )}

      {alerts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={t("notifications.tabsLabel")}
            className="flex items-center gap-1 rounded-xl border border-border/40 bg-muted/30 p-1"
          >
            {FILTERS.map((item) => {
              const count =
                item.id === "all"
                  ? alerts.length
                  : item.id === "unread"
                    ? unreadCount
                    : readCount;
              const isActive = filter === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition duration-150",
                    isActive
                      ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(item.labelKey)}
                  <span
                    className={cn(
                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground/70",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && filter !== "read" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void markAllRead()}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <Icon icon={Check} className="size-3.5" />
                {t("notifications.markAllRead")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearOpen(true)}
              disabled={clearing}
              className="h-8 gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              <Icon icon={Trash2} className="size-3.5" />
              {t("notifications.clearAll")}
            </Button>
          </div>
        </div>
      )}
      {isLoading && alerts.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border/40 bg-muted/40"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Bell} size="lg" />}
          title={
            alerts.length === 0
              ? t("notifications.empty")
              : t("notifications.noFiltered")
          }
          description={
            alerts.length === 0
              ? t("notifications.emptyDescription")
              : undefined
          }
          iconClassName="from-primary/20 to-primary/5 text-primary ring-primary/15"
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section
              key={group.key}
              aria-label={t(DAY_GROUP_LABEL_KEYS[group.key])}
            >
              <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                <span>{t(DAY_GROUP_LABEL_KEYS[group.key])}</span>
                {group.key === "earlier" && (
                  <span className="ml-1 text-[10px] font-medium normal-case tracking-normal text-muted-foreground/50">
                    {new Intl.DateTimeFormat(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(group.alerts[0].createdAt))}
                  </span>
                )}
                <span className="h-px flex-1 bg-border/50" />
                <span className="font-medium tabular-nums">
                  {group.alerts.length}
                </span>
              </h2>
              <motion.div layout className="space-y-2.5">
                {group.alerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    locale={locale}
                    dismissing={dismissingIds.has(alert.id)}
                    onDismiss={handleDismiss}
                    absoluteDate={group.key === "earlier"}
                  />
                ))}
              </motion.div>
            </section>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title={t("notifications.clearConfirmTitle")}
        description={t("notifications.clearConfirmDescription")}
        confirmLabel={t("notifications.clearAll")}
        onConfirm={handleClearAll}
        closeOnConfirm={false}
        loading={clearing}
        loadingLabel={t("notifications.clearing")}
      />
    </FinancePageShell>
  );
}
