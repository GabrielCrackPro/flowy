"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface ListPageLoadingProps {
  /** Whether the page shows a summary metric row (default true). */
  showSummary?: boolean;
  /** Number of summary card skeletons to render. */
  summaryCount?: number;
  /** Number of entity card skeletons to render. */
  cardCount?: number;
  className?: string;
}

function EntityCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="size-9" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shared loading state for finance list pages (budgets, goals, subscriptions,
 * categories). Mirrors the real page layout: page title, description,
 * summary metric cards and the entity card grid.
 */
export function ListPageLoading({
  showSummary = true,
  summaryCount = 3,
  cardCount = 6,
  className,
}: ListPageLoadingProps) {
  const prefersReducedMotion = useReducedMotion();

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      initial="hidden"
      animate="show"
      className={cn("space-y-6", className)}
      aria-busy="true"
    >
      {/* Page header — mirrors BackHeader + description */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" className="size-10" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-4 w-64" />
      </motion.div>

      {/* Summary metric cards */}
      {showSummary ? (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {Array.from(
            { length: summaryCount },
            (_, index) => `summary-${index}`,
          ).map((key) => (
            <div
              key={key}
              className="space-y-3 rounded-2xl border border-border/40 bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton variant="rounded" className="size-8" />
              </div>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </motion.div>
      ) : null}

      {/* Entity card grid */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: cardCount }, (_, index) => `entity-${index}`).map(
          (key) => (
            <EntityCardSkeleton key={key} />
          ),
        )}
      </motion.div>
    </motion.div>
  );
}
