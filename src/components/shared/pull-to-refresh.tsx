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
import { cn } from "@/lib/utils";

const PULL_THRESHOLD = 80; // px before refresh triggers on release
const MAX_PULL = 120; // max visual pull distance
const RESISTANCE = 0.4; // pull resistance factor (lower = harder to pull)

const RING_SIZE = 34;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Phase = "idle" | "pulling" | "threshold-reached" | "refreshing";

interface RingProps {
  /** 0..1 — how close the pull is to the release threshold. */
  progress: number;
}

/**
 * Material-style indicator: a track ring that fills with the pull, and an
 * arrow that rotates from "pull down" toward "release up" as the user reaches
 * the threshold. Follows the finger in real time.
 */
function ProgressRing({ progress }: RingProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = RING_CIRCUMFERENCE * (1 - clamped);

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="shrink-0 text-primary"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={RING_STROKE}
      />
      {/* Progress arc — grows clockwise from the top as you pull */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        className="transition-[stroke-dashoffset] duration-75 ease-out"
      />
      {/* Arrow: points down while pulling, rotates up at the threshold */}
      <g
        transform={`rotate(${clamped * 180} ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        className="transition-transform duration-100 ease-out"
      >
        <path
          d={`M${RING_SIZE / 2} 7v14 m6-6-6 6-6-6`}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

/** Spinning arc shown while the refetch is in flight. */
function RefreshingSpinner() {
  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="shrink-0 animate-spin text-primary motion-reduce:animate-none"
      aria-hidden="true"
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={RING_STROKE}
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE * 0.62}
        strokeDashoffset={RING_CIRCUMFERENCE * 0.2}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
    </svg>
  );
}

/**
 * Pull-to-refresh gesture for mobile viewports — browsers and installed PWAs
 * alike, so both behave identically.
 *
 * When the user overscrolls at the very top of the scroll container (touch only),
 * a Material-style ring indicator follows the drag; pull past 80 px, release,
 * and every active TanStack Query query is refetched — no full page reload.
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
      controls.start({ height: 52 });
    } else if (phase === "idle") {
      controls.start({ height: 0 });
    } else {
      controls.start({ height: distance });
    }
  }, [phase, distance, controls]);

  // Don't render the touch wrapper at all on desktop
  if (!enabled) return <>{children}</>;

  // ── Indicator state ─────────────────────────────────────────────
  const progress = distance / PULL_THRESHOLD;
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
      {/* Pull indicator — floats in the gap pulled above the content */}
      <motion.div
        animate={controls}
        initial={{ height: 0 }}
        className="flex items-start justify-center overflow-hidden"
      >
        <output
          aria-live="polite"
          className={cn(
            "mt-1 flex items-center gap-2.5 rounded-full border border-border/50 bg-background/90 py-1.5 pl-1.5 pr-4 shadow-lg shadow-black/5 backdrop-blur-sm",
            phase === "refreshing" && "pr-3.5",
          )}
        >
          {phase === "refreshing" ? (
            <RefreshingSpinner />
          ) : (
            <ProgressRing progress={progress} />
          )}
          <span className="select-none text-xs font-medium text-foreground">
            {label}
          </span>
        </output>
      </motion.div>

      {children}
    </div>
  );
}
