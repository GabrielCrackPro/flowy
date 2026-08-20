"use client";

import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ConfirmDialog, Icon, RelativeTime } from "@/components/shared";
import { toast } from "@/components/shared/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { authenticatedRequest } from "@/lib/api/client";
import { type PushDelivery, type PushDevice, pushApi } from "@/lib/api/push";
import {
  Activity,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  Info,
  ListChecks,
  Loader2,
  Monitor,
  Pencil,
  RefreshCw,
  Repeat2,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Target,
  Trash2,
  TrendingDown,
  TriangleAlert,
  Wallet,
  XCircle,
} from "@/lib/icons";
import {
  PUSH_ALERT_TYPES,
  PUSH_ALERTS_DISABLED,
  type PushAlertType,
} from "@/lib/push-preferences";
import { cn } from "@/lib/utils";

type TestResult =
  | { status: "sent"; sent: number }
  | { status: "noDevices"; sent: 0 }
  | { status: "error"; sent: 0 };

type DeviceKind = "mobile" | "tablet" | "desktop";
type DeviceHealth = "active" | "attention" | "stale";
type DeviceFilter = "all" | DeviceHealth;

const DEVICE_FILTERS: DeviceFilter[] = ["all", "active", "attention", "stale"];

const DEVICE_HEALTH_CHIP: Record<DeviceHealth, string> = {
  active:
    "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400",
  attention:
    "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400",
  stale: "bg-muted text-muted-foreground ring-1 ring-border/50",
};

const DEVICE_KIND_ICONS: Record<DeviceKind, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

const DEVICE_KIND_CHIP: Record<DeviceKind, string> = {
  mobile: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  tablet: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  desktop: "bg-muted text-muted-foreground",
};

const STATUS_COMPONENT_META = {
  api: Activity,
  database: Database,
  auth: ShieldCheck,
  push: BellRing,
  storage: HardDrive,
} as const;

const SEVERITY_ICON = {
  minor: CheckCircle2,
  major: TriangleAlert,
  critical: XCircle,
} as const;

const SEVERITY_STYLE = {
  minor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  major: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400",
} as const;

const PUSH_ALERT_META: Record<
  PushAlertType,
  { icon: typeof Bell; tone: string }
