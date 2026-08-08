"use client";

import { cn } from "@lib/utils";
import { type Variants, motion } from "framer-motion";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  iconClassName?: string;
}

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  iconClassName = "from-muted/50 to-muted/20 text-muted-foreground",
}: EmptyStateProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <motion.div
        variants={item}
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br",
          iconClassName,
        )}
      >
        {icon}
      </motion.div>

      {title && (
        <motion.p
          variants={item}
          className="mt-4 text-base font-semibold tracking-tight"
        >
          {title}
        </motion.p>
      )}

      {description && (
        <motion.p
          variants={item}
          className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div variants={item} className="mt-6">
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
