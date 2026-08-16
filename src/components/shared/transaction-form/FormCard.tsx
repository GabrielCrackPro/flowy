"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconProps } from "../icon";

export type FormCardTone = "primary" | "amber";

const TONES: Record<
  FormCardTone,
  {
    accent: string;
    background: string;
    iconBase: string;
    iconGradient: string;
    iconFlat: string;
  }
> = {
  primary: {
    accent: "bg-linear-to-r from-primary via-primary/50 to-primary",
    background:
      "bg-linear-to-br from-primary/5 via-primary/[0.02] to-transparent",
    iconBase: "text-primary ring-primary/10",
    iconGradient: "bg-linear-to-br from-primary/20 to-primary/10",
    iconFlat: "bg-primary/10",
  },
  amber: {
    accent: "bg-linear-to-r from-amber-500 via-amber-400 to-amber-500",
    background:
      "bg-linear-to-br from-amber-500/5 via-amber-500/[0.02] to-transparent",
    iconBase: "text-amber-600 ring-amber-500/10 dark:text-amber-400",
    iconGradient:
      "bg-linear-to-br from-amber-500/20 to-amber-500/10 dark:from-amber-500/30 dark:to-amber-500/20",
    iconFlat: "bg-amber-500/10 dark:bg-amber-500/20",
  },
};

/** Card surface shared by the transaction form's hero sections. */
export const FORM_CARD_SHELL =
  "relative overflow-hidden rounded-2xl border border-border/30 bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)]";

interface FormCardProps {
  tone?: FormCardTone;
  icon: IconProps["icon"];
  title: ReactNode;
  titleId?: string;
  embedded?: boolean;
  delay?: number;
  children: ReactNode;
}

export function FormCard({
  tone = "primary",
  icon,
  title,
  titleId,
  embedded = false,
  delay = 0,
  children,
}: FormCardProps) {
  const toneStyles = TONES[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        FORM_CARD_SHELL,
        embedded
          ? "rounded-xl p-4 shadow-none"
          : cn("p-5 sm:p-6", toneStyles.background),
      )}
    >
      {!embedded && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px",
            toneStyles.accent,
          )}
        />
      )}

      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            toneStyles.iconBase,
            embedded ? toneStyles.iconFlat : toneStyles.iconGradient,
          )}
        >
          <Icon icon={icon} className="size-4" />
        </div>
        <span id={titleId} className="text-sm font-semibold text-foreground/90">
          {title}
        </span>
      </div>

      {children}
    </motion.div>
  );
}
