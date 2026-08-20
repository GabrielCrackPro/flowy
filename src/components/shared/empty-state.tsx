"use client";

import { cn } from "@lib/utils";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  iconClassName?: string;
  /** Show a subtle glow behind the icon. */
  glow?: boolean;
  /** Size variant for the icon container */
  size?: "sm" | "md" | "lg";
}

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const sizeClasses = {
  sm: "size-10 rounded-xl",
  md: "size-12 rounded-2xl",
  lg: "size-14 rounded-2xl",
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  iconClassName = "from-muted/50 to-muted/20 text-muted-foreground",
  glow = false,
  size = "md",
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <motion.div variants={item} className="relative">
        {/* Glow effect */}
        {glow && !prefersReducedMotion && (
          <motion.div
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={cn(
              "absolute inset-0 rounded-2xl blur-xl opacity-60",
              "bg-gradient-to-br from-primary/30 via-primary/20 to-transparent",
            )}
          />
        )}
        <div
          className={cn(
            "relative flex items-center justify-center bg-gradient-to-br ring-1 ring-inset ring-black/5 dark:ring-white/10",
            sizeClasses[size],
            iconClassName,
          )}
        >
          {icon}
        </div>
      </motion.div>

      {title && (
        <motion.p
          variants={item}
          className="mt-5 text-base font-semibold tracking-tight text-foreground"
        >
          {title}
        </motion.p>
      )}

      {description && (
        <motion.p
          variants={item}
          className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground/70"
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
