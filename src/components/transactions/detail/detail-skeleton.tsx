"use client";

import { motion, type Variants } from "framer-motion";
import { Skeleton } from "@/components/shared";
import { cn } from "@/lib/utils";

const detailSkeletonContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const detailSkeletonVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export function TransactionDetailSkeleton() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={detailSkeletonContainer}
      className="mx-auto max-w-4xl px-4 sm:px-6 pt-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <motion.div variants={detailSkeletonVariants} className="space-y-6">
          {/* Amount card skeleton */}
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 p-6 sm:p-7 shadow-lg">
            <Skeleton className="mb-2 h-3 w-24" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Skeleton className="h-11 w-64 sm:w-72" />
                <Skeleton className="mt-3 h-4 w-40" />
              </div>
              <Skeleton variant="rounded" className="size-12 rounded-2xl" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-background/60 p-1 shadow-inner">
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
            </div>
          </div>

          {/* Detail rows skeleton */}
          <div className="divide-y divide-border/30 rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 shadow-md">
            {[1, 2, 3, 4].map((row, index) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton variant="rounded" className="size-8" />
                  <Skeleton
                    className={cn("h-3.5", index % 2 === 0 ? "w-24" : "w-20")}
                  />
                </div>
                <Skeleton className="h-3.5 w-32" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={detailSkeletonVariants} className="space-y-6">
          {/* Receipt card skeleton */}
          <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton variant="rounded" className="size-8" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/40 bg-muted/10">
              <Skeleton variant="rounded" className="size-8" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>

          {/* Notes card skeleton */}
          <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-md">
            <Skeleton className="mb-3 h-3.5 w-16" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="mt-2 h-3.5 w-1/2" />
          </div>

          {/* Created/updated rows skeleton */}
          <div className="divide-y divide-border/30 rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 shadow-md">
            {[1, 2].map((row, index) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton variant="rounded" className="size-8" />
                  <Skeleton
                    className={cn("h-3.5", index % 2 === 0 ? "w-24" : "w-20")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="size-5" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Comments skeleton */}
      <motion.div
        variants={detailSkeletonVariants}
        className="mt-8 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/5"
      >
        <div className="mb-5 flex items-center gap-2.5">
          <Skeleton variant="rounded" className="size-8" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-4 w-5 rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((row, index) => (
            <div key={row} className="flex items-start gap-3">
              <Skeleton variant="circular" className="size-8 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton
                  className={cn("h-3.5", index % 2 === 0 ? "w-40" : "w-32")}
                />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3">
          <Skeleton variant="circular" className="size-8 shrink-0" />
          <Skeleton variant="rounded" className="h-11 flex-1" />
        </div>
      </motion.div>
    </motion.div>
  );
}