> = {
  overspending: {
    icon: TrendingDown,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  "budget-exceeded": {
    icon: Wallet,
    tone: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  "budget-near": {
    icon: Wallet,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  "upcoming-payment": {
    icon: Repeat2,
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  "goal-deadline": {
    icon: Target,
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  "goal-achieved": {
    icon: CheckCircle2,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  "low-savings": {
    icon: TrendingDown,
    tone: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  "no-budgets": {
    icon: ListChecks,
    tone: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
};

/** Best-effort device category from a stored User-Agent header. */
function getDeviceKind(userAgent: string | null | undefined): DeviceKind {
  const ua = userAgent ?? "";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/iPhone|iPod|Android|Mobile/i.test(ua)) return "mobile";
  return "desktop";
}

/** Friendly device name from a stored User-Agent header. */
function getDeviceHealth(device: PushDevice): DeviceHealth {
  if (device.lastDeliveryStatus === "failed" || device.failureCount > 0) {
    return "attention";
  }
  const lastSeen = new Date(
    device.lastSeenAt ?? device.updatedAt ?? device.createdAt,
  ).getTime();
  return Date.now() - lastSeen > 30 * 24 * 60 * 60 * 1000 ? "stale" : "active";
}

function getDeviceGroupKey(device: PushDevice, t: TFunction): string {
  return `${device.deviceName ?? formatDeviceName(device.userAgent, t)}:${device.installationType ?? "unknown"}`;
}

function formatDeviceName(
  userAgent: string | null | undefined,
  t: TFunction,
): string {
  if (!userAgent) {
    return t("settings.notifications.deviceUnknown");
  }
  const ua = userAgent;
  let os = "OS";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  return getDeviceKind(ua) === "desktop"
    ? t("settings.notifications.deviceOn", { browser, os })
    : t("settings.notifications.deviceMobile", { browser, os });
}

function UnavailableState({
  text,
  action,
}: {
  text: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Icon icon={Info} className="mt-0.5 size-4 shrink-0" />
        <p>{text}</p>
      </div>
      {action ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          <RefreshCw className="size-3.5" />
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

/** Small uppercase section heading with an icon. */
function SectionLabel({
  icon,
  children,
}: {
  icon: typeof Bell;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon icon={icon} className="size-3.5 text-muted-foreground" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

export function PushNotificationsCard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const {
    supported,
    configured,
    checked,
    permission,
    subscribed,
    busy,
    enable,
    disable,
  } = usePushNotifications();
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [statusPrefs, setStatusPrefs] = useState<{
    enabled: boolean;
    components: string[];
    severities: string[];
  } | null>(null);
  const [statusPrefsBusy, setStatusPrefsBusy] = useState(false);
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<PushDelivery[]>([]);
  const [devicesBusy, setDevicesBusy] = useState(false);
  const [removeAllOpen, setRemoveAllOpen] = useState(false);
  const [removingAll, setRemovingAll] = useState(false);
  const [removeStaleOpen, setRemoveStaleOpen] = useState(false);
  const [removingStale, setRemovingStale] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all");
  const [devicesRefreshBusy, setDevicesRefreshBusy] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [renamingDeviceId, setRenamingDeviceId] = useState<string | null>(null);
  const [deviceNameDraft, setDeviceNameDraft] = useState("");
  const pushQueryScope = user?.id ?? "anonymous";
  const devicesQuery = useQuery({
    queryKey: ["push-subscriptions", pushQueryScope],
    queryFn: pushApi.status,
    enabled: subscribed,
    staleTime: 30000,
  });
  const prefsQuery = useQuery({
    queryKey: ["push-preferences", pushQueryScope],
    queryFn: pushApi.getPreferences,
    enabled: subscribed,
    staleTime: 30000,
  });
  const statusPrefsQuery = useQuery({
    queryKey: ["status-preferences", pushQueryScope],
    queryFn: pushApi.getStatusPreferences,
    enabled: subscribed,
    staleTime: 30000,
  });
  const deliveryHistoryQuery = useQuery({
    queryKey: ["push-delivery-history", pushQueryScope],
    queryFn: () =>
      authenticatedRequest<{ deliveries: PushDelivery[] }>(
        "/api/push-delivery-history",
        { method: "GET" },
      ),
    enabled: subscribed,
    staleTime: 30000,
  });

  // Keep settings and device information live when another tab or device
  // changes the same account. RealtimeSyncProvider invalidates these keys.
  useEffect(() => {
    if (!subscribed) {
      setPrefs([]);
      setPrefsLoaded(false);
      setStatusPrefs(null);
      setDevices([]);
      setDeliveryHistory([]);
      setCurrentEndpoint(null);
      return;
    }
    setPrefsLoaded(prefsQuery.isFetched);
    if (devicesQuery.data) {
      setDevices(devicesQuery.data.subscriptions ?? []);
    }
    if (prefsQuery.data) {
      setPrefs(prefsQuery.data.preferences);
    }
    if (statusPrefsQuery.data) {
      setStatusPrefs({
        enabled: statusPrefsQuery.data.enabled,
        components: statusPrefsQuery.data.components,
        severities: statusPrefsQuery.data.severities,
      });
    }
    if (deliveryHistoryQuery.data) {
      setDeliveryHistory(deliveryHistoryQuery.data.deliveries ?? []);
    }
  }, [
    subscribed,
    devicesQuery.data,
    prefsQuery.data,
    prefsQuery.isFetched,
    statusPrefsQuery.data,
    deliveryHistoryQuery.data,
  ]);

  // Load the browser's current endpoint whenever the subscription state
  // changes, and identify the current browser's device.
  useEffect(() => {
    if (!subscribed) {
      setCurrentEndpoint(null);
      return;
    }
    let cancelled = false;
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => {
        if (!cancelled) {
          setCurrentEndpoint(subscription?.endpoint ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [subscribed]);

  // An empty stored list means every type is enabled (legacy default).
  const enabledPrefs = prefs.includes(PUSH_ALERTS_DISABLED)
    ? []
    : prefs.length === 0
      ? PUSH_ALERT_TYPES
      : prefs;
  const orderedDevices = [...devices].sort((a, b) => {
    const aIsCurrent = currentEndpoint === a.endpoint;
    const bIsCurrent = currentEndpoint === b.endpoint;
    if (aIsCurrent !== bIsCurrent) return aIsCurrent ? -1 : 1;
    const healthOrder = { attention: 0, active: 1, stale: 2 } as const;
    const healthDifference =
      healthOrder[getDeviceHealth(a)] - healthOrder[getDeviceHealth(b)];
    if (healthDifference !== 0) return healthDifference;
    return (b.lastSeenAt ?? b.updatedAt ?? b.createdAt).localeCompare(
      a.lastSeenAt ?? a.updatedAt ?? a.createdAt,
    );
  });
  const visibleDevices = orderedDevices.filter(
    (device) =>
      deviceFilter === "all" || getDeviceHealth(device) === deviceFilter,
  );
  const similarCounts = new Map<string, number>();
  for (const device of devices) {
    const key = getDeviceGroupKey(device, t);
    similarCounts.set(key, (similarCounts.get(key) ?? 0) + 1);
  }
  const staleDeviceCount = devices.filter(
    (device) => getDeviceHealth(device) === "stale",
  ).length;

  const removeDevice = async (device: PushDevice) => {
    if (devicesBusy) {
      return;
    }
    setDevicesBusy(true);
    try {
      await pushApi.unsubscribe(device.endpoint);
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
    } catch {
      toast.error(t("settings.notifications.removeDeviceError"));
    } finally {
      setDevicesBusy(false);
    }
  };

  const renameDevice = async (device: PushDevice) => {
    const name = deviceNameDraft.trim();
    if (!name || name === device.deviceName) {
      setRenamingDeviceId(null);
      return;
    }
    setDevicesBusy(true);
    try {
      await pushApi.rename(device.id, name);
      setDevices((prev) =>
        prev.map((item) =>
          item.id === device.id ? { ...item, deviceName: name } : item,
        ),
      );
      setRenamingDeviceId(null);
    } catch {
      toast.error(t("settings.notifications.renameError"));
    } finally {
      setDevicesBusy(false);
    }
  };

  const refreshDevices = async () => {
    if (devicesRefreshBusy) return;
    setDevicesRefreshBusy(true);
    try {
      const result = await pushApi.status();
      setDevices(result.subscriptions ?? []);
    } catch {
      toast.error(t("settings.notifications.refreshError"));
    } finally {
      setDevicesRefreshBusy(false);
    }
  };

  const removeStaleDevices = async () => {
    if (removingStale) return;
    setRemovingStale(true);
    try {
      await pushApi.unsubscribeStale();
      setDevices((prev) =>
        prev.filter((device) => getDeviceHealth(device) !== "stale"),
      );
      setRemoveStaleOpen(false);
      toast.success(t("settings.notifications.removeStaleSuccess"));
    } catch {
      toast.error(t("settings.notifications.removeStaleError"));
    } finally {
      setRemovingStale(false);
    }
  };

  const removeAllDevices = async () => {
    if (removingAll) return;
    setRemovingAll(true);
    try {
      await pushApi.unsubscribeAll();
      await disable();
      setDevices([]);
      setDeliveryHistory([]);
      setCurrentEndpoint(null);
      setRemoveAllOpen(false);
      toast.success(t("settings.notifications.removeAllSuccess"));
    } catch {
      toast.error(t("settings.notifications.removeAllError"));
    } finally {
      setRemovingAll(false);
    }
  };

  const updateStatusPrefs = async (next: {
    enabled: boolean;
    components: string[];
    severities: string[];
  }) => {
    if (statusPrefsBusy) return;
    setStatusPrefsBusy(true);
    try {
      await pushApi.updateStatusPreferences(next);
      setStatusPrefs(next);
    } catch {
      toast.error(t("status.notifyPrefsError"));
    } finally {
      setStatusPrefsBusy(false);
    }
  };

  const updateAllPreferences = async (enableAll: boolean) => {
    if (prefsBusy) return;
    setPrefsBusy(true);
    const next = enableAll ? [] : [PUSH_ALERTS_DISABLED];
    try {
      await pushApi.updatePreferences(next);
      setPrefs(next);
    } catch {
      toast.error(t("settings.notifications.prefsError"));
    } finally {
      setPrefsBusy(false);
    }
  };

  const togglePreference = async (type: PushAlertType) => {
    if (prefsBusy) {
      return;
    }
    const next = prefs.includes(PUSH_ALERTS_DISABLED)
      ? [type]
      : prefs.length === 0
        ? PUSH_ALERT_TYPES.filter((t) => t !== type)
        : enabledPrefs.includes(type)
          ? prefs.filter((t) => t !== type)
          : [...prefs, type];
    setPrefsBusy(true);
    try {
      await pushApi.updatePreferences(next);
      setPrefs(next);
    } catch {
      toast.error(t("settings.notifications.prefsError"));
    } finally {
      setPrefsBusy(false);
    }
  };

  // Wait for the client-only support check before rendering a state, so SSR
  // and the first paint never show a misleading "unavailable" card.
  if (!checked) {
    return null;
  }

  const header = (
    <CardHeader className="gap-3 pb-4">
      <div className="flex items-start gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
          <Icon icon={Bell} className="size-4" />
        </span>
        <div className="min-w-0">
          <CardTitle>{t("settings.notifications.title")}</CardTitle>
          <CardDescription>
            {t("settings.notifications.description")}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );

  if (!configured) {
    return (
      <Card>
        {header}
        <CardContent>
          <UnavailableState text={t("settings.notifications.notConfigured")} />
        </CardContent>
      </Card>
    );
  }

  if (!supported) {
    return (
      <Card>
        {header}
        <CardContent>
          <UnavailableState text={t("settings.notifications.notSupported")} />
        </CardContent>
      </Card>
    );
  }

  const sendTest = async (subscriptionId?: string) => {
    if (sending) {
      return;
    }
    setSending(true);
    setTestingDeviceId(subscriptionId ?? null);
    try {
      const result = await pushApi.sendTest({
        title: t("settings.notifications.testTitle"),
        description: t("settings.notifications.testBody"),
        subscriptionId,
      });
      setTestResult(
        result.sent > 0
          ? { status: "sent", sent: result.sent }
          : { status: "noDevices", sent: 0 },
      );
    } catch {
      setTestResult({ status: "error", sent: 0 });
    } finally {
      setSending(false);
      setTestingDeviceId(null);
    }
  };

  const examples: Array<{
    icon: typeof Bell;
    text: string;
  }> = [
    { icon: Wallet, text: t("settings.notifications.examplesBudget") },
    { icon: Repeat2, text: t("settings.notifications.examplesSubscription") },
    { icon: Target, text: t("settings.notifications.examplesGoal") },
    { icon: TrendingDown, text: t("settings.notifications.examplesSavings") },
  ];

  return (
    <Card>
      {header}
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between gap-3 rounded-lg bg-linear-to-r from-primary/[0.07] via-muted/20 to-transparent px-3 py-2.5">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon icon={BellRing} className="size-4" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium leading-tight">
                  {t("settings.notifications.pushLabel")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {permission === "denied"
                    ? t("settings.notifications.denied")
                    : subscribed
                      ? t("settings.notifications.enabled")
                      : t("settings.notifications.disabled")}
                </p>
                {subscribed && (
                  <p className="pt-0.5 text-[11px] text-muted-foreground/70">
                    {t("settings.notifications.prefsSummary", {
                      alerts: enabledPrefs.length,
                      devices: devices.length,
                    })}
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={subscribed}
              disabled={busy || permission === "denied"}
              onCheckedChange={(next) => {
                void (next ? enable() : disable());
              }}
              aria-label={t("settings.notifications.pushLabel")}
            />
          </div>

          {permission === "denied" && (
            <div className="flex flex-col gap-3 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-2.5">
                <Icon icon={TriangleAlert} className="mt-0.5 size-4 shrink-0" />
                <p>{t("settings.notifications.deniedHint")}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full shrink-0 border-amber-500/30 bg-background/50 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 sm:w-auto dark:text-amber-400 dark:hover:text-amber-300"
                onClick={() => void enable()}
                disabled={busy}
              >
                <BellRing className="size-3.5" />
                {t("settings.notifications.bannerAction")}
              </Button>
            </div>
          )}

          {/* What you'll receive — shown until enabled; once subscribed the
              preferences below spell out the same types. */}
          {!subscribed && (
            <div className="space-y-2.5">
              <SectionLabel icon={Sparkles}>
                {t("settings.notifications.examplesTitle")}
              </SectionLabel>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {examples.map((example) => (
                  <li
                    key={example.text}
                    className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
                  >
                    <Icon icon={example.icon} className="size-3.5 shrink-0" />
                    {example.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {subscribed && (
            <>
              {/* Finance alert preferences */}
              <div className="space-y-3 rounded-xl bg-muted/25 p-3 sm:p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <SectionLabel icon={ListChecks}>
                    {t("settings.notifications.prefsTitle")}
                  </SectionLabel>
                  {prefsLoaded && (
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Badge
                        variant="secondary"
                        className="h-5 shrink-0 px-1.5 text-[10px] tabular-nums"
                      >
                        {enabledPrefs.length}/{PUSH_ALERT_TYPES.length}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={
                          prefsBusy ||
                          enabledPrefs.length === PUSH_ALERT_TYPES.length
                        }
                        onClick={() => void updateAllPreferences(true)}
                      >
                        <CheckCircle2 className="size-3.5" />
                        {t("settings.notifications.enableAll")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                        disabled={prefsBusy || enabledPrefs.length === 0}
                        onClick={() => void updateAllPreferences(false)}
                      >
                        <Bell className="size-3.5" />
                        {t("settings.notifications.disableAll")}
                      </Button>
                    </div>
                  )}
                </div>
                {!prefsLoaded ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Icon icon={Loader2} className="size-3.5 animate-spin" />
                    {t("common.saving")}
                  </div>
                ) : (
                  <ul className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
                    {PUSH_ALERT_TYPES.map((type) => {
                      const enabled = enabledPrefs.includes(type);
                      const { icon: AlertIcon, tone } = PUSH_ALERT_META[type];
                      return (
                        <li
                          key={type}
                          className={cn(
                            "flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                            enabled
                              ? "bg-primary/[0.06] hover:bg-primary/[0.10]"
                              : "bg-muted/25 opacity-70 hover:bg-muted/35",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-md",
                              enabled ? tone : "bg-muted text-muted-foreground",
                            )}
                          >
                            <AlertIcon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1 text-xs font-medium leading-tight text-foreground/85">
                            {t(`settings.notifications.prefs.${type}`)}
                          </span>
                          <Switch
                            size="sm"
                            checked={enabled}
                            disabled={prefsBusy}
                            onCheckedChange={() => void togglePreference(type)}
                            aria-label={t(
                              `settings.notifications.prefs.${type}`,
                            )}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Status alert preferences */}
              {statusPrefs && (
                <div className="space-y-2.5 rounded-xl bg-muted/20 p-3 sm:p-3.5">
                  <SectionLabel icon={Activity}>
                    {t("status.notifyPrefsTitle")}
                  </SectionLabel>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/25 px-2.5 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">
                        {t("status.notifyTitle")}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[11px]",
                          statusPrefs.enabled
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {statusPrefs.enabled
                          ? t("status.notifyActive")
                          : t("status.notifyMuted")}
                      </p>
                    </div>
                    <Switch
                      size="sm"
                      checked={statusPrefs.enabled}
                      disabled={statusPrefsBusy}
                      onCheckedChange={(enabled) =>
                        void updateStatusPrefs({
                          ...statusPrefs,
                          enabled: Boolean(enabled),
                        })
                      }
                      aria-label={t("status.notifyPrefsTitle")}
                    />
                  </div>
                  {statusPrefs.enabled && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {(
                          [
                            "api",
                            "database",
                            "auth",
                            "push",
                            "storage",
                          ] as const
                        ).map((component) => {
                          const selected =
                            statusPrefs.components.length === 0 ||
                            statusPrefs.components.includes(component);
                          const ServiceIcon = STATUS_COMPONENT_META[component];
                          return (
                            <div
                              key={component}
                              className={cn(
                                "flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                                selected
                                  ? "bg-primary/[0.04] hover:bg-primary/[0.08]"
                                  : "bg-muted/25 opacity-70 hover:bg-muted/35",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-6 shrink-0 items-center justify-center rounded-md",
                                  selected
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                <ServiceIcon className="size-3" />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                                {t(
                                  `status.component${component[0].toUpperCase()}${component.slice(1)}`,
                                )}
                              </span>
                              <Switch
                                size="sm"
                                checked={selected}
                                disabled={statusPrefsBusy}
                                onCheckedChange={(next) => {
                                  const current =
                                    statusPrefs.components.length === 0
                                      ? [
                                          "api",
                                          "database",
                                          "auth",
                                          "push",
                                          "storage",
                                        ]
                                      : statusPrefs.components;
                                  const nextComponents = next
                                    ? [...current, component]
                                    : current.filter(
                                        (value) => value !== component,
                                      );
                                  void updateStatusPrefs({
                                    ...statusPrefs,
                                    components:
                                      nextComponents.length === 5
                                        ? []
                                        : nextComponents,
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
                        {(["minor", "major", "critical"] as const).map(
                          (severity) => {
                            const selected =
                              statusPrefs.severities.length === 0 ||
                              statusPrefs.severities.includes(severity);
                            const SeverityIcon = SEVERITY_ICON[severity];
                            return (
                              <div
                                key={severity}
                                className={cn(
                                  "flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                                  selected
                                    ? "bg-muted/40"
                                    : "bg-muted/20 opacity-70",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-6 shrink-0 items-center justify-center rounded-md",
                                    selected
                                      ? SEVERITY_STYLE[severity]
                                      : "bg-muted text-muted-foreground",
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
                                  disabled={statusPrefsBusy}
                                  onCheckedChange={(next) => {
                                    const current =
                                      statusPrefs.severities.length === 0
                                        ? ["minor", "major", "critical"]
                                        : statusPrefs.severities;
                                    const nextSeverities = next
                                      ? [...current, severity]
                                      : current.filter(
                                          (value) => value !== severity,
                                        );
                                    void updateStatusPrefs({
                                      ...statusPrefs,
                                      severities:
                                        nextSeverities.length === 3
                                          ? []
                                          : nextSeverities,
                                    });
                                  }}
                                  aria-label={t(
                                    `status.incidents.severity.${severity}`,
                                  )}
                                />
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {devicesQuery.isFetched && devices.length === 0 && (
                <UnavailableState
                  text={t("settings.notifications.noDevices")}
                  action={{
                    label: t("settings.notifications.refreshDevices"),
                    onClick: () => void refreshDevices(),
                    disabled: devicesRefreshBusy,
                  }}
                />
              )}

              {/* Devices */}
              {devices.length > 0 && (
                <div className="space-y-3 rounded-xl bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SectionLabel icon={Smartphone}>
                      {t("settings.notifications.devicesTitle")}
                      <Badge
                        variant="secondary"
                        className="ml-0.5 h-5 min-w-5 justify-center px-1.5 text-[10px]"
                      >
                        {devices.length}
                      </Badge>
                    </SectionLabel>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-xs"
                        onClick={() => void refreshDevices()}
                        disabled={devicesRefreshBusy}
                        aria-label={t("settings.notifications.refreshDevices")}
                      >
                        <RefreshCw
                          className={cn(
                            "size-3.5",
                            devicesRefreshBusy && "animate-spin",
                          )}
                        />
                        <span className="hidden sm:inline">
                          {t("settings.notifications.refreshDevices")}
                        </span>
                      </Button>
                      {staleDeviceCount > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setRemoveStaleOpen(true)}
                          disabled={devicesBusy || removingStale}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="hidden sm:inline">
                            {t("settings.notifications.removeStale")}
                          </span>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setRemoveAllOpen(true)}
                        disabled={devicesBusy || removingAll}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="hidden sm:inline">
                          {t("settings.notifications.removeAllDevices")}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    {t("settings.notifications.devicesHint")}
                  </p>
                  <fieldset className="flex flex-wrap gap-1.5">
                    <legend className="sr-only">
                      {t("settings.notifications.devicesTitle")}
                    </legend>
                    {DEVICE_FILTERS.map((filter) => {
                      const count =
                        filter === "all"
                          ? devices.length
                          : devices.filter(
                              (device) => getDeviceHealth(device) === filter,
                            ).length;
                      return (
                        <button
                          key={filter}
                          type="button"
                          aria-pressed={deviceFilter === filter}
                          onClick={() => setDeviceFilter(filter)}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                            deviceFilter === filter
                              ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                              : "bg-muted/60 text-muted-foreground ring-1 ring-border/40 hover:text-foreground",
                          )}
                        >
                          {t(
                            `settings.notifications.filter${filter[0].toUpperCase()}${filter.slice(1)}`,
                          )}{" "}
                          <span className="tabular-nums opacity-70">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </fieldset>
                  {visibleDevices.length === 0 ? (
                    <UnavailableState
                      text={t("settings.notifications.noDevicesFilter")}
                    />
                  ) : (
                    <ul className="space-y-2">
                      {visibleDevices.map((device) => {
                        const isCurrent = currentEndpoint === device.endpoint;
                        const kind = getDeviceKind(device.userAgent);
                        const health = getDeviceHealth(device);
                        const DeviceIcon = DEVICE_KIND_ICONS[kind];
                        const groupCount =
                          similarCounts.get(getDeviceGroupKey(device, t)) ?? 1;
                        const displayName =
                          device.deviceName ??
                          formatDeviceName(device.userAgent, t);
                        const seenAt = device.lastSeenAt ?? device.updatedAt;
                        return (
                          <li
                            key={device.id}
                            className="rounded-xl bg-card/60 p-3"
                          >
                            <div className="flex min-w-0 flex-wrap items-start gap-3">
                              <span
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                  DEVICE_KIND_CHIP[kind],
                                )}
                              >
                                <DeviceIcon className="size-4" />
                              </span>
                              <div className="min-w-0 flex-1 space-y-1">
                                {renamingDeviceId === device.id ? (
                                  <div className="flex max-w-md items-center gap-1.5">
                                    <Input
                                      autoFocus
                                      value={deviceNameDraft}
                                      onChange={(event) =>
                                        setDeviceNameDraft(event.target.value)
                                      }
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          void renameDevice(device);
                                        }
                                        if (event.key === "Escape") {
                                          setRenamingDeviceId(null);
                                        }
                                      }}
                                      placeholder={t(
                                        "settings.notifications.renamePlaceholder",
                                      )}
                                      className="h-8"
                                      maxLength={80}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 shrink-0"
                                      onClick={() => void renameDevice(device)}
                                      disabled={devicesBusy}
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                      {t("settings.notifications.saveName")}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="truncate text-sm font-medium text-foreground/90">
                                      {displayName}
                                    </p>
                                    <button
                                      type="button"
                                      className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                      onClick={() => {
                                        setRenamingDeviceId(device.id);
                                        setDeviceNameDraft(
                                          device.deviceName ?? displayName,
                                        );
                                      }}
                                      aria-label={t(
                                        "settings.notifications.renameDevice",
                                      )}
                                    >
                                      <Pencil className="size-3" />
                                    </button>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground/70">
                                  <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 text-[10px]"
                                  >
                                    {device.installationType === "pwa"
                                      ? t(
                                          "settings.notifications.installationPwa",
                                        )
                                      : t(
                                          "settings.notifications.installationBrowser",
                                        )}
                                  </Badge>
                                  {isCurrent && (
                                    <Badge
                                      variant="secondary"
                                      className="h-5 px-1.5 text-[10px]"
                                    >
                                      {t(
                                        "settings.notifications.currentDevice",
                                      )}
                                    </Badge>
                                  )}
                                  {groupCount > 1 && (
                                    <span>
                                      {t(
                                        "settings.notifications.similarSubscriptions",
                                        { count: groupCount },
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground/70">
                                  <span>
                                    {t("settings.notifications.registeredAt")}{" "}
                                    <RelativeTime
                                      date={device.createdAt}
                                      locale={i18n.language}
                                    />
                                  </span>
                                  <span>
                                    {t("settings.notifications.lastSeenAt")}{" "}
                                    <RelativeTime
                                      date={seenAt}
                                      locale={i18n.language}
                                    />
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 font-medium",
                                      DEVICE_HEALTH_CHIP[health],
                                    )}
                                  >
                                    {t(
                                      `settings.notifications.deviceHealth${health[0].toUpperCase()}${health.slice(1)}`,
                                    )}
                                  </span>
                                  <span className="text-muted-foreground/70">
                                    {device.lastDeliveryAt
                                      ? `${t("settings.notifications.lastDeliveryAt")} `
                                      : ""}
                                    {device.lastDeliveryAt ? (
                                      <RelativeTime
                                        date={device.lastDeliveryAt}
                                        locale={i18n.language}
                                      />
                                    ) : (
                                      t("settings.notifications.noDelivery")
                                    )}
                                  </span>
                                  {device.failureCount > 0 && (
                                    <span className="font-medium text-amber-600 dark:text-amber-400">
                                      {t(
                                        "settings.notifications.failureCount",
                                        { count: device.failureCount },
                                      )}
                                    </span>
                                  )}
                                </div>
                                {device.lastFailureReason && (
                                  <p
                                    className="truncate text-[10px] text-amber-600 dark:text-amber-400"
                                    title={device.lastFailureReason}
                                  >
                                    {t("settings.notifications.lastFailure", {
                                      reason: device.lastFailureReason,
                                    })}
                                  </p>
                                )}
                              </div>
                              <div className="flex w-full shrink-0 flex-wrap justify-end gap-1 sm:w-auto sm:flex-col sm:items-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1 px-2 text-[10px]"
                                  onClick={() => void sendTest(device.id)}
                                  disabled={sending || devicesBusy}
                                  aria-label={t(
                                    "settings.notifications.testDevice",
                                  )}
                                >
                                  {testingDeviceId === device.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <Send className="size-3" />
                                  )}
                                  <span className="hidden sm:inline">
                                    {t("settings.notifications.test")}
                                  </span>
                                </Button>
                                {!isCurrent && (
                                  <button
                                    type="button"
                                    onClick={() => void removeDevice(device)}
                                    disabled={devicesBusy}
                                    aria-label={t(
                                      "settings.notifications.removeDevice",
                                    )}
                                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <ConfirmDialog
                    open={removeStaleOpen}
                    onOpenChange={setRemoveStaleOpen}
                    title={t("settings.notifications.removeStaleTitle")}
                    description={t(
                      "settings.notifications.removeStaleDescription",
                    )}
                    confirmLabel={t("settings.notifications.removeStale")}
                    cancelLabel={t("common.cancel")}
                    onConfirm={() => void removeStaleDevices()}
                    loading={removingStale}
                    loadingLabel={t("settings.notifications.removingStale")}
                  />
                </div>
              )}

              {/* Delivery history */}
              {deliveryHistory.length > 0 && (
                <div className="space-y-2.5 rounded-xl bg-muted/20 p-3 sm:p-3.5">
                  <SectionLabel icon={Clock}>
                    {t("settings.notifications.deliveryHistoryTitle")}
                  </SectionLabel>
                  <ul className="space-y-1.5">
                    {deliveryHistory.slice(0, 5).map((delivery) => {
                      const device = devices.find(
                        (item) => item.id === delivery.subscriptionId,
                      );
                      return (
                        <li
                          key={delivery.id}
                          className="flex items-center gap-2 rounded-lg bg-card/60 px-3 py-2"
                        >
                          {delivery.status === "sent" ? (
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="size-3.5 shrink-0 text-amber-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-foreground/80">
                              {delivery.title}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground/60">
                              {device
                                ? formatDeviceName(device.userAgent, t)
                                : t("settings.notifications.deviceUnknown")}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-0.5">
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                delivery.status === "sent"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400",
                              )}
                            >
                              {t(
                                `settings.notifications.delivery.${delivery.status}`,
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              <RelativeTime
                                date={delivery.createdAt}
                                locale={i18n.language}
                              />
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Test */}
              <div className="space-y-2.5 rounded-xl bg-muted/20 p-3 sm:p-3.5">
                <SectionLabel icon={Send}>
                  {t("settings.notifications.testSection")}
                </SectionLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sending}
                    onClick={() => void sendTest()}
                  >
                    <Icon
                      icon={sending ? Loader2 : Send}
                      className={cn("size-3.5", sending && "animate-spin")}
                    />
                    {sending
                      ? t("settings.notifications.sending")
                      : t("settings.notifications.test")}
                  </Button>

                  {testResult?.status === "sent" && (
                    <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <Icon icon={CheckCircle2} className="size-4 shrink-0" />
                      {testResult.sent === 1
                        ? t("settings.notifications.testDeliveredOne", {
                            count: testResult.sent,
                          })
                        : t("settings.notifications.testDeliveredMany", {
                            count: testResult.sent,
                          })}
                    </p>
                  )}
                  {testResult?.status === "noDevices" && (
                    <p className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Icon icon={TriangleAlert} className="size-4 shrink-0" />
                      {t("settings.notifications.sendTestNoDevices")}
                    </p>
                  )}
                  {testResult?.status === "error" && (
                    <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                      <Icon icon={XCircle} className="size-4 shrink-0" />
                      {t("common.unexpectedError")}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <ConfirmDialog
          open={removeAllOpen}
          onOpenChange={setRemoveAllOpen}
          title={t("settings.notifications.removeAllTitle")}
          description={t("settings.notifications.removeAllDescription")}
          confirmLabel={t("settings.notifications.removeAllDevices")}
          cancelLabel={t("common.cancel")}
          onConfirm={() => void removeAllDevices()}
          loading={removingAll}
          loadingLabel={t("settings.notifications.removingAll")}
        />
      </CardContent>
    </Card>
  );
}
