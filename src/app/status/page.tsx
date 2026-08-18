"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AnimatedNumber,
  Icon,
  IncidentAdminPanel,
  RelativeTime,
  ThemeToggle,
} from "@/components/shared";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { toast } from "@/components/shared/toast";
import { ClaimAdminAccessCard } from "@/components/status/claim-admin-access-card";
import {
  COMPONENT_META,
  STATUS_DOT,
  STATUS_PILL,
  statusKey,
} from "@/components/status/status-meta";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/useProfile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { pushApi } from "@/lib/api/push";
import {
  Activity,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplet,
  Loader2,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  XCircle,
} from "@/lib/icons";
import type {
  ComponentCheckRecord,
  ComponentId,
  ComponentStatus,
  IncidentRecord,
  IncidentSeverity,
  IncidentStatus,
  StatusSnapshot,
  UptimeBar,
  UptimePercentages,
} from "@/lib/services/status";
import supabase from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 60_000;

interface StatusResponse extends StatusSnapshot {
  history: Record<ComponentId, UptimeBar[]>;
  uptime: UptimePercentages;
  lastFailure: Record<ComponentId, string | null>;
  latency: Record<ComponentId, number[]>;
  incidents: IncidentRecord[];
  maintenance: IncidentRecord[];
  stale?: boolean;
  lastSuccessfulAt?: string | null;
}

const INCIDENT_DOT: Record<IncidentStatus, string> = {
  investigating: "bg-amber-500",
  monitoring: "bg-blue-500",
  resolved: "bg-emerald-500",
};

const SEVERITY_DOT: Record<IncidentSeverity, string> = {
  minor: "bg-emerald-500",
  major: "bg-amber-500",
  critical: "bg-red-500",
};

const SEVERITY_ICON: Record<IncidentSeverity, typeof CheckCircle2> = {
  minor: CheckCircle2,
  major: TriangleAlert,
  critical: XCircle,
};

const SEVERITY_STYLE: Record<IncidentSeverity, string> = {
  minor:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  major: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
  critical: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-400",
};

