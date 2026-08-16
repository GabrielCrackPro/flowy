"use client";

import { useIsFetching } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ServicesStatusList } from "@/components/status/services-status-list";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui";
import { useOfflineStatus } from "@/context/OfflineProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Activity,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  WifiOff,
} from "@/lib/icons";
import type { OverallStatus } from "@/lib/services/status";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./bottom-sheet";
import { Icon, type IconProps } from "./icon";
import { RelativeTime } from "./relative-time";
import { SyncRetryButton } from "./sync-retry-button";

// Refetches triggered by navigating to a page with cached data should not be
// labelled as "syncing"; only syncs that happen while settled on a page.
const NAV_SETTLE_MS = 400;

type ConnectionState =
  | "ok"
  | "offline"
  | "degraded"
  | "down"
  | "pending"
  | "syncing";

function SyncIndicatorIcon({
  state,
  pulseVisible,
  lastSyncEventId,
  onPulseComplete,
}: {
  state: ConnectionState;
  pulseVisible: boolean;
  lastSyncEventId: number | null;
  onPulseComplete: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const syncing = state === "syncing";
  const dotColor =
    state === "down" ? "#ef4444" : state === "ok" ? "#10b981" : "#f59e0b";
  const haloColor =
    state === "down"
      ? "rgba(239, 68, 68, 0.2)"
      : state === "ok"
        ? "rgba(16, 185, 129, 0.2)"
        : "rgba(245, 158, 11, 0.2)";

  return (
    <span className="relative flex size-3.5 items-center justify-center">
      {/* Halo — replaces the ring-2 so its color can morph instead of swap. */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{
          backgroundColor: haloColor,
          opacity: syncing ? 0 : 1,
          scale: syncing ? 0.5 : 1,
        }}
        transition={
          reducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }
        }
        className="absolute size-3 rounded-full"
      />

      {/* Core dot — crossfades red ↔ amber ↔ emerald instead of swapping. */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{
          backgroundColor: dotColor,
          opacity: syncing ? 0 : 1,
          scale: syncing ? 0.5 : 1,
        }}
        transition={
          reducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }
        }
        className="size-2 rounded-full"
      />

      {/* One-shot pulse whenever a flush completes a sync. */}
      {pulseVisible && !syncing && (
        <motion.span
          key={`pulse-${lastSyncEventId ?? 0}`}
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 2.6 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          onAnimationComplete={onPulseComplete}
          className="absolute inset-0 rounded-full bg-emerald-500"
        />
      )}

      {/* Spinner while syncing — crossfades over the dot. */}
      <AnimatePresence>
        {syncing && (
          <motion.span
            key="syncing"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.25, ease: "easeOut" }
            }
            className="absolute flex size-3 shrink-0 items-center justify-center"
          >
            <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/**
 * Numeric pill overlaid on the sync trigger while offline mutations are waiting
 * to sync. Crossfades in/out as the pending count crosses zero, and "rolls" the
 * number when the count changes while visible.
 */
function PendingCountBadge({ count }: { count: number }) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
        <motion.span
          key="pending-count"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={
            reducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }
          }
          className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold leading-none tabular-nums text-white ring-2 ring-background"
        >
          <motion.span
            key={count}
            initial={reducedMotion ? false : { opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.15, ease: "easeOut" }
            }
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function SystemStatusIndicator({ status }: { status: OverallStatus | null }) {
  const reducedMotion = useReducedMotion();
  const checking = status === null;

  const colors =
    status === "degraded"
      ? { dot: "#f59e0b", halo: "rgba(245, 158, 11, 0.2)" }
      : status === "down"
        ? { dot: "#ef4444", halo: "rgba(239, 68, 68, 0.2)" }
        : { dot: "#10b981", halo: "rgba(16, 185, 129, 0.2)" };

  // Breathing loop (disabled under reduced motion) + one-shot color morph.
  const loop = reducedMotion
    ? { duration: 0 }
    : { duration: 1.5, ease: "easeInOut" as const, repeat: Infinity };
  const morph = reducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: "easeOut" as const };

  return (
    <span className="relative flex size-3.5 shrink-0 items-center justify-center">
      {/* Halo — replaces the ring so its color can morph instead of swap. */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={
          checking
            ? { opacity: 0.25, scale: 1 }
            : { backgroundColor: colors.halo }
        }
        transition={morph}
        className={cn(
          "absolute size-3 rounded-full",
          checking && "bg-muted-foreground/40",
        )}
      />

      {/* Ripple pulse. */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{
          ...(reducedMotion
            ? { opacity: 0.25, scale: 1 }
            : { opacity: [0.5, 0, 0.5], scale: [1, 2, 1] }),
          ...(!checking && { backgroundColor: colors.dot }),
        }}
        transition={{ opacity: loop, scale: loop, backgroundColor: morph }}
        className={cn(
          "absolute size-2 rounded-full",
          checking && "bg-muted-foreground/40",
        )}
      />

      {/* Core dot — crossfades emerald ↔ amber ↔ red instead of swapping. */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{
          ...(reducedMotion
            ? { scale: 1, opacity: 1 }
            : { scale: [1, 1.2, 1], opacity: [1, 0.75, 1] }),
          ...(!checking && { backgroundColor: colors.dot }),
        }}
        transition={{ opacity: loop, scale: loop, backgroundColor: morph }}
        className={cn(
          "relative size-2 rounded-full",
          checking && "bg-muted-foreground/40",
        )}
      />
    </span>
  );
}

