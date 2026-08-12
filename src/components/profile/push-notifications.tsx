"use client";

import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon, RelativeTime } from "@/components/shared";
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
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { type PushDevice, pushApi } from "@/lib/api/push";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Info,
  ListChecks,
  Loader2,
  Monitor,
  Repeat2,
  Send,
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
import { PUSH_ALERT_TYPES, type PushAlertType } from "@/lib/push-preferences";
import { cn } from "@/lib/utils";

type TestResult =
  | { status: "sent"; sent: number }
  | { status: "noDevices"; sent: 0 }
  | { status: "error"; sent: 0 };

type DeviceKind = "mobile" | "tablet" | "desktop";

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

/** Best-effort device category from a stored User-Agent header. */
function getDeviceKind(userAgent: string | null | undefined): DeviceKind {
  const ua = userAgent ?? "";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/iPhone|iPod|Android|Mobile/i.test(ua)) return "mobile";
  return "desktop";
}

/** Friendly device name from a stored User-Agent header. */
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

function UnavailableState({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
      <Icon icon={Info} className="mt-0.5 size-4 shrink-0" />
      <p>{text}</p>
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
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [devicesBusy, setDevicesBusy] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  // Load the stored preferences and device list whenever the subscription
  // state changes, and identify the current browser's device.
  useEffect(() => {
    if (!subscribed) {
      setPrefs([]);
      setPrefsLoaded(false);
      setDevices([]);
      setCurrentEndpoint(null);
      return;
    }
    let cancelled = false;
    setPrefsLoaded(false);
    void Promise.all([pushApi.status(), pushApi.getPreferences()])
      .then(([status, prefsResult]) => {
        if (cancelled) return;
        setDevices(status.subscriptions ?? []);
        setPrefs(prefsResult.preferences);
        setPrefsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setPrefsLoaded(true);
      });
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
  const enabledPrefs = prefs.length === 0 ? PUSH_ALERT_TYPES : prefs;

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

  const togglePreference = async (type: PushAlertType) => {
    if (prefsBusy) {
      return;
    }
    const next =
      prefs.length === 0
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
    <CardHeader>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
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

  const sendTest = async () => {
    if (sending) {
      return;
    }
    setSending(true);
    try {
      const result = await pushApi.sendTest({
        title: t("settings.notifications.testTitle"),
        description: t("settings.notifications.testBody"),
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
        <div className="flex flex-col gap-5">
          {/* Master toggle */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-primary">
                <Icon icon={BellRing} className="size-5" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">
                  {t("settings.notifications.pushLabel")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {permission === "denied"
                    ? t("settings.notifications.denied")
                    : subscribed
                      ? t("settings.notifications.enabled")
                      : t("settings.notifications.disabled")}
                </p>
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
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              <Icon icon={TriangleAlert} className="mt-0.5 size-4 shrink-0" />
              <p>{t("settings.notifications.deniedHint")}</p>
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
              {/* Alert preferences */}
              <div className="space-y-2.5">
                <SectionLabel icon={ListChecks}>
                  {t("settings.notifications.prefsTitle")}
                </SectionLabel>
                {!prefsLoaded ? (
                  <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                    <Icon icon={Loader2} className="size-3.5 animate-spin" />
                    {t("common.saving")}
                  </div>
                ) : (
                  <ul className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                    {PUSH_ALERT_TYPES.map((type) => (
                      <li
                        key={type}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30"
                      >
                        <span className="text-sm text-foreground/80">
                          {t(`settings.notifications.prefs.${type}`)}
                        </span>
                        <Switch
                          size="sm"
                          checked={enabledPrefs.includes(type)}
                          disabled={prefsBusy}
                          onCheckedChange={() => void togglePreference(type)}
                          aria-label={t(`settings.notifications.prefs.${type}`)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Devices */}
              {devices.length > 0 && (
                <div className="space-y-2.5">
                  <SectionLabel icon={Smartphone}>
                    {t("settings.notifications.devicesTitle")}
                  </SectionLabel>
                  <ul className="space-y-1.5">
                    {devices.map((device) => {
                      const isCurrent = currentEndpoint === device.endpoint;
                      const kind = getDeviceKind(device.userAgent);
                      const DeviceIcon = DEVICE_KIND_ICONS[kind];
                      return (
                        <li
                          key={device.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-card/60 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                DEVICE_KIND_CHIP[kind],
                              )}
                            >
                              <DeviceIcon className="size-4" />
                            </span>
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-sm font-medium text-foreground/90">
                                {formatDeviceName(device.userAgent, t)}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                <RelativeTime
                                  date={device.createdAt}
                                  locale={i18n.language}
                                />
                              </p>
                            </div>
                          </div>
                          {isCurrent ? (
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[10px]"
                            >
                              {t("settings.notifications.currentDevice")}
                            </Badge>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void removeDevice(device)}
                              disabled={devicesBusy}
                              aria-label={t(
                                "settings.notifications.removeDevice",
                              )}
                              className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Test */}
              <div className="space-y-2.5 border-t border-border/40 pt-4">
                <SectionLabel icon={Send}>
                  {t("settings.notifications.testSection")}
                </SectionLabel>
                <div className="flex flex-col items-start gap-2">
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
                    <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
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
                    <p className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                      <Icon icon={TriangleAlert} className="size-4 shrink-0" />
                      {t("settings.notifications.sendTestNoDevices")}
                    </p>
                  )}
                  {testResult?.status === "error" && (
                    <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <Icon icon={XCircle} className="size-4 shrink-0" />
                      {t("common.unexpectedError")}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