/** Tiny inline SVG sparkline of recent check latencies. */
function LatencySparkline({
  values,
  color,
  label,
}: {
  values: number[];
  color: string;
  label: string;
}) {
  if (values.length < 2) return null;
  const width = 96;
  const height = 24;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * (height - 2) - 1}`)
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 opacity-70"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LatencyUnavailable({
  label,
  hint,
  compact = false,
}: {
  label: string;
  hint: string;
  compact?: boolean;
}) {
  return (
    <div
      title={compact ? label : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg bg-muted/25 text-muted-foreground",
        compact
          ? "border border-border/30 px-1.5 py-1"
          : "border-y border-border/40 px-2 py-2",
      )}
    >
      <Activity
        className={cn(
          "shrink-0 text-muted-foreground/60",
          compact ? "size-3" : "size-3.5",
        )}
      />
      {compact ? (
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground/50">
          —
        </span>
      ) : (
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-medium">
            {label}
          </span>
          <span className="block truncate text-[10px] text-muted-foreground/60">
            {hint}
          </span>
        </span>
      )}
    </div>
  );
}

function AvailabilityOnly({ label }: { label: string }) {
  return (
    <span
      title={label}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/30 bg-muted/25 px-1.5 py-1 text-muted-foreground/60"
    >
      <Activity className="size-3" />
      <span className="hidden text-[10px] font-medium sm:inline">{label}</span>
    </span>
  );
}

function incidentStatusKey(status: IncidentStatus): string {
  return `status.incidentStatus.${status}`;
}

function StatusPulse({
  dot,
  glow,
  ring,
}: {
  dot: string;
  glow: string;
  ring: string;
}) {
  const reducedMotion = useReducedMotion();
  const pulseAnimation = reducedMotion
    ? { opacity: 0.3, scale: 1 }
    : { opacity: [0.45, 0, 0.45], scale: [1, 1.8, 1] };
  const pulseTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 1.8, ease: "easeInOut" as const, repeat: Infinity };

  return (
    <>
      <motion.span
        aria-hidden="true"
        animate={pulseAnimation}
        transition={pulseTransition}
        className={cn("absolute inset-0 rounded-full", glow)}
      />
      <span
        aria-hidden="true"
        className={cn("absolute inset-0 rounded-full ring-4", ring)}
      />
      <motion.span
        aria-hidden="true"
        animate={
          reducedMotion
            ? { scale: 1 }
            : { scale: [1, 1.12, 1], opacity: [1, 0.75, 1] }
        }
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 1.8, ease: "easeInOut" as const, repeat: Infinity }
        }
        className={cn("relative size-5 rounded-full", dot)}
      />
    </>
  );
}

function DetailStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: typeof Activity;
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/50 bg-muted/15 px-2.5 py-2.5 sm:p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md",
            tone,
          )}
        >
          <Icon icon={icon} className="size-3.5" />
        </span>
        <p className="min-w-0 truncate text-base font-bold tabular-nums tracking-tight">
          {value}
        </p>
      </div>
      <p className="mt-2 truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
    </div>
  );
}

type LatencyTrend = "improving" | "stable" | "worsening";

function percentile(values: number[], percentileValue: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function getLatencyTrend(values: number[]): LatencyTrend {
  if (values.length < 4) return "stable";
  const midpoint = Math.floor(values.length / 2);
  const first = values.slice(0, midpoint);
  const second = values.slice(midpoint);
  const firstAverage =
    first.reduce((sum, value) => sum + value, 0) / first.length;
  const secondAverage =
    second.reduce((sum, value) => sum + value, 0) / second.length;
  if (firstAverage === 0) return "stable";
  const change = (secondAverage - firstAverage) / firstAverage;
  if (change <= -0.1) return "improving";
  if (change >= 0.1) return "worsening";
  return "stable";
}

function StatusPageSkeleton({ label }: { label: string }) {
  return (
    <section aria-busy="true" aria-label={label} className="mt-6 space-y-3">
      <span className="sr-only">{label}</span>
      <div className="h-20 animate-pulse rounded-2xl border border-border/30 bg-muted/30" />
      {(["api", "database", "auth", "push", "storage"] as const).map(
        (component) => (
          <div
            key={component}
            className="rounded-2xl border border-border/30 bg-background/60 p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted/60" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded-full bg-muted/60" />
                <div className="h-2.5 w-44 max-w-full animate-pulse rounded-full bg-muted/40" />
              </div>
              <div className="hidden h-6 w-24 animate-pulse rounded-lg bg-muted/40 sm:block" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-muted/50" />
            </div>
            <div className="mt-4 space-y-2 border-t border-border/20 pt-3">
              <div className="h-2 w-20 animate-pulse rounded-full bg-muted/40" />
              <div className="h-2.5 w-full animate-pulse rounded-full bg-muted/40" />
            </div>
          </div>
        ),
      )}
    </section>
  );
}

const STATUS_CHIP: Record<ComponentStatus, string> = {
  ok: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  degraded:
    "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  down: "from-red-500/15 to-red-500/5 text-red-600 dark:text-red-400",
};

const STATUS_EDGE: Record<ComponentStatus, string> = {
  ok: "before:bg-emerald-500",
  degraded: "before:bg-amber-500",
  down: "before:bg-red-500",
};

const BAR_COLORS: Record<ComponentStatus, string> = {
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};

function UptimeBars({
  bars,
  onSelect,
  selectedDate,
  checksLabel,
  noDataLabel,
  statusLabel,
}: {
  bars: UptimeBar[];
  onSelect?: (bar: UptimeBar) => void;
  selectedDate?: string | null;
  checksLabel: string;
  noDataLabel: string;
  statusLabel: (status: ComponentStatus) => string;
}) {
  return (
    <div className="flex flex-wrap gap-px">
      {bars.map((bar, index) => (
        <motion.button
          key={bar.date}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(bar)}
          title={`${bar.date}: ${bar.status ? statusLabel(bar.status) : "—"} · ${bar.checks} ${checksLabel}`}
          aria-label={`${bar.date}: ${bar.status ? statusLabel(bar.status) : noDataLabel}, ${bar.checks} ${checksLabel}`}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.25,
            delay: Math.min(index * 0.004, 0.6),
            ease: "easeOut",
          }}
          whileHover={onSelect ? { scale: 1.5 } : undefined}
          className={cn(
            "size-2 rounded-[3px] transition-[box-shadow] sm:size-2.5",
            onSelect && "cursor-pointer hover:ring-2 hover:ring-foreground/20",
            selectedDate === bar.date &&
              "ring-2 ring-primary ring-offset-1 ring-offset-background",
            bar.status ? BAR_COLORS[bar.status] : "bg-border/40",
          )}
        />
      ))}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
      <span className={cn("size-2.5 rounded-[3px]", color)} />
      {label}
    </span>
  );
}

/** Ticks every second and renders the remaining time until `target`. */
function useCountdown(target: string | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [target]);

  if (!target) return "";
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return "";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function MaintenanceCard({ item }: { item: IncidentRecord }) {
  const { t, i18n } = useTranslation();
  const started =
    !!item.scheduledStart &&
    new Date(item.scheduledStart).getTime() <= Date.now();
  const countdown = useCountdown(
    started ? item.scheduledEnd : item.scheduledStart,
  );

  return (
    <article className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-500/20 dark:text-blue-400">
          <span className="size-1.5 rounded-full bg-blue-500" />
          {started
            ? t("status.maintenanceInProgress")
            : t("status.maintenanceScheduled")}
        </span>
        {item.component && (
          <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t(
              `status.component${item.component[0].toUpperCase()}${item.component.slice(1)}`,
            )}
          </span>
        )}
        <span className="ml-auto font-mono text-xs tabular-nums text-blue-700 dark:text-blue-400">
          {countdown &&
            (started
              ? `${t("status.maintenanceEndsIn")} ${countdown}`
              : `${t("status.maintenanceStartsIn")} ${countdown}`)}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold tracking-tight">
        {item.title}
      </h3>
      {item.message && (
        <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
      )}
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <CalendarClock className="size-3.5" />
        <RelativeTime date={item.scheduledStart} locale={i18n.language} />
        <span aria-hidden>→</span>
        <RelativeTime date={item.scheduledEnd} locale={i18n.language} />
      </p>
    </article>
  );
}

/** "Get notified" card — enables push alerts for status changes. */
function GetNotifiedCard() {
  const { t } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const { supported, configured, checked, subscribed, busy, enable } =
    usePushNotifications();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<{
    enabled: boolean;
    components: string[];
    severities: string[];
  } | null>(null);
  const [prefsBusy, setPrefsBusy] = useState(false);

  const isLoggedIn = Boolean(profile);

  // Load status alert preferences when subscribed + logged in.
  useEffect(() => {
    if (!subscribed || !isLoggedIn) {
      setPrefs(null);
      return;
    }
    let cancelled = false;
    pushApi
      .getStatusPreferences()
      .then((result) => {
        if (!cancelled)
          setPrefs({
            enabled: result.enabled,
            components: result.components,
            severities: result.severities,
          });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [subscribed, isLoggedIn]);

  const updatePrefs = async (next: {
    enabled: boolean;
    components: string[];
    severities: string[];
  }) => {
    if (prefsBusy) return;
    setPrefsBusy(true);
    try {
      await pushApi.updateStatusPreferences(next);
      setPrefs(next);
    } catch {
      toast.error(t("status.notifyPrefsError"));
    } finally {
      setPrefsBusy(false);
    }
  };

  if (!checked) return null;
  if (!supported || !configured) return null;

  const allComponents = ["api", "database", "auth", "push", "storage"] as const;
  const allSeverities = ["minor", "major", "critical"] as const;
  // Empty lists = all values (legacy default).
  const enabledComponents =
    prefs && prefs.components.length > 0 ? prefs.components : allComponents;
  const enabledSeverities =
    prefs && prefs.severities.length > 0 ? prefs.severities : allSeverities;

  let body: ReactNode;
  if (!isLoggedIn) {
    body = (
      <p className="text-xs text-muted-foreground">
        {t("status.notifySignInHint")}{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary/80 transition hover:text-primary hover:underline underline-offset-2"
        >
          {t("status.notifySignIn")}
        </Link>
      </p>
    );
  } else if (!subscribed) {
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={busy || profileLoading}
          onClick={() => void enable()}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BellRing className="size-4" />
          )}
          {t("status.notifyEnable")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("status.notifyHint")}
        </p>
      </div>
    );
  } else {
    const masterEnabled = prefs ? prefs.enabled : true;
    body = (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/25 px-2.5 py-2">
          <p
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium",
              masterEnabled
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {masterEnabled ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <TriangleAlert className="size-3.5" />
            )}
            {masterEnabled ? t("status.notifyActive") : t("status.notifyMuted")}
          </p>
          <div className="flex items-center gap-1.5">
            <Switch
              size="sm"
              checked={masterEnabled}
              disabled={prefsBusy}
              onCheckedChange={(next) =>
                void updatePrefs({
                  enabled: Boolean(next),
                  components: prefs?.components ?? [],
                  severities: prefs?.severities ?? [],
                })
              }
              aria-label={t("status.notifyPrefsTitle")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={prefsBusy}
              onClick={() => setPrefsOpen((open) => !open)}
              className="h-7 px-2 text-[11px]"
            >
              {prefsOpen
                ? t("status.notifyHidePrefs")
                : t("status.notifyCustomize")}
            </Button>
          </div>
        </div>

        {prefsOpen && masterEnabled && (
          <div className="space-y-2 border-t border-border/40 pt-2">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {allComponents.map((component) => {
                const selected = enabledComponents.includes(component);
                const ServiceIcon = COMPONENT_META[component].icon;
                return (
                  <div
                    key={component}
                    className={cn(
                      "flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
                      selected
                        ? "border-primary/25 bg-primary/[0.06]"
                        : "border-border/40 bg-muted/20",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon icon={ServiceIcon} className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                      {t(
                        `status.component${component[0].toUpperCase()}${component.slice(1)}`,
                      )}
                    </span>
                    <Switch
                      size="sm"
                      checked={selected}
                      disabled={prefsBusy}
                      onCheckedChange={(next) => {
                        const current = selected
                          ? enabledComponents.filter((c) => c !== component)
                          : [...enabledComponents, component];
                        const components = next
                          ? current.length === allComponents.length
                            ? []
                            : current
                          : current.filter((c) => c !== component);
                        void updatePrefs({
                          enabled: true,
                          components,
                          severities: prefs?.severities ?? [],
                        });
                      }}
                      aria-label={t(
                        `status.component${component[0].toUpperCase()}${component.slice(1)}`,
                      )}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-1.5 border-t border-border/30 pt-2 sm:grid-cols-3">
              {allSeverities.map((severity) => {
                const selected = enabledSeverities.includes(severity);
                const SeverityIcon = SEVERITY_ICON[severity];
                return (
                  <div
                    key={severity}
                    className={cn(
                      "flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                      selected
                        ? SEVERITY_STYLE[severity]
                        : "border-border/40 bg-muted/20 text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        selected ? "bg-background/70" : "bg-muted",
                      )}
                    >
                      <SeverityIcon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                      {t(`status.incidents.severity.${severity}`)}
                    </span>
                    <Switch
                      size="sm"
                      checked={selected}
                      disabled={prefsBusy}
                      onCheckedChange={(next) => {
                        const nextSeverities = next
                          ? [...enabledSeverities, severity]
                          : enabledSeverities.filter(
                              (value) => value !== severity,
                            );
                        void updatePrefs({
                          enabled: true,
                          components: prefs?.components ?? [],
                          severities:
                            nextSeverities.length === allSeverities.length
                              ? []
                              : nextSeverities,
                        });
                      }}
                      aria-label={t(`status.incidents.severity.${severity}`)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="relative mt-6 overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04] p-3 sm:p-4">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <BellRing className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">
            {t("status.notifyTitle")}
          </h2>
          <div className="mt-1.5">{body}</div>
        </div>
      </div>
    </section>
  );
}

/** Component detail view — latency chart + failure list for one component. */
function ComponentDetailSheet({
  component,
  onOpenChange,
}: {
  component: ComponentId | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const [checks, setChecks] = useState<ComponentCheckRecord[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!component) {
      setChecks(null);
      setError(false);
      return;
    }
    let cancelled = false;
    setChecks(null);
    setError(false);
    const retryQuery = reloadNonce > 0 ? `?retry=${reloadNonce}` : "";
    fetch(`/api/status/component/${component}${retryQuery}`, {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("component failed");
        return response.json();
      })
      .then((body: { checks: ComponentCheckRecord[] }) => {
        if (!cancelled) setChecks(body.checks);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [component, reloadNonce]);

  const name = component
    ? t(`status.component${component[0].toUpperCase()}${component.slice(1)}`)
    : "";
  const failures = checks?.filter((c) => c.status !== "ok") ?? [];
  const latestCheck = checks?.[checks.length - 1] ?? null;
  const currentStatus = latestCheck?.status ?? null;
  const chartData = checks
    ?.filter((c) => c.latencyMs != null && c.latencyMs > 0)
    .map((c, index) => ({
      index,
      ms: c.latencyMs as number,
      time: new Date(c.checkedAt).toLocaleTimeString(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  const averageLatency = chartData?.length
    ? Math.round(
        chartData.reduce((sum, point) => sum + point.ms, 0) / chartData.length,
      )
    : null;
  const latestLatency = chartData?.[chartData.length - 1]?.ms ?? null;
  const latencySamples = chartData?.map((point) => point.ms) ?? [];
  const latencyMonitored = component !== "api" && component !== "push";
  const p50Latency = percentile(latencySamples, 0.5);
  const p95Latency = percentile(latencySamples, 0.95);
  const minLatency = latencySamples.length ? Math.min(...latencySamples) : null;
  const maxLatency = latencySamples.length ? Math.max(...latencySamples) : null;
  const trend =
    latencyMonitored && latencySamples.length >= 4
      ? getLatencyTrend(latencySamples)
      : null;
  const trendIcon =
    trend === "improving"
      ? TrendingDown
      : trend === "worsening"
        ? TrendingUp
        : Minus;
  const trendTone =
    trend === "improving"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : trend === "worsening"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-muted text-muted-foreground";
  const latencyFillId = `latency-fill-${component ?? "unknown"}`;

  return (
    <BottomSheet
      open={component !== null}
      onOpenChange={onOpenChange}
      title={name}
      description={
        component ? t("status.componentDetail", { component: name }) : undefined
      }
      icon={
        <Icon
          icon={component ? COMPONENT_META[component].icon : Activity}
          className="size-5"
        />
      }
      iconGradient="from-primary/20 to-primary/10"
      iconColor="text-primary"
      className="sm:max-w-lg"
      contentClassName="px-4 py-5 sm:px-6 sm:py-6"
      snapPoints={[0.45, 0.92]}
    >
      {error ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" />
            {t("status.componentDetailError")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReloadNonce((value) => value + 1)}
            className="h-8 gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            {t("status.refresh")}
          </Button>
        </div>
      ) : !checks ? (
        <div aria-busy="true" className="space-y-4">
          <span className="sr-only">{t("common.loading")}</span>
          <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {["one", "two", "three"].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-muted/30"
              />
            ))}
          </div>
          <div className="h-36 animate-pulse rounded-xl bg-muted/30" />
        </div>
      ) : (
        <div className="space-y-6">
          {latestCheck && currentStatus && (
            <div
              className={cn(
                "relative overflow-hidden rounded-xl border px-3.5 py-3",
                currentStatus === "ok"
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : currentStatus === "degraded"
                    ? "border-amber-500/20 bg-amber-500/[0.04]"
                    : "border-red-500/20 bg-red-500/[0.04]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-0 left-0 w-0.5",
                  STATUS_DOT[currentStatus],
                )}
              />
              <div className="flex items-center justify-between gap-3 pl-1">
                <div className="flex min-w-0 items-center gap-2.5">
                  {component && (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/70 text-muted-foreground ring-1 ring-border/30">
                      <Icon
                        icon={COMPONENT_META[component].icon}
                        className="size-4"
                      />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {t(statusKey(currentStatus))}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {t("status.lastChecked")}
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground/60">
                  <Clock className="size-3" />
                  <RelativeTime
                    date={latestCheck.checkedAt}
                    locale={i18n.language}
                  />
                </span>
              </div>
            </div>
          )}
          {checks.length === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3.5 py-3 text-xs text-muted-foreground">
              <TriangleAlert className="size-4 shrink-0 text-muted-foreground/60" />
              {t("status.noData")}
            </div>
          )}

          {/* Availability summary */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <DetailStat
              icon={CheckCircle2}
              value={checks.length}
              label={t("status.checks")}
              tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <DetailStat
              icon={failures.length > 0 ? TriangleAlert : CheckCircle2}
              value={failures.length}
              label={t("status.failures")}
              tone={
                failures.length > 0
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }
            />
            {latencyMonitored && trend && (
              <DetailStat
                icon={trendIcon}
                value={t(
                  `status.trend${trend[0].toUpperCase()}${trend.slice(1)}`,
                )}
                label={t("status.trend")}
                tone={trendTone}
              />
            )}
          </div>

          {latencyMonitored ? (
            <>
              {/* Latency metrics */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <DetailStat
                  icon={Activity}
                  value={averageLatency !== null ? `${averageLatency}ms` : "—"}
                  label={t("status.avgLatency")}
                  tone="bg-primary/10 text-primary"
                />
                <DetailStat
                  icon={Activity}
                  value={
                    p50Latency !== null ? `${Math.round(p50Latency)}ms` : "—"
                  }
                  label={t("status.p50Latency")}
                  tone="bg-primary/10 text-primary"
                />
                <DetailStat
                  icon={Activity}
                  value={
                    p95Latency !== null ? `${Math.round(p95Latency)}ms` : "—"
                  }
                  label={t("status.p95Latency")}
                  tone="bg-primary/10 text-primary"
                />
                <DetailStat
                  icon={TrendingDown}
                  value={minLatency !== null ? `${minLatency}ms` : "—"}
                  label={t("status.minLatency")}
                  tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                />
                <DetailStat
                  icon={TrendingUp}
                  value={maxLatency !== null ? `${maxLatency}ms` : "—"}
                  label={t("status.maxLatency")}
                  tone="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                />
              </div>

              {/* Latency chart */}
              {chartData && chartData.length > 1 ? (
                <div className="min-w-0 overflow-hidden rounded-xl border border-border/40 bg-muted/[0.08] px-2 py-2.5 sm:px-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-0.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      <Activity className="size-3" />
                      {t("status.latencyHistory")}
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] tabular-nums text-muted-foreground/50">
                      <span>
                        {chartData.length} {t("status.checks")}
                      </span>
                      {latestLatency !== null && (
                        <span className="font-semibold text-foreground/60">
                          {t("status.latency")}: {latestLatency}ms
                        </span>
                      )}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart
                      data={chartData}
                      margin={{ left: -18, right: 4 }}
                    >
                      <defs>
                        <linearGradient
                          id={latencyFillId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-primary)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-primary)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        tick={{
                          fontSize: 9,
                          fill: "var(--color-muted-foreground)",
                        }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={24}
                      />
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--color-border)"
                        strokeDasharray="3 3"
                        opacity={0.45}
                      />
                      <YAxis
                        tick={{
                          fontSize: 9,
                          fill: "var(--color-muted-foreground)",
                        }}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${value}ms`,
                          t("status.latency"),
                        ]}
                        labelFormatter={(label) => String(label)}
                        contentStyle={{
                          fontSize: 11,
                          borderRadius: 10,
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-popover)",
                          color: "var(--color-popover-foreground)",
                          boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
                        }}
                      />
                      {p95Latency !== null && (
                        <ReferenceLine
                          y={p95Latency}
                          stroke="var(--color-amber-500)"
                          strokeDasharray="4 4"
                          strokeOpacity={0.75}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="ms"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        fill={`url(#${latencyFillId})`}
                        dot={{
                          r: 2,
                          fill: "var(--color-primary)",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 4,
                          fill: "var(--color-primary)",
                          stroke: "var(--color-background)",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <LatencyUnavailable
                  label={t("status.latencyUnavailable")}
                  hint={t("status.latencyUnavailableHint")}
                />
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border-y border-border/40 px-2 py-2.5">
              <Activity className="size-4 shrink-0 text-muted-foreground/60" />
              <div className="min-w-0">
                <p className="text-xs font-medium">
                  {t("status.availabilityMonitored")}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  {t("status.availabilityMonitoredHint")}
                </p>
              </div>
            </div>
          )}

          {/* Failures */}
          {failures.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {t("status.failureList")}
              </p>
              <ul className="space-y-1.5">
                {failures.slice(0, 20).map((check) => (
                  <li
                    key={check.checkedAt}
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs"
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        check.status === "down" ? "bg-red-500" : "bg-amber-500",
                      )}
                    />
                    <span className="font-medium text-foreground/80">
                      {t(
                        `status.status${check.status[0].toUpperCase()}${check.status.slice(1)}`,
                      )}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground/70">
                      <Clock className="size-3" />
                      <RelativeTime
                        date={check.checkedAt}
                        locale={i18n.language}
                      />
                    </span>
                  </li>
                ))}
              </ul>
              {failures.length > 20 && (
                <p className="text-[10px] text-muted-foreground/50">
                  {t("status.showingRecent", { count: failures.length })}
                </p>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              {t("status.noFailures")}
            </p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

function DaySummarySheet({
  component,
  bar,
  onOpenChange,
}: {
  component: ComponentId | null;
  bar: UptimeBar | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const name = component
    ? t(`status.component${component[0].toUpperCase()}${component.slice(1)}`)
    : "";
  const dateLabel = bar
    ? new Date(`${bar.date}T12:00:00Z`).toLocaleDateString(i18n.language, {
        dateStyle: "long",
      })
    : "";
  const statusLabel =
    !bar || bar.checks === 0
      ? t("status.noData")
      : bar.status
        ? t(statusKey(bar.status))
        : t("status.noData");

  return (
    <BottomSheet
      open={bar !== null && component !== null}
      onOpenChange={onOpenChange}
      title={dateLabel}
      description={name}
      icon={<Icon icon={CalendarClock} className="size-5" />}
      iconGradient="from-primary/20 to-primary/10"
      iconColor="text-primary"
      className="sm:max-w-sm"
      contentClassName="px-4 py-5 sm:px-6 sm:py-6"
    >
      {bar && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5">
            <span className="text-xs font-medium">{statusLabel}</span>
            <span
              className={cn(
                "size-2.5 rounded-full",
                bar.status ? BAR_COLORS[bar.status] : "bg-border/60",
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DetailStat
              icon={CheckCircle2}
              value={bar.checks}
              label={t("status.checks")}
              tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <DetailStat
              icon={TriangleAlert}
              value={bar.failures}
              label={t("status.failures")}
              tone="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </div>
          {bar.checks === 0 && (
            <p className="rounded-lg border-y border-border/40 px-2 py-2 text-xs text-muted-foreground">
              {t("status.noData")}
            </p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

export default function StatusPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const isAdmin = profile?.role === "admin" && !profileLoading;
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailComponent, setDetailComponent] = useState<ComponentId | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState<{
    component: ComponentId;
    bar: UptimeBar;
  } | null>(null);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) throw new Error("status failed");
      const body = (await response.json()) as StatusResponse;
      setData(body);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const interval = window.setInterval(() => {
      setRefreshing(true);
      void fetchStatus(true);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [fetchStatus]);

  // Incident and maintenance changes are public status events. Refetch the
  // complete snapshot so active/resolved filtering and countdown data stay
  // consistent. Service-check rows are intentionally not subscribed here:
  // /api/status records a check on every request, which would create a loop.
  useEffect(() => {
    let timer: number | null = null;
    const scheduleRefresh = () => {
      if (timer !== null) return;
      timer = window.setTimeout(() => {
        timer = null;
        setRefreshing(true);
        void fetchStatus(true);
      }, 300);
    };

    const channel = supabase
      .channel("public-status-incidents")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incident_updates" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [fetchStatus]);

  const overall = data?.overall ?? null;
  const isInitialLoading = loading && !data;

  const banner = useMemo(() => {
    // While the first check is in flight there's no data to judge — show a
    // neutral loading state instead of a misleading red "outage".
    if (isInitialLoading)
      return {
        text: t("status.checking"),
        dot: "bg-muted-foreground/40",
        ring: "ring-border/40",
        glow: "bg-muted-foreground/10",
        bar: "from-muted-foreground/40 via-muted-foreground/30 to-muted-foreground/40",
      };
    if (overall === "ok")
      return {
        text: t("status.allOperational"),
        dot: "bg-emerald-500",
        ring: "ring-emerald-500/20",
        glow: "bg-emerald-500/10",
        bar: "from-emerald-500 via-emerald-400 to-emerald-500",
      };
    if (overall === "degraded")
      return {
        text: t("status.degraded"),
        dot: "bg-amber-500",
        ring: "ring-amber-500/20",
        glow: "bg-amber-500/10",
        bar: "from-amber-500 via-amber-400 to-amber-500",
      };
    return {
      text: t("status.outage"),
      dot: "bg-red-500",
      ring: "ring-red-500/20",
      glow: "bg-red-500/10",
      bar: "from-red-500 via-red-400 to-red-500",
    };
  }, [overall, t, isInitialLoading]);

  // Overall uptime: average of per-component uptimes that have data.
  const overallUptime = useMemo(() => {
    if (!data) return null;
    const percents = Object.values(data.uptime ?? {}).filter(
      (p): p is number => p !== null,
    );
    if (percents.length === 0) return null;
    const avg = percents.reduce((sum, p) => sum + p, 0) / percents.length;
    return Math.round(avg * 10) / 10;
  }, [data]);

  const lastChecked = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleTimeString()
    : "";
  const hasAnyHistory = data
    ? Object.values(data.history).some((bars) => bars.some((b) => b.status))
    : false;
  const lastFailure: Record<ComponentId, string | null> =
    data?.lastFailure ?? ({} as Record<ComponentId, string | null>);
  const incidents: IncidentRecord[] = data?.incidents ?? [];
  const maintenance: IncidentRecord[] = data?.maintenance ?? [];

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl px-4",
        embedded ? "py-6" : "min-h-screen py-8 sm:py-12",
      )}
    >
      {/* Header (hidden when embedded in a bottom sheet, which has its own) */}
      {!embedded && (
        <header className="mb-8 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20">
              <Icon icon={Droplet} className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">Flowy</span>
            <span className="mt-0.5 hidden rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:inline">
              {t("status.title")}
            </span>
          </Link>
          <ThemeToggle />
        </header>
      )}
      {/* Overall banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-2xl border border-border/40 shadow-sm"
      >
        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3 p-6 sm:flex-nowrap sm:p-8">
          {/* Status dot with pulsing halo (spinner while loading) */}
          <span className="relative flex size-12 shrink-0 items-center justify-center">
            {isInitialLoading ? (
              <RefreshCw
                className="size-5 animate-spin text-muted-foreground/60"
                aria-hidden
              />
            ) : (
              <StatusPulse
                dot={banner.dot}
                glow={banner.glow}
                ring={banner.ring}
              />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={banner.text}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-xl font-bold tracking-tight sm:text-2xl"
              >
                {banner.text}
              </motion.h1>
            </AnimatePresence>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("status.description")}
            </p>
          </div>

          {/* Uptime stat — full-width row on mobile, right-aligned on sm+ */}
          {overallUptime !== null && (
            <div className="order-last flex w-full shrink-0 flex-col sm:order-none sm:w-auto sm:items-end">
              <AnimatedNumber
                value={overallUptime}
                duration={700}
                formatter={(v) => `${v.toFixed(1)}%`}
                className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl"
              />
              <span className="text-[11px] text-muted-foreground/70">
                {t("status.uptime90")}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void fetchStatus();
            }}
            disabled={refreshing}
            aria-label={t("status.refresh")}
            title={t("status.refresh")}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            <Icon
              icon={RefreshCw}
              className={cn("size-4", refreshing && "animate-spin")}
            />
          </button>
        </div>

        {/* Live / last checked strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/30 bg-muted/20 px-6 py-2.5 text-[11px] text-muted-foreground/70 sm:px-8">
          <span className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", banner.dot)} />
            {t("status.live")}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon icon={RefreshCw} className="size-3" />
            {t("status.autoRefresh")}
          </span>
          {data && (
            <span className="ml-auto flex items-center gap-1.5">
              {t("status.lastChecked")}: {lastChecked}
            </span>
          )}
        </div>
      </motion.div>
      {isInitialLoading ? (
        <StatusPageSkeleton label={t("common.loading")} />
      ) : (
        <>
          {/* Get notified — push alerts for status changes */}
          <GetNotifiedCard />
        </>
      )}
      {data?.stale && data.lastSuccessfulAt && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t("status.staleData", {
              time: new Date(data.lastSuccessfulAt).toLocaleTimeString(),
            })}
          </span>
        </div>
      )}
      {/* Error state */}
      <AnimatePresence>
        {error && !data && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400"
          >
            <Icon icon={XCircle} className="size-4 shrink-0" />
            {t("status.outage")}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Active incidents — most important, shown right under the banner */}
      {incidents.length > 0 && (
        <section className="mt-6" aria-label={t("status.activeIncidents")}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
            {t("status.activeIncidents")}
            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {incidents.length}
            </span>
          </h2>
          {incidents.length > 1 && (
            <p className="mb-3 text-xs text-muted-foreground">
              {t("status.incidentBanner.titleCount", {
                count: incidents.length,
              })}
            </p>
          )}
          <div className="space-y-3">
            {incidents.map((incident, index) => (
              <motion.article
                key={incident.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                      STATUS_PILL[
                        incident.status === "monitoring" ? "degraded" : "down"
                      ],
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        INCIDENT_DOT[incident.status],
                      )}
                    />
                    {t(incidentStatusKey(incident.status))}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                      SEVERITY_STYLE[incident.severity],
                    )}
                  >
                    {t(`status.incidents.severity.${incident.severity}`)}
                  </span>
                  {incident.component && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/15">
                      <Icon
                        icon={COMPONENT_META[incident.component].icon}
                        className="size-3"
                      />
                      {t(
                        `status.component${incident.component[0].toUpperCase()}${incident.component.slice(1)}`,
                      )}
                    </span>
                  )}
                  <time
                    className="ml-auto text-xs text-muted-foreground/60"
                    dateTime={incident.createdAt}
                  >
                    <RelativeTime
                      date={incident.createdAt}
                      locale={i18n.language}
                    />
                  </time>
                </div>
                <h3 className="mt-3 text-base font-semibold tracking-tight">
                  {incident.title}
                </h3>
                {incident.message && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {incident.message}
                  </p>
                )}
                {incident.updates.length > 1 && (
                  <ol className="mt-4 space-y-2.5 border-l border-border/50 pl-4">
                    {incident.updates.slice(1).map((update) => (
                      <li key={update.id} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[21px] top-1.5 size-2 rounded-full border-2 border-background",
                            SEVERITY_DOT[incident.severity],
                          )}
                        />
                        <p className="text-xs text-muted-foreground/60">
                          {t(incidentStatusKey(update.status))} ·{" "}
                          <RelativeTime
                            date={update.createdAt}
                            locale={i18n.language}
                          />
                        </p>
                        {update.message && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {update.message}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </motion.article>
            ))}
          </div>
        </section>
      )}
      {/* Scheduled maintenance */}
      {maintenance.length > 0 && (
        <section className="mt-6" aria-label={t("status.maintenanceTitle")}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
            </span>
            {t("status.maintenanceTitle")}
            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {maintenance.length}
            </span>
          </h2>
          <div className="space-y-3">
            {maintenance.map((item) => (
              <MaintenanceCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
      {isInitialLoading ? null : (
        <>
          {/* Component rows */}
          <div className="mt-6 space-y-3">
            {data?.components.map((component, index) => {
              const meta = COMPONENT_META[component.id];
              const bars = data.history[component.id] ?? [];
              const percent = data.uptime[component.id] ?? null;
              const spark = data.latency[component.id] ?? [];
              const latencyValues = spark.filter((value) => value > 0);
              const latencyMonitored =
                component.id !== "api" && component.id !== "push";
              const linkedIncident = incidents.find(
                (i) => i.component === component.id,
              );
              const componentName = t(
                `status.component${component.id[0].toUpperCase()}${component.id.slice(1)}`,
              );
              return (
                <motion.div
                  key={component.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 * index }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-4 pl-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-border/70 hover:bg-background/90 hover:shadow-md sm:p-5 sm:pl-5 before:absolute before:inset-y-0 before:left-0 before:w-0.5",
                    STATUS_EDGE[component.status],
                    linkedIncident && "border-amber-500/30 bg-amber-500/[0.03]",
                  )}
                >
                  <button
                    type="button"
                    aria-label={t("status.componentDetail", {
                      component: componentName,
                    })}
                    onClick={() => setDetailComponent(component.id)}
                    className="w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-border/20 transition-transform group-hover:scale-105",
                          STATUS_CHIP[component.status],
                        )}
                      >
                        <Icon icon={meta.icon} className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {componentName}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {component.latencyMs != null &&
                          component.latencyMs > 0
                            ? `${t("status.latency")}: ${component.latencyMs}ms`
                            : t("status.checkedJustNow")}
                          {percent !== null && (
                            <span className="sm:hidden"> · {percent}%</span>
                          )}
                          {component.status === "ok" &&
                            lastFailure[component.id] && (
                              <span className="ml-1.5 inline-flex items-center gap-1 text-amber-600/80 dark:text-amber-400/80">
                                ·
                                <TriangleAlert className="size-3" />
                                {t("status.lastFailure")}:{" "}
                                <RelativeTime
                                  date={lastFailure[component.id]}
                                  locale={i18n.language}
                                />
                              </span>
                            )}
                        </p>
                        {linkedIncident && (
                          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
                            <TriangleAlert className="size-3" />
                            {t("status.relatedIncident")}:{" "}
                            {linkedIncident.title}
                          </span>
                        )}
                      </div>
                      {!latencyMonitored ? (
                        <AvailabilityOnly
                          label={t("status.availabilityMonitored")}
                        />
                      ) : latencyValues.length >= 2 ? (
                        <span className="flex shrink-0 items-center px-1">
                          <LatencySparkline
                            values={latencyValues}
                            label={t("status.latency")}
                            color={
                              component.status === "ok"
                                ? "var(--color-emerald-500)"
                                : component.status === "degraded"
                                  ? "var(--color-amber-500)"
                                  : "var(--color-red-500)"
                            }
                          />
                        </span>
                      ) : (
                        <LatencyUnavailable
                          compact
                          label={t("status.latencyUnavailable")}
                          hint={t("status.latencyUnavailableHint")}
                        />
                      )}
                      {percent !== null && (
                        <AnimatedNumber
                          value={percent}
                          duration={700}
                          formatter={(v) => `${v.toFixed(1)}%`}
                          className="hidden shrink-0 text-sm font-semibold tabular-nums text-muted-foreground sm:inline"
                        />
                      )}
                      <motion.span
                        layout
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
                          STATUS_PILL[component.status],
                        )}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={component.status}
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={cn(
                              "size-1.5 rounded-full",
                              STATUS_DOT[component.status],
                            )}
                          />
                        </AnimatePresence>
                        {t(statusKey(component.status))}
                      </motion.span>
                      <Icon
                        icon={ChevronRight}
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                      />
                    </div>
                  </button>

                  {/* Uptime bars */}
                  {bars.length > 0 && (
                    <div className="mt-4 border-t border-border/30 pt-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                          {t("status.uptime90")}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          {t("status.today")}
                        </span>
                      </div>
                      <UptimeBars
                        bars={bars}
                        onSelect={(bar) =>
                          setSelectedDay({ component: component.id, bar })
                        }
                        selectedDate={
                          selectedDay?.component === component.id
                            ? selectedDay.bar.date
                            : null
                        }
                        checksLabel={t("status.checks")}
                        noDataLabel={t("status.noData")}
                        statusLabel={(status) => t(statusKey(status))}
                      />
                      {!hasAnyHistory && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground/60">
                          <Icon icon={TriangleAlert} className="size-3.5" />
                          {t("status.collecting")}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}
      {/* First-admin bootstrap — shows only when no admin exists yet.
          Once an admin is claimed, this card disappears and the admin
          panel (below) takes over. */}
      {!isInitialLoading && <ClaimAdminAccessCard />}
      {/* Admin incident management — lives on the public status page so
          incidents can be reported even when the app itself is down. */}
      {!isInitialLoading && isAdmin && <IncidentAdminPanel />}
      <ComponentDetailSheet
        component={detailComponent}
        onOpenChange={(open) => {
          if (!open) setDetailComponent(null);
        }}
      />
      <DaySummarySheet
        component={selectedDay?.component ?? null}
        bar={selectedDay?.bar ?? null}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        {hasAnyHistory && (
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border/30 bg-muted/20 px-5 py-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
              {t("status.legendLabel")}
            </span>
            <LegendItem color="bg-emerald-500" label={t("status.statusOk")} />
            <LegendItem
              color="bg-amber-500"
              label={t("status.statusDegraded")}
            />
            <LegendItem color="bg-red-500" label={t("status.statusDown")} />
            <LegendItem color="bg-border/40" label={t("status.noData")} />
          </div>
        )}
        {!embedded && (
          <footer className="mt-10 flex items-center justify-center border-t border-border/30 pt-6 text-center">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-medium text-primary/70 transition hover:text-primary hover:underline underline-offset-2"
            >
              <Icon icon={Droplet} className="size-3.5" />
              {t("status.backToApp")}
            </Link>
          </footer>
        )}
      </motion.div>
    </div>
  );
}
