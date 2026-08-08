"use client";

import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";

import { Skeleton } from "./skeleton";

const SKELETON_TABLE_ROWS = Array.from(
  { length: 8 },
  (_, index) => `skeleton-table-${index}`,
);

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

function TableSkeleton() {
  return (
    <motion.div variants={itemVariants} initial="hidden" animate="show">
      <Card className="overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-border/40 bg-gradient-to-br from-card to-card/50">
        {/* Toolbar — mirrors TransactionFilterToolbar */}
        <div className="border-b border-border/30 bg-gradient-to-r from-muted/20 to-muted/10 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-auto space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton
              variant="rounded"
              className="h-9 w-44 rounded-xl sm:w-56"
            />
            <Skeleton variant="rounded" className="h-9 w-24 rounded-xl" />
            <Skeleton variant="rounded" className="h-9 w-10 rounded-xl" />
            <Skeleton variant="rounded" className="size-7" />
            <Skeleton variant="rounded" className="size-7" />
            <Skeleton variant="rounded" className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        {/* Table header row */}
        <div className="border-b border-border/30 bg-gradient-to-r from-muted/10 to-muted/5 px-6 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="size-3" />
            <Skeleton className="size-3" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="hidden h-3 w-20 sm:block" />
            <Skeleton className="ml-auto h-3 w-16" />
            <Skeleton className="hidden h-3 w-16 md:block" />
            <Skeleton className="hidden h-3 w-16 md:block" />
          </div>
        </div>

        {/* Transaction-like rows */}
        <div className="divide-y divide-border/20">
          {SKELETON_TABLE_ROWS.map((rowKey) => (
            <div key={rowKey} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="size-4 rounded-[4px]" />
              <Skeleton variant="rounded" className="size-9" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton
                variant="rounded"
                className="hidden h-5 w-14 sm:block"
              />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="hidden h-4 w-16 md:block" />
              <Skeleton className="hidden h-4 w-16 md:block" />
              <Skeleton variant="rounded" className="size-7" />
            </div>
          ))}
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-border/30 bg-gradient-to-r from-muted/10 to-muted/5 px-6 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton variant="rounded" className="h-8 w-14" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton variant="rounded" className="size-8" />
            <Skeleton className="h-3 w-6" />
            <Skeleton variant="rounded" className="size-8" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function CardSkeleton() {
  return <TableSkeleton />;
}
