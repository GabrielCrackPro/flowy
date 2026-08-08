"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGradientProps {
  /** When true, classNameA is shown; when false, classNameB is shown */
  active: boolean;
  /** CSS classes for the "active/true" variant */
  classNameA: string;
  /** CSS classes for the "inactive/false" variant */
  classNameB: string;
  /** Optional container classes (e.g. positioning) */
  className?: string;
  /** Animation duration in seconds (default 0.35) */
  duration?: number;
}

/**
 * Crossfades between two gradient overlays based on the `active` prop.
 * Useful for animated background/color transitions between two states
 * (e.g. expense/income, light/dark, on/off).
 */
export function AnimatedGradient({
  active,
  classNameA,
  classNameB,
  className,
  duration = 0.35,
}: AnimatedGradientProps) {
  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={active ? "a" : "b"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration, ease: "easeInOut" }}
        className={cn(
          "pointer-events-none",
          active ? classNameA : classNameB,
          className,
        )}
      />
    </AnimatePresence>
  );
}
