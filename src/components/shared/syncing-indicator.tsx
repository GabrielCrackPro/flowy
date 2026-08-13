"use client";

import { useIsFetching } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui";
import { useOfflineStatus } from "@/context/OfflineProvider";
import { usePwa } from "@/hooks/usePwa";
import { Activity, Clock, Info, Loader2, Wifi, WifiOff } from "@/lib/icons";
import type { OverallStatus } from "@/lib/services/status";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { RelativeTime } from "./relative-time";
import { SyncRetryButton } from "./sync-retry-button";

// Refetches triggered by navigating to a page with cached data should not be
// labelled as "syncing"; only syncs that happen while settled on a page.
const NAV_SETTLE_MS = 400;

function SyncIndicatorIcon({
  offline,
  hasPending,
  syncing,
  pulseVisible,
  lastSyncEventId,
  onPulseComplete,
}: {
  offline: boolean;
  hasPending: boolean;
  syncing: boolean;
  pulseVisible: boolean;
  lastSyncEventId: number | null;
  onPulseComplete: () => void;
}) {
  return (
    <span className="flex size-3.5 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {offline || hasPending ? (
          <motion.span
            key="offline"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="flex size-3 shrink-0 items-center justify-center"
          >
            <span className="size-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
          </motion.span>
        ) : syncing ? (
          <motion.span
            key="syncing"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="flex size-3 shrink-0 items-center justify-center"
          >
            <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
          </motion.span>
        ) : (
          <motion.span
            key="synced"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="relative flex size-3 shrink-0 items-center justify-center"
          >
            {pulseVisible && (
              <motion.span
                key={`pulse-${lastSyncEventId ?? 0}`}
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 2.6 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                onAnimationComplete={onPulseComplete}
                className="absolute inset-0 rounded-full bg-emerald-500"
              />
            )}
            <span className="size-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function SystemStatusIndicator({ status }: { status: OverallStatus | null }) {
  const reducedMotion = useReducedMotion();
  const tone =
    status === "degraded"
      ? "bg-amber-500 ring-amber-500/20"
      : status === "down"
        ? "bg-red-500 ring-red-500/20"
        : status === "ok"
          ? "bg-emerald-500 ring-emerald-500/20"
          : "bg-muted-foreground/40 ring-border/40";
  const dot = tone.split(" ")[0];

  return (
    <span className="relative flex size-3.5 shrink-0 items-center justify-center">
      <motion.span
        aria-hidden="true"
        animate={
          reducedMotion
            ? { opacity: 0.25, scale: 1 }
            : { opacity: [0.5, 0, 0.5], scale: [1, 2, 1] }
        }
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 1.5, ease: "easeInOut" as const, repeat: Infinity }
        }
        className={cn("absolute size-2 rounded-full", dot)}
      />
      <motion.span
        aria-hidden="true"
        animate={
          reducedMotion
            ? { scale: 1 }
            : { scale: [1, 1.2, 1], opacity: [1, 0.75, 1] }
        }
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 1.5, ease: "easeInOut" as const, repeat: Infinity }
        }
        className={cn("relative size-2 rounded-full ring-2", tone)}
      />
    </span>
  );
}

