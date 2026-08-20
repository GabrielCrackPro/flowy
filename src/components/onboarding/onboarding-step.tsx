"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Icon } from "@/components/shared";
import { cn } from "@/lib/utils";

/**
 * Tile styles matching the app's icon design system.
 *
 * Uses the same pattern as `EntitySheetHeader` and form dialogs:
 * - `bg-gradient-to-br from-{color}/20 to-{color}/10` gradient
 * - `text-{color}` token color
 * - `ring-1 ring-inset ring-black/5 dark:ring-white/10` standard border
 */
const TILE_STYLES: Record<string, string> = {
  welcome:
    "bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-1 ring-inset ring-black/5 dark:ring-white/10",
  features:
    "bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 ring-1 ring-inset ring-black/5 dark:text-blue-400 dark:ring-white/10",
  notifications:
    "bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600 ring-1 ring-inset ring-black/5 dark:text-amber-400 dark:ring-white/10",
  complete:
    "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-black/5 dark:text-emerald-400 dark:ring-white/10",
};

// ── Staggered entrance variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

interface OnboardingStepProps {
  /** Visual tone — determines the gradient tile color. */
  tone: string;
  /** Icon component to render inside the tile. */
  icon: React.ComponentType<{ className?: string }>;
  /** Step title shown below the icon. */
  title: string;
  /** Optional muted description below the title. */
  description?: string;
  /** Optional hint line below the description (e.g. "You can replay this from Preferences"). */
  hint?: string;
  /** Step-specific content (buttons, cards, status indicators). */
  children?: ReactNode;
}

/**
 * Shared layout for every onboarding wizard step.
 *
 * Renders a centered column with staggered entrance:
 * gradient icon tile → title → description → optional hint → children.
 * Each element fades in sequentially for a polished feel.
 */
export function OnboardingStep({
  tone,
  icon,
  title,
  description,
  hint,
  children,
}: OnboardingStepProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      className="flex w-full flex-col items-center text-center"
      variants={reduceMotion ? undefined : containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Gradient icon tile — matches EntitySheetHeader / form dialog pattern */}
      <motion.div
        variants={reduceMotion ? undefined : itemVariants}
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl",
          TILE_STYLES[tone],
        )}
      >
        <Icon icon={icon} size="xl" />
      </motion.div>

      {/* Title */}
      <motion.h2
        variants={reduceMotion ? undefined : itemVariants}
        className="mt-4 text-lg font-semibold tracking-tight text-foreground"
      >
        {title}
      </motion.h2>

      {/* Description */}
      {description && (
        <motion.p
          variants={reduceMotion ? undefined : itemVariants}
          className="mt-2 max-w-[300px] text-sm leading-6 text-muted-foreground"
        >
          {description}
        </motion.p>
      )}

      {/* Hint (e.g. replay note) */}
      {hint && (
        <motion.p
          variants={reduceMotion ? undefined : itemVariants}
          className="mt-3 max-w-[300px] text-xs leading-relaxed text-muted-foreground/80"
        >
          {hint}
        </motion.p>
      )}

      {/* Children slot — also staggered */}
      {children && (
        <motion.div
          variants={reduceMotion ? undefined : itemVariants}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

/** Feature card icon tiles — tinted token backgrounds per the app's pattern. */
export const FEATURE_TILE_STYLES: Record<string, string> = {
  info: "bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 ring-1 ring-inset ring-black/5 dark:text-blue-400 dark:ring-white/10",
  warning:
    "bg-gradient-to-br from-violet-500/20 to-violet-500/10 text-violet-600 ring-1 ring-inset ring-black/5 dark:text-violet-400 dark:ring-white/10",
  success:
    "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-black/5 dark:text-emerald-400 dark:ring-white/10",
};
