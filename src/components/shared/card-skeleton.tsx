"use client";

import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { CARD_BG_GRADIENT, CARD_SHELL, CARD_TOP_ACCENT } from "./card-tokens";
import { Skeleton } from "./skeleton";

interface CardSkeletonProps {
  variant: "bar" | "row" | "card" | "table";
  count?: number;
}

const SKELETON_TABLE_ROWS = Array.from(
  { length: 8 },
  (_, index) => `skeleton-table-${index}`,
);

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

function BarSkeleton() {
  return (
    <div className="space-y-4 px-6 pb-6">
      {[1, 2].map((i) => (
        <div key={i}>
          <div className="mb-1.5 flex items-center justify-between">
            <div className="h-4 w-24">
              <Skeleton />
            </div>
            <div className="h-3.5 w-28">
              <Skeleton />
            </div>
          </div>
          <div className="h-2 rounded-full">
            <Skeleton />
          </div>
          <div className="mt-0.5 h-3 w-16">
            <Skeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-t border-border/30 px-6 py-3.5">
      <div className="h-9 w-9 shrink-0">
        <Skeleton variant="circular" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3.5 w-3/5">
          <Skeleton />
        </div>
        <div className="h-3 w-2/5">
          <Skeleton />
        </div>
      </div>
      <div className="h-4 w-20">
        <Skeleton />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card className="overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-border/40 bg-gradient-to-br from-card to-card/50">
      <div className="border-b border-border/30 bg-gradient-to-r from-muted/20 to-muted/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="mr-auto">
            <div className="h-4 w-32">
              <Skeleton />
            </div>
            <div className="h-3 w-48 mt-1">
              <Skeleton />
            </div>
          </div>
          <div className="h-8 w-44">
            <Skeleton variant="rounded" />
          </div>
          <div className="h-8 w-24">
            <Skeleton variant="rounded" />
          </div>
          <div className="h-8 w-8">
            <Skeleton variant="circular" />
          </div>
        </div>
      </div>

      <div className="border-b border-border/30 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24">
            <Skeleton />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-16">
              <Skeleton />
            </div>
            <div className="h-6 w-6">
              <Skeleton variant="rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/20">
        {SKELETON_TABLE_ROWS.map((rowKey) => (
          <div key={rowKey} className="flex items-center gap-4 px-6 py-4 group">
            <div className="h-4 w-4">
              <Skeleton />
            </div>
            <div className="h-8 w-8">
              <Skeleton variant="rounded" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-4 w-48 mb-1">
                <Skeleton />
              </div>
              <div className="h-3 w-24">
                <Skeleton />
              </div>
            </div>
            <div className="h-8 w-8">
              <Skeleton variant="circular" />
            </div>
            <div className="h-4 w-20 hidden sm:block">
              <Skeleton />
            </div>
            <div className="h-4 w-16 text-right hidden md:block">
              <Skeleton />
            </div>
            <div className="h-4 w-24 hidden md:block">
              <Skeleton />
            </div>
            <div className="h-4 w-24 hidden md:block">
              <Skeleton />
            </div>
            <div className="h-6 w-6">
              <Skeleton variant="rounded" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CardSkeletonCard() {
  return (
    <div className={cn(CARD_SHELL, "p-5")}>
      <div
        className={cn(
          CARD_BG_GRADIENT,
          "from-primary/5 via-primary/[0.02] to-transparent",
        )}
      />
      <div
        className={cn(
          CARD_TOP_ACCENT,
          "from-primary via-primary/50 to-primary",
        )}
      />
      <div className="relative space-y-2">
        <div className="h-4 w-2/5">
          <Skeleton />
        </div>
        <div className="h-3 w-3/5">
          <Skeleton />
        </div>
        <div className="pt-1">
          <div className="h-5 w-14">
            <Skeleton variant="circular" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ variant, count = 2 }: CardSkeletonProps) {
  const Component =
    variant === "bar"
      ? BarSkeleton
      : variant === "row"
        ? RowSkeleton
        : variant === "table"
          ? TableSkeleton
          : CardSkeletonCard;
  const items = Array.from({ length: count }, (_, index) => index + 1);

  if (variant === "bar" || variant === "table") {
    return (
      <motion.div variants={itemVariants} initial="hidden" animate="show">
        <Component />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={variant === "card" ? "grid gap-4" : ""}
    >
      {items.map((item) => (
        <motion.div key={`${variant}-${item}`} variants={itemVariants}>
          <Component />
        </motion.div>
      ))}
    </motion.div>
  );
}
