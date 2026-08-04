"use client";

import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PreviewCardProps {
  icon: ReactNode;
  className?: string;
  children: ReactNode;
}

export function PreviewCard({ icon, className, children }: PreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl border border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {icon}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </motion.div>
  );
}