/**
 * The single "can I sync?" status row (device + service merged), linking to
 * the public status page. `compact` switches between mobile and popover sizing.
 */
function UnifiedStatusRow({
  compact = false,
  dot,
  icon,
  tone,
  label,
  onOpen,
}: {
  compact?: boolean;
  dot: OverallStatus | null;
  icon: IconProps["icon"];
  tone: string;
  label: string;
  onOpen?: () => void;
}) {
  const className = cn(
    "group flex w-full items-center border border-border/40 bg-muted/20 text-left transition-colors hover:bg-muted/40",
    compact
      ? "gap-2 rounded-lg px-2.5 py-2"
      : "min-h-11 gap-2.5 rounded-xl px-3",
  );

  const content = (
    <>
      <Icon
        icon={icon}
        aria-hidden="true"
        className={cn("shrink-0", compact ? "size-3.5" : "size-4", tone)}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <SystemStatusIndicator status={dot} />
      <Icon
        icon={ChevronRight}
        aria-hidden="true"
        className={cn(
          "shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5",
          compact ? "size-3.5" : "size-4",
        )}
      />
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(className, "cursor-pointer")}
      >
        {content}
      </button>
    );
  }

  return (
    <a href="/status" className={className}>
      {content}
    </a>
  );
}

/** Legend explaining the unified dot states (green / spinner / amber / red). */
function StatusLegend({
  compact = false,
  offline,
  serviceDegraded,
  serviceDown,
  hasPending,
  pendingCount,
}: {
  compact?: boolean;
  offline: boolean;
  serviceDegraded: boolean;
  serviceDown: boolean;
  hasPending: boolean;
  pendingCount: number;
}) {
  const { t } = useTranslation();

  const dotWrap = cn(
    "flex shrink-0 items-center justify-center",
    compact ? "size-3.5" : "size-4",
  );

  return (
    <div
      className={cn(
        "border-t border-border/60",
        compact ? "space-y-1.5 pt-2.5" : "space-y-2 pt-3",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.1em]",
          compact ? "text-muted-foreground/50" : "text-muted-foreground/60",
        )}
      >
        {t("offline.legendLabel")}
      </p>
      <div className="flex items-center gap-2">
        <span className={dotWrap}>
          <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
        </span>
        <span>{t("dashboard.syncInfo.upToDate")}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={dotWrap}>
          <Loader2 className="size-3 animate-spin text-primary" />
        </span>
        <span>{t("dashboard.syncing")}</span>
      </div>
      {(offline || serviceDegraded || hasPending) && (
        <div className="flex items-center gap-2">
          <span className={dotWrap}>
            <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
          </span>
          <span>
            {offline
              ? t("offline.label")
              : serviceDegraded
                ? t("status.statusDegraded")
                : t("offline.pendingChanges", { count: pendingCount })}
          </span>
        </div>
      )}
      {serviceDown && (
        <div className="flex items-center gap-2">
          <span className={dotWrap}>
            <span className="size-2 rounded-full bg-red-500 ring-2 ring-red-500/20" />
          </span>
          <span>{t("status.statusDown")}</span>
        </div>
      )}
    </div>
  );
}

