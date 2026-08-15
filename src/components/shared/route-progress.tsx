"use client";

import { onlineManager } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";

const SAFETY_MS = 15000;
const COMPLETE_HOLD_MS = 220;
/** Progress asymptotes toward this value while the route is still loading. */
const NAVIGATING_CAP = 0.9;
/**
 * Exponential time constant (ms) for the progress curve: at ~1.2s the bar
 * reaches the cap, so slow loads linger visibly while fast loads complete
 * quickly. The bar always finishes at 100% exactly on route commit, so its
 * visible lifetime tracks the page's real loading time.
 */
const PROGRESS_TAU_MS = 500;

/** Cross-cutting navigation state, exposed through useRouteProgress(). */
export interface RouteProgressState {
  /** Whether a client-side route transition is currently in flight. */
  isNavigating: boolean;
  /** Progress 0..1, held below 1 until the route commits. */
  progress: number;
  /** Whether the device is currently online (mirrors TanStack onlineManager). */
  isOnline: boolean;
}

let navState: RouteProgressState = {
  isNavigating: false,
  progress: 0,
  isOnline: true,
};
const navListeners = new Set<() => void>();

function emitNavState(next: RouteProgressState) {
  navState = next;
  for (const listener of navListeners) listener();
}

function subscribeNavState(listener: () => void) {
  navListeners.add(listener);
  return () => {
    navListeners.delete(listener);
  };
}

function getNavState() {
  return navState;
}

/**
 * Read the route navigation state driven by the mounted RouteProgress bar.
 * Safe to call anywhere (defaults to idle when the bar is not mounted);
 * works from deep inside the provider tree because it uses an external
 * store instead of React context.
 */
export function useRouteProgress(): RouteProgressState {
  return useSyncExternalStore(subscribeNavState, getNavState, getNavState);
}

function RouteProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRef = useRef(false);
  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKeyRef = useRef(`${pathname}${searchParams?.toString() ?? ""}`);

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (safetyRef.current) clearTimeout(safetyRef.current);
    if (holdRef.current) clearTimeout(holdRef.current);
    rafRef.current = null;
    safetyRef.current = null;
    holdRef.current = null;
  }, []);

  const complete = useCallback(() => {
    if (!activeRef.current) return;
    clearTimers();
    emitNavState({
      isNavigating: true,
      progress: 1,
      isOnline: getNavState().isOnline,
    });
    holdRef.current = setTimeout(() => {
      activeRef.current = false;
      emitNavState({
        isNavigating: false,
        progress: 0,
        isOnline: getNavState().isOnline,
      });
    }, COMPLETE_HOLD_MS);
  }, [clearTimers]);

  const start = useCallback(() => {
    // Offline: don't fake network progress — the bar auto-hides and the
    // cached page renders directly.
    if (!getNavState().isOnline) return;

    clearTimers();

    activeRef.current = true;
    startedAtRef.current = performance.now();
    emitNavState({
      isNavigating: true,
      progress: 0.04,
      isOnline: true,
    });

    // Drive progress off real elapsed time (rAF) with an exponential curve:
    // fast at first, tapering toward the cap, so the bar's visible lifetime
    // reflects how long the page actually takes to load.
    const tick = (now: number) => {
      if (!activeRef.current) return;
      const elapsed = now - startedAtRef.current;
      const progress = Math.min(
        NAVIGATING_CAP,
        1 - Math.exp(-elapsed / PROGRESS_TAU_MS),
      );
      emitNavState({
        isNavigating: true,
        progress,
        isOnline: getNavState().isOnline,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Never leave the bar stuck if the transition never commits.
    safetyRef.current = setTimeout(() => complete(), SAFETY_MS);
  }, [clearTimers, complete]);

  // Mirror connectivity into the store (same source OfflineProvider uses) so
  // consumers and the bar itself can react to going offline.
  useEffect(() => {
    const sync = (online: boolean) => {
      emitNavState({ ...getNavState(), isOnline: online });
    };
    sync(onlineManager.isOnline());
    return onlineManager.subscribe(sync);
  }, []);

  // Detect navigation start: patch history methods + listen for back/forward.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    const patchedPush = function (
      this: History,
      ...args: Parameters<History["pushState"]>
    ) {
      const before = window.location.href;
      const result = originalPush.apply(this, args);
      if (window.location.href !== before) start();
      return result;
    };

    const patchedReplace = function (
      this: History,
      ...args: Parameters<History["replaceState"]>
    ) {
      const before = window.location.href;
      const result = originalReplace.apply(this, args);
      if (window.location.href !== before) start();
      return result;
    };

    window.history.pushState = patchedPush;
    window.history.replaceState = patchedReplace;
    window.addEventListener("popstate", start);

    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      window.removeEventListener("popstate", start);
      clearTimers();
    };
  }, [start, clearTimers]);

  // Complete when the route actually commits.
  const routeKey = `${pathname}${searchParams?.toString() ?? ""}`;
  useEffect(() => {
    if (routeKeyRef.current === routeKey) return;
    routeKeyRef.current = routeKey;
    complete();
  }, [routeKey, complete]);

  const { isNavigating: active, progress, isOnline } = useRouteProgress();

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="route-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="progressbar"
          aria-label="Page loading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-[3px]"
        >
          <motion.div
            className={cn(
              "relative h-full overflow-hidden rounded-r-full",
              isOnline
                ? "bg-gradient-to-r from-primary via-primary to-primary/60"
                : "bg-gradient-to-r from-amber-500 via-amber-500 to-amber-500/60",
            )}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 30,
              mass: 0.4,
            }}
          >
            {/* Shine sweep on the leading edge */}
            {isOnline ? (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ["-120%", "220%"] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Thin top progress bar shown during client-side route transitions. Detects
 * navigation start by patching history methods (App Router navigates through
 * them), advances on real elapsed time and completes when the route actually
 * commits (pathname or search params change), so its lifetime mirrors the
 * page's loading time. A safety timer force-completes stuck transitions.
 * Wrapped in Suspense so useSearchParams is safe to mount in the root layout.
 */
export function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <RouteProgressInner />
    </Suspense>
  );
}
