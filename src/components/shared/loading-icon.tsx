"use client";

import { Check as CheckData, Loader2 as Loader2Data } from "lucide";
import { MorphIcon } from "morphicons/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LucideDataIcon = Parameters<typeof MorphIcon>[0]["icon"];

/**
 * Wraps MorphIcon for smooth icon→spinner→success transitions during loading
 * states. Uses the `lucide` data package (not `lucide-react` components).
 *
 * When `loading` transitions from `true` to `false`, the icon briefly morphs
 * to a success checkmark (default) before returning to the idle icon.
 *
 * @example
 * ```tsx
 * import { Download } from "lucide";
 *
 * <LoadingIcon icon={Download} loading={isBusy} size={16} />
 * ```
 */
export function LoadingIcon({
  icon,
  loading = false,
  successIcon,
  successDuration = 600,
  size = 16,
  className,
}: {
  /** Default icon from the `lucide` data package. */
  icon: LucideDataIcon;
  /** When true, morphs to Loader2 (spinning). */
  loading?: boolean;
  /** Icon to show briefly after loading completes. Defaults to Check. */
  successIcon?: LucideDataIcon;
  /** How long the success icon is visible in ms. Defaults to 600. */
  successDuration?: number;
  /** Icon size in pixels. Defaults to 16. */
  size?: number;
  className?: string;
}) {
  const [phase, setPhase] = useState<"idle" | "loading" | "success">(
    loading ? "loading" : "idle",
  );
  const prevLoading = useRef(loading);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Detect transition from loading → not loading
    if (prevLoading.current && !loading) {
      setPhase("success");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPhase("idle");
        timerRef.current = null;
      }, successDuration);
    } else if (loading) {
      setPhase("loading");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    prevLoading.current = loading;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loading, successDuration]);

  const resolvedIcon =
    phase === "success"
      ? (successIcon ?? CheckData)
      : phase === "loading"
        ? Loader2Data
        : icon;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        phase === "loading" && "animate-spin",
        className,
      )}
    >
      <MorphIcon icon={resolvedIcon} size={size} reducedMotion="user" />
    </span>
  );
}