/** Amber card listing queued offline mutations, with a retry when online. */
function PendingChangesCard({
  compact = false,
  offline,
  pendingCount,
  flushing,
  onRetry,
}: {
  compact?: boolean;
  offline: boolean;
  pendingCount: number;
  flushing: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center justify-between border border-amber-500/20 bg-amber-500/5",
        compact ? "gap-2 rounded-lg px-2.5 py-2" : "gap-3 rounded-xl p-3",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="size-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
        <span className="truncate">
          {t("offline.pendingChanges", { count: pendingCount })}
        </span>
      </div>
      {!offline && <SyncRetryButton onClick={onRetry} flushing={flushing} />}
    </div>
  );
}

/** Subtle "last synced" line; renders nothing until a sync has happened. */
function LastSyncRow({
  compact = false,
  lastSyncAt,
}: {
  compact?: boolean;
  lastSyncAt: number | null;
}) {
  const { t, i18n } = useTranslation();

  if (!lastSyncAt) return null;

  return (
    <div className="flex items-center gap-2 px-1">
      <Icon
        icon={Clock}
        aria-hidden="true"
        className={cn(
          "shrink-0 text-muted-foreground/60",
          compact ? "size-3.5" : "size-4",
        )}
      />
      <RelativeTime
        date={lastSyncAt}
        locale={i18n.language}
        prefix={t("offline.lastSync")}
      />
    </div>
  );
}

/** Mobile-only: the compact per-service statuses, opened as a bottom sheet. */
function StatusSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("status.title")}
      description={t("status.description")}
      icon={<Icon icon={Activity} className="size-5" />}
      externalHref="/status"
      contentClassName="px-4 py-3 sm:px-5"
    >
      <ServicesStatusList />
    </BottomSheet>
  );
}

