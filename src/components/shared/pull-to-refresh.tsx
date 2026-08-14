"use client";

import { motion, useAnimation, useReducedMotion } from "framer-motion";
import {
  type TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useHaptic } from "@/hooks/useHaptic";
import { useIsMobile } from "@/hooks/useIsMobile";
import { queryClient } from "@/lib/react-query/client";

const PULL_THRESHOLD = 80; // px before refresh triggers on release
const MAX_PULL = 120; // max visual pull distance
const RESISTANCE = 0.4; // pull resistance factor (lower = harder to pull)

/** Tiny spinner used inside the pull indicator. Matches the app theme. */
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-primary"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

type Phase = "idle" | "pulling" | "threshold-reached" | "refreshing";

/**
 * Pull-to-refresh gesture for mobile viewports — browsers and installed PWAs
 * alike, so both behave identically.
 *
 * When the user overscrolls at the very top of the scroll container (touch only),
 * a subtle indicator appears. Pull past 80 px, release, and every active TanStack
 * Query query is refetched — no full page reload.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const controls = useAnimation();
  const haptic = useHaptic();
  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<Phase>("idle");
  const [distance, setDistance] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const refreshing = useRef(false);
  const enabled = isMobile;

  // ── Touch handlers ──────────────────────────────────────────────
  const onTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!enabled || refreshing.current) return;
      const el = containerRef.current?.closest("[data-scroll-container]");
      if (!(el instanceof HTMLElement)) return;
      // Only start when scrolled fully to the top
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      setPhase("pulling");
      setDistance(0);
    },
    [enabled],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!enabled || refreshing.current || phase === "idle") return;
      const delta = e.touches[0].clientY - startY.current;

      if (delta <= 0) {
        setDistance(0);
        setPhase("idle");
        return;
      }

      // Prevent the browser's native pull-to-refresh
      if (delta > 5) {
        e.preventDefault();
      }

      const resisted = Math.min(delta * RESISTANCE, MAX_PULL);
      const nextPhase =
        resisted >= PULL_THRESHOLD ? "threshold-reached" : "pulling";
      if (nextPhase === "threshold-reached" && phase !== "threshold-reached") {
        haptic("light");
      }
      setDistance(resisted);
      setPhase(nextPhase);
    },
    [enabled, phase, haptic],
  );

  const onTouchEnd = useCallback(async () => {
    if (!enabled || refreshing.current) return;

    if (phase === "threshold-reached") {
      setPhase("refreshing");
      refreshing.current = true;

      try {
        // Invalidate all active queries to trigger a data refresh
        await queryClient.refetchQueries(
          { type: "active" },
          { cancelRefetch: false },
        );
      } catch {
        // Silently ignore — queries handle their own errors
      }

      // Brief pause so the user sees the spinner
      await new Promise((r) => setTimeout(r, 400));
      haptic("success");
      refreshing.current = false;
    }

    // Spring back to idle
    await controls.start({
      height: 0,
      transition: reducedMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 400, damping: 32 },
    });

    setDistance(0);
    setPhase("idle");
  }, [enabled, phase, controls, reducedMotion, haptic]);

  // ── Animate the indicator height ────────────────────────────────
  useEffect(() => {
    if (phase === "refreshing") {
      controls.start({ height: 56 });
    } else if (phase === "idle") {
      controls.start({ height: 0 });
    } else {
      controls.start({ height: distance });
    }
  }, [phase, distance, controls]);

  // Don't render the touch wrapper at all on desktop
  if (!enabled) return <>{children}</>;

  // ── Label ───────────────────────────────────────────────────────
  const label =
    phase === "refreshing"
      ? t("pwa.refreshing")
      : phase === "threshold-reached"
        ? t("pwa.releaseToRefresh")
        : t("pwa.pullToRefresh");

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative min-h-0"
    >
      {/* Pull indicator — slides down from the top */}
      <motion.div
        animate={controls}
        initial={{ height: 0 }}
        className="flex items-center justify-center gap-2 overflow-hidden text-[11px] text-muted-foreground"
      >
        {phase === "refreshing" ? (
          <Spinner />
        ) : (
          <svg
            className="h-3.5 w-3.5 transition-transform duration-200"
            style={{
              transform:
                phase === "threshold-reached"
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
            }}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 3.333v9.334M4 7.333l4-4 4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span className="select-none">{label}</span>
      </motion.div>

      {children}
    </div>
  );
}