export function SyncingIndicator({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const { isStandalone } = usePwa();
  const {
    isOnline,
    pendingCount,
    lastSyncAt,
    flushing,
    lastSyncEventId,
    retrySync,
  } = useOfflineStatus();
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Pulse the green dot once whenever a flush successfully syncs changes.
  // `lastSyncEventId` is a monotonic counter, so it also keys the animation
  // to force a replay on every new sync event.
  const [pulseVisible, setPulseVisible] = useState(false);
  const prevSyncEventRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      lastSyncEventId !== null &&
      lastSyncEventId !== prevSyncEventRef.current
    ) {
      prevSyncEventRef.current = lastSyncEventId;
      setPulseVisible(true);
    }
  }, [lastSyncEventId]);

  // Ignore refetches that fire right after navigation (cached queries refetch
  // on mount) so the spinner only reflects syncs while settled on a page.
  // On initial mount the refs match, so we just arm the settle timer instead of
  // early-returning (which would leave the badge permanently unsynced).
  useEffect(() => {
    const navigated = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;
    if (navigated) setSettled(false);
    const timer = setTimeout(() => setSettled(true), NAV_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  const isFetching = useIsFetching({
    predicate: (query) => query.state.data !== undefined,
  });
  const syncing = settled && isFetching > 0;
  const offline = !isOnline;
  const hasPending = pendingCount > 0;

  // System status (from the lightweight summary endpoint — no probes) shown
  // inside the popover with a link to the public status page.
  const [systemStatus, setSystemStatus] = useState<OverallStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch("/api/status/summary", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = (await response.json()) as {
          overall: OverallStatus;
        };
        if (!cancelled) setSystemStatus(body.overall);
      } catch {
        // Keep the last known state; a failed poll shouldn't break the popover.
      }
    };
    void poll();
    const interval = window.setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);
  const systemStatusLabel =
    systemStatus === null
      ? t("status.checking")
      : systemStatus === "degraded"
        ? t("status.statusDegraded")
        : systemStatus === "down"
          ? t("status.statusDown")
          : t("status.statusOk");
  const systemStatusTone =
    systemStatus === null
      ? "text-muted-foreground/60"
      : systemStatus === "degraded"
        ? "text-amber-500"
        : systemStatus === "down"
          ? "text-red-500"
          : "text-emerald-500";

  const label = offline
    ? t("offline.label")
    : hasPending
      ? t("offline.pendingChanges", { count: pendingCount })
      : syncing
        ? t("dashboard.syncing")
        : t("dashboard.synced");
  const useDialog = isStandalone || isMobile;

  if (useDialog) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          aria-label={label}
          className={cn(
            "flex size-8 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
        >
          <SyncIndicatorIcon
            offline={offline}
            hasPending={hasPending}
            syncing={syncing}
            pulseVisible={pulseVisible}
            lastSyncEventId={lastSyncEventId}
            onPulseComplete={() => setPulseVisible(false)}
          />
          <span className="sr-only">{label}</span>
        </DialogTrigger>
        <DialogContent className="max-h-[min(90dvh,640px)] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="flex items-center gap-2">
              {offline || hasPending ? (
                <Icon
                  icon={WifiOff}
                  aria-hidden="true"
                  className="size-4 shrink-0 text-amber-500"
                />
              ) : (
                <Icon
                  icon={Info}
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
              )}
              {offline
                ? t("offline.label")
                : hasPending
                  ? t("offline.pendingTitle")
                  : t("dashboard.syncInfo.title")}
            </DialogTitle>
            <DialogDescription>
              {offline
                ? t("offline.popoverOffline")
                : hasPending
                  ? t("offline.popoverPending")
                  : t("dashboard.syncInfo.body")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 border-t pt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Icon
                icon={offline ? WifiOff : Wifi}
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0",
                  offline ? "text-amber-500" : "text-emerald-500",
                )}
              />
              <span>{offline ? t("offline.label") : t("offline.online")}</span>
            </div>
            {hasPending && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                  <span className="truncate">
                    {t("offline.pendingChanges", { count: pendingCount })}
                  </span>
                </div>
                {!offline && (
                  <SyncRetryButton
                    onClick={() => void retrySync()}
                    flushing={flushing}
                  />
                )}
              </div>
            )}
            {lastSyncAt && (
              <div className="flex items-center gap-2">
                <Icon
                  icon={Clock}
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground/60"
                />
                <RelativeTime
                  date={lastSyncAt}
                  locale={i18n.language}
                  prefix={t("offline.lastSync")}
                />
              </div>
            )}
            <a
              href="/status"
              className="flex min-h-11 items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 transition-colors hover:bg-muted/40"
            >
              <Icon
                icon={Activity}
                aria-hidden="true"
                className={cn("size-4 shrink-0", systemStatusTone)}
              />
              <span className="min-w-0 flex-1 truncate">
                {t("status.title")}: {systemStatusLabel}
              </span>
              <SystemStatusIndicator status={systemStatus} />
            </a>

            {/* Keep the mobile dialog's status legend in sync with desktop. */}
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                {t("offline.legendLabel")}
              </p>
              <div className="flex items-center gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center">
                  <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                </span>
                <span>{t("dashboard.syncInfo.upToDate")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center">
                  <Loader2 className="size-3 animate-spin text-primary" />
                </span>
                <span>{t("dashboard.syncing")}</span>
              </div>
              {(offline || hasPending) && (
                <div className="flex items-center gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                  </span>
                  <span>
                    {offline
                      ? t("offline.label")
                      : t("offline.pendingChanges", { count: pendingCount })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          "group relative flex size-6 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50",
          className,
        )}
      >
        <SyncIndicatorIcon
          offline={offline}
          hasPending={hasPending}
          syncing={syncing}
          pulseVisible={pulseVisible}
          lastSyncEventId={lastSyncEventId}
          onPulseComplete={() => setPulseVisible(false)}
        />

        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border/60 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-lg shadow-black/5 transition-opacity duration-150",
            !open && "group-hover:opacity-100",
          )}
        >
          {label}
        </span>

        <span className="sr-only">{label}</span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-80 p-3"
      >
        <PopoverHeader>
          <PopoverTitle className="flex items-center gap-2">
            {offline || hasPending ? (
              <Icon
                icon={WifiOff}
                aria-hidden="true"
                className="size-4 shrink-0 text-amber-500"
              />
            ) : (
              <Icon
                icon={Info}
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
            )}
            {offline
              ? t("offline.label")
              : hasPending
                ? t("offline.pendingTitle")
                : t("dashboard.syncInfo.title")}
          </PopoverTitle>
          <PopoverDescription>
            {offline
              ? t("offline.popoverOffline")
              : hasPending
                ? t("offline.popoverPending")
                : t("dashboard.syncInfo.body")}
          </PopoverDescription>
        </PopoverHeader>

        <div className="space-y-1.5 border-t pt-2.5 text-xs text-muted-foreground">
          {/* Connection state */}
          <div className="flex items-center gap-2">
            <Icon
              icon={offline ? WifiOff : Wifi}
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0",
                offline ? "text-amber-500" : "text-emerald-500",
              )}
            />
            <span>{offline ? t("offline.label") : t("offline.online")}</span>
          </div>

          {/* Pending offline changes + retry */}
          {hasPending && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                </span>
                <span className="truncate">
                  {t("offline.pendingChanges", { count: pendingCount })}
                </span>
              </div>
              {!offline && (
                <SyncRetryButton
                  onClick={() => void retrySync()}
                  flushing={flushing}
                />
              )}
            </div>
          )}

          {/* Last successful sync */}
          {lastSyncAt && (
            <div className="flex items-center gap-2">
              <Icon
                icon={Clock}
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted-foreground/60"
              />
              <RelativeTime
                date={lastSyncAt}
                locale={i18n.language}
                prefix={t("offline.lastSync")}
              />
            </div>
          )}

          {/* System status */}
          <a
            href="/status"
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted/40"
          >
            <Icon
              icon={Activity}
              aria-hidden="true"
              className={cn("size-3.5 shrink-0", systemStatusTone)}
            />
            <span className="flex-1">
              {t("status.title")}: {systemStatusLabel}
            </span>
            <SystemStatusIndicator status={systemStatus} />
          </a>

          {/* Legend of the dot states */}
          <div className="space-y-1.5 border-t border-border/60 pt-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
              {t("offline.legendLabel")}
            </p>
            <div className="flex items-center gap-2">
              <span className="flex size-3.5 shrink-0 items-center justify-center">
                <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              </span>
              <span>{t("dashboard.syncInfo.upToDate")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-3.5 shrink-0 items-center justify-center">
                <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
              </span>
              <span>{t("dashboard.syncing")}</span>
            </div>
            {(offline || hasPending) && (
              <div className="flex items-center gap-2">
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                </span>
                <span>
                  {offline
                    ? t("offline.label")
                    : t("offline.pendingChanges", { count: pendingCount })}
                </span>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