export function SyncingIndicator({ className }: { className?: string }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
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
  const [statusOpen, setStatusOpen] = useState(false);
  const [settled, setSettled] = useState(false);

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

  const serviceDown = systemStatus === "down";
  const serviceDegraded = systemStatus === "degraded";

  // Unified connection state: device offline beats service issues, which beat
  // pending changes, which beat an in-flight sync.
  const state: ConnectionState = offline
    ? "offline"
    : serviceDown
      ? "down"
      : serviceDegraded
        ? "degraded"
        : hasPending
          ? "pending"
          : syncing
            ? "syncing"
            : "ok";

  const label =
    state === "offline"
      ? t("offline.label")
      : state === "down"
        ? t("status.statusDown")
        : state === "degraded"
          ? t("status.statusDegraded")
          : state === "pending"
            ? t("offline.pendingChanges", { count: pendingCount })
            : state === "syncing"
              ? t("dashboard.syncing")
              : t("dashboard.synced");
  const title =
    state === "offline"
      ? t("offline.label")
      : state === "down"
        ? t("status.outage")
        : state === "degraded"
          ? t("status.degraded")
          : state === "pending"
            ? t("offline.pendingTitle")
            : t("dashboard.syncInfo.title");
  const description =
    state === "offline"
      ? t("offline.popoverOffline")
      : state === "down" || state === "degraded"
        ? t("offline.serviceIssue")
        : state === "pending"
          ? t("offline.popoverPending")
          : t("dashboard.syncInfo.body");

  const headerIcon =
    state === "offline" || state === "pending"
      ? WifiOff
      : state === "down" || state === "degraded"
        ? Activity
        : Info;
  const headerColor =
    state === "down"
      ? "text-red-500"
      : state === "offline" || state === "degraded" || state === "pending"
        ? "text-amber-500"
        : "text-primary";
  const headerGradient =
    state === "down"
      ? "from-red-500/20 to-red-500/10"
      : state === "offline" || state === "degraded" || state === "pending"
        ? "from-amber-500/20 to-amber-500/10"
        : undefined;

  // The unified status row: device offline takes over, otherwise the service
  // health is the headline. The dot reflects the same merged state.
  const statusDot: OverallStatus | null = offline ? "degraded" : systemStatus;
  const statusRowLabel = offline
    ? t("offline.label")
    : `${t("status.title")}: ${systemStatusLabel}`;
  const statusRowIcon = offline ? WifiOff : Activity;
  const statusRowTone = offline ? "text-amber-500" : systemStatusTone;

  const useSheet = isMobile;

  if (useSheet) {
    return (
      <>
        <button
          type="button"
          aria-label={label}
          onClick={() => setOpen(true)}
          className={cn(
            "relative flex size-8 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
        >
          <SyncIndicatorIcon
            state={state}
            pulseVisible={pulseVisible}
            lastSyncEventId={lastSyncEventId}
            onPulseComplete={() => setPulseVisible(false)}
          />
          <PendingCountBadge count={pendingCount} />
          <span className="sr-only">{label}</span>
        </button>

        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title={title}
          description={description}
          icon={<Icon icon={headerIcon} className="size-5" />}
          iconGradient={headerGradient}
          iconColor={headerColor}
          contentClassName="px-4 py-4 sm:px-6"
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <UnifiedStatusRow
              dot={statusDot}
              icon={statusRowIcon}
              tone={statusRowTone}
              label={statusRowLabel}
              onOpen={() => {
                setOpen(false);
                setStatusOpen(true);
              }}
            />

            {hasPending && (
              <PendingChangesCard
                offline={offline}
                pendingCount={pendingCount}
                flushing={flushing}
                onRetry={() => void retrySync()}
              />
            )}

            <LastSyncRow lastSyncAt={lastSyncAt} />

            <StatusLegend
              offline={offline}
              serviceDegraded={serviceDegraded}
              serviceDown={serviceDown}
              hasPending={hasPending}
              pendingCount={pendingCount}
            />
          </div>
        </BottomSheet>

        <StatusSheet open={statusOpen} onOpenChange={setStatusOpen} />
      </>
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
          state={state}
          pulseVisible={pulseVisible}
          lastSyncEventId={lastSyncEventId}
          onPulseComplete={() => setPulseVisible(false)}
        />
        <PendingCountBadge count={pendingCount} />

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
            <Icon
              icon={headerIcon}
              aria-hidden="true"
              className={cn("size-4 shrink-0", headerColor)}
            />
            {title}
          </PopoverTitle>
          <PopoverDescription>{description}</PopoverDescription>
        </PopoverHeader>

        <div className="space-y-2 border-t pt-2.5 text-xs text-muted-foreground">
          <UnifiedStatusRow
            compact
            dot={statusDot}
            icon={statusRowIcon}
            tone={statusRowTone}
            label={statusRowLabel}
          />

          {/* Pending offline changes + retry */}
          {hasPending && (
            <PendingChangesCard
              compact
              offline={offline}
              pendingCount={pendingCount}
              flushing={flushing}
              onRetry={() => void retrySync()}
            />
          )}

          {/* Last successful sync */}
          <LastSyncRow compact lastSyncAt={lastSyncAt} />

          {/* Legend of the dot states */}
          <StatusLegend
            compact
            offline={offline}
            serviceDegraded={serviceDegraded}
            serviceDown={serviceDown}
            hasPending={hasPending}
            pendingCount={pendingCount}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
