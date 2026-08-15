"use client";

import { motion } from "framer-motion";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { CARD_SHELL } from "./card-tokens";

export function DetailCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={cn(
        cn(CARD_SHELL, "rounded-xl hover:translate-y-0"),
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function DetailRow({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-5 py-3.5 transition-colors hover:bg-muted/40 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-muted/50 to-muted/30 text-muted-foreground/60">
          <span
            className={cn("shrink-0", iconClass ?? "text-muted-foreground/60")}
          >
            {icon}
          </span>
        </div>
        <span className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="shrink-0 text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}
