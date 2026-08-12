"use client";

import { AnimatePresence, motion } from "framer-motion";
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
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/useProfile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { pushApi } from "@/lib/api/push";
import {
  Activity,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  Droplet,
  HardDrive,
  Loader2,
  RefreshCw,
  ShieldCheck,
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
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 60_000;

interface StatusResponse extends StatusSnapshot {
  history: Record<ComponentId, UptimeBar[]>;
  uptime: UptimePercentages;
  lastFailure: Record<ComponentId, string | null>;
  latency: Record<ComponentId, number[]>;
  incidents: IncidentRecord[];
  maintenance: IncidentRecord[];
}

const COMPONENT_META: Record<
  ComponentId,
  { icon: typeof Activity; order: number }
> = {
  api: { icon: Activity, order: 0 },
  database: { icon: Database, order: 1 },
  auth: { icon: ShieldCheck, order: 2 },
  push: { icon: BellRing, order: 3 },
  storage: { icon: HardDrive, order: 4 },
};

function statusKey(status: ComponentStatus): string {
  switch (status) {
    case "ok":
      return "status.statusOk";
    case "degraded":
      return "status.statusDegraded";
    case "down":
      return "status.statusDown";
  }
}

const STATUS_PILL: Record<ComponentStatus, string> = {
  ok: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  degraded:
    "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  down: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
};

const INCIDENT_DOT: Record<IncidentStatus, string> = {
  investigating: "bg-amber-500",
  monitoring: "bg-blue-500",
  resolved: "bg-emerald-500",
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
}: {
  values: number[];
  color: string;
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
      aria-label="latency"
    >
      <title>latency</title>
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

function incidentStatusKey(status: IncidentStatus): string {
  return `status.incidentStatus.${status}`;
}

const STATUS_DOT: Record<ComponentStatus, string> = {
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};

const STATUS_CHIP: Record<ComponentStatus, string> = {
  ok: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  degraded:
    "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  down: "from-red-500/15 to-red-500/5 text-red-600 dark:text-red-400",
};

const BAR_COLORS: Record<ComponentStatus, string> = {
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};

function UptimeBars({ bars }: { bars: UptimeBar[] }) {
  return (
    <div className="flex flex-wrap gap-px">
      {bars.map((bar, index) => (
        <motion.span
          key={bar.date}
          role="img"
          title={`${bar.date}: ${bar.status ?? "—"}`}
          aria-label={`${bar.date}: ${bar.status ?? "no data"}`}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.25,
            delay: Math.min(index * 0.004, 0.6),
            ease: "easeOut",
          }}
          whileHover={{ scale: 1.5 }}
          className={cn(
            "size-2 rounded-[3px] sm:size-2.5",
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
        if (!cancelled) setPrefs(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [subscribed, isLoggedIn]);

  const updatePrefs = async (next: {
    enabled: boolean;
    components: string[];
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
  // Empty component list = all components (legacy default).
  const enabledComponents =
    prefs && prefs.components.length > 0 ? prefs.components : allComponents;

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
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              masterEnabled
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {masterEnabled ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <TriangleAlert className="size-4" />
            )}
            {masterEnabled ? t("status.notifyActive") : t("status.notifyMuted")}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={prefsBusy}
            onClick={() => setPrefsOpen((open) => !open)}
            className="h-7 gap-1 text-xs"
          >
            <BellRing className="size-3.5" />
            {prefsOpen
              ? t("status.notifyHidePrefs")
              : t("status.notifyCustomize")}
          </Button>
        </div>

        {prefsOpen && (
          <div className="rounded-xl border border-border/50 bg-background/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium">
                {t("status.notifyPrefsTitle")}
              </span>
              <Switch
                size="sm"
                checked={masterEnabled}
                disabled={prefsBusy}
                onCheckedChange={(next) =>
                  void updatePrefs({
                    enabled: Boolean(next),
                    components: prefs?.components ?? [],
                  })
                }
                aria-label={t("status.notifyPrefsTitle")}
              />
            </div>
            {masterEnabled && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {allComponents.map((component) => {
                  const selected = enabledComponents.includes(component);
                  return (
                    <button
                      key={component}
                      type="button"
                      aria-pressed={selected}
                      disabled={prefsBusy}
                      onClick={() => {
                        const next = selected
                          ? enabledComponents.filter((c) => c !== component)
                          : [...enabledComponents, component];
                        // If every component is now enabled, store empty (all).
                        void updatePrefs({
                          enabled: true,
                          components:
                            next.length === allComponents.length ? [] : next,
                        });
                      }}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                        selected
                          ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                          : "bg-muted/60 text-muted-foreground ring-1 ring-border/40 hover:text-foreground",
                      )}
                    >
                      {t(
                        `status.component${component[0].toUpperCase()}${component.slice(1)}`,
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <BellRing className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold tracking-tight">
          {t("status.notifyTitle")}
        </h2>
        {body}
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

  useEffect(() => {
    if (!component) {
      setChecks(null);
      setError(false);
      return;
    }
    let cancelled = false;
    setChecks(null);
    setError(false);
    fetch(`/api/status/component/${component}`, { cache: "no-store" })
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
  }, [component]);

  const name = component
    ? t(`status.component${component[0].toUpperCase()}${component.slice(1)}`)
    : "";
  const failures = checks?.filter((c) => c.status !== "ok") ?? [];
  const chartData = checks
    ?.filter((c) => c.latencyMs != null)
    .map((c, index) => ({
      index,
      ms: c.latencyMs as number,
      time: new Date(c.checkedAt).toLocaleTimeString(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  return (
    <SheetLayout
      open={component !== null}
      onOpenChange={onOpenChange}
      title={name}
      description={
        component ? t("status.componentDetail", { component: name }) : undefined
      }
      icon={Activity}
      iconGradient="from-primary/20 to-primary/10"
      iconColor="text-primary"
      maxWidth="sm:max-w-lg"
    >
      {error ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {t("status.componentDetailError")}
        </p>
      ) : !checks ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("common.loading")}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center">
              <p className="text-lg font-bold tabular-nums">{checks.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                {t("status.checks")}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center">
              <p className="text-lg font-bold tabular-nums">
                {failures.length}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                {t("status.failures")}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center">
              <p className="text-lg font-bold tabular-nums">
                {chartData && chartData.length > 0
                  ? `${Math.round(
                      chartData.reduce((sum, d) => sum + d.ms, 0) /
                        chartData.length,
                    )}ms`
                  : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                {t("status.avgLatency")}
              </p>
            </div>
          </div>

          {/* Latency chart */}
          {chartData && chartData.length > 1 ? (
            <div className="rounded-xl border border-border/50 p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {t("status.latencyHistory")}
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} margin={{ left: -18, right: 4 }}>
                  <defs>
                    <linearGradient
                      id="latencyFill"
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
                    formatter={(value) => [`${value}ms`, t("status.latency")]}
                    labelFormatter={(label) => String(label)}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 10,
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ms"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#latencyFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("status.noLatencyData")}
            </p>
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
    </SheetLayout>
  );
}

export default function StatusPage() {
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
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:py-12">
      {/* Header */}
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
              <>
                <span
                  className={cn(
                    "absolute inset-0 animate-ping rounded-full opacity-30",
                    banner.glow,
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-0 rounded-full ring-4",
                    banner.ring,
                  )}
                />
                <span
                  className={cn("relative size-5 rounded-full", banner.dot)}
                />
              </>
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
      {/* Get notified — push alerts for status changes */}
      <GetNotifiedCard />
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
                    <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
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
                        <span className="absolute -left-[21px] top-1.5 size-2 rounded-full border border-border bg-background" />
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
      {/* Component rows */}
      <div className="mt-6 space-y-3">
        {data?.components.map((component, index) => {
          const meta = COMPONENT_META[component.id];
          const bars = data.history[component.id] ?? [];
          const percent = data.uptime[component.id] ?? null;
          const spark = data.latency[component.id] ?? [];
          const linkedIncident = incidents.find(
            (i) => i.component === component.id,
          );
          return (
            <motion.button
              key={component.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 * index }}
              onClick={() => setDetailComponent(component.id)}
              className={cn(
                "group cursor-pointer rounded-2xl border border-border/40 bg-background/60 p-4 text-left shadow-sm transition-colors hover:border-border/70 hover:bg-background/90 sm:p-5",
                linkedIncident && "border-amber-500/30 bg-amber-500/[0.03]",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-border/20 transition-transform group-hover:scale-105",
                    STATUS_CHIP[component.status],
                  )}
                >
                  <Icon icon={meta.icon} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {t(
                      `status.component${component.id[0].toUpperCase()}${component.id.slice(1)}`,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {component.latencyMs > 0
                      ? `${t("status.latency")}: ${component.latencyMs}ms`
                      : t("status.checkedJustNow")}
                    {percent !== null && (
                      <span className="sm:hidden"> · {percent}%</span>
                    )}
                    {component.status === "ok" && lastFailure[component.id] && (
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
                      {t("status.relatedIncident")}: {linkedIncident.title}
                    </span>
                  )}
                </div>
                {spark.length >= 2 && (
                  <LatencySparkline
                    values={spark}
                    color={
                      component.status === "ok"
                        ? "var(--color-emerald-500)"
                        : component.status === "degraded"
                          ? "var(--color-amber-500)"
                          : "var(--color-red-500)"
                    }
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
              </div>

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
                  <UptimeBars bars={bars} />
                  {!hasAnyHistory && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Icon icon={TriangleAlert} className="size-3.5" />
                      {t("status.collecting")}
                    </p>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
      {/* Admin incident management — lives on the public status page so
          incidents can be reported even when the app itself is down. */}
      {isAdmin && <IncidentAdminPanel />}
      <ComponentDetailSheet
        component={detailComponent}
        onOpenChange={(open) => {
          if (!open) setDetailComponent(null);
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
        <footer className="mt-10 flex items-center justify-center border-t border-border/30 pt-6 text-center">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-primary/70 transition hover:text-primary hover:underline underline-offset-2"
          >
            <Icon icon={Droplet} className="size-3.5" />
            {t("status.backToApp")}
          </Link>
        </footer>
      </motion.div>
    </div>
  );
}
