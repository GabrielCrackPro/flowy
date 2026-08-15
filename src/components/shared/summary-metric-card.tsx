import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { CARD_SHELL } from "./card-tokens";
import type { IconProps } from "./icon";
import { Icon } from "./icon";

export type SummaryMetricTone =
  | "default"
  | "positive"
  | "negative"
  | "info"
  | "warning";

interface SummaryMetricCardProps {
  label: ReactNode;
  value: ReactNode;
  icon: IconProps["icon"];
  tone?: SummaryMetricTone;
  className?: string;
}

interface SummaryMetricGridProps {
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<SummaryMetricTone, string> = {
  default:
    "bg-primary/10 text-primary ring-primary/15 dark:bg-primary/15 dark:ring-primary/25",
  positive:
    "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/25",
  negative:
    "bg-rose-500/10 text-rose-600 ring-rose-500/15 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/25",
  info: "bg-blue-500/10 text-blue-600 ring-blue-500/15 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/25",
  warning:
    "bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/25",
};

export function SummaryMetricCard({
  label,
  value,
  icon,
  tone = "default",
  className,
}: SummaryMetricCardProps) {
  return (
    <Card
      className={cn(
        CARD_SHELL,
        "flex min-h-[4.5rem] flex-row items-center gap-3 p-3.5 sm:min-h-24 sm:p-5",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset sm:size-11",
          toneClasses[tone],
        )}
      >
        <Icon icon={icon} className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-medium uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:text-xs">
          {label}
        </p>
        <p className="mt-0.5 break-words text-lg font-semibold leading-tight tabular-nums text-foreground sm:mt-1 sm:text-xl">
          {value}
        </p>
      </div>
    </Card>
  );
}

export function SummaryMetricGrid({
  children,
  className,
}: SummaryMetricGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={cn("grid gap-3 sm:gap-4 sm:grid-cols-3", className)}
    >
      {children}
    </motion.div>
  );
}
