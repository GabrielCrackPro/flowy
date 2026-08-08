"use client";

import { CardSkeleton, Skeleton } from "@components/shared";
import { motion } from "framer-motion";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="relative size-10"
          >
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent" />
          </motion.div>
          <div className="space-y-2">
            <div className="h-6 w-40">
              <Skeleton />
            </div>
            <div className="h-4 w-24">
              <Skeleton />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border/30 bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24">
                <Skeleton />
              </div>
              <div className="size-8">
                <Skeleton variant="rounded" />
              </div>
            </div>
            <div className="h-8 w-32">
              <Skeleton />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Table + toolbar skeleton — mirrors the transactions card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CardSkeleton />
      </motion.div>
    </div>
  );
}
