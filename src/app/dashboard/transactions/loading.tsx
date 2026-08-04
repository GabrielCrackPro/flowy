"use client";

import { Skeleton } from "@components/shared";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function TransactionsLoading() {
  const { t } = useTranslation();

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
              <div className="h-8 w-8">
                <Skeleton variant="rounded" />
              </div>
            </div>
            <div className="h-8 w-32">
              <Skeleton />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filter Toolbar Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-3 rounded-2xl border border-border/30 bg-card p-6"
      >
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <div className="h-5 w-32">
              <Skeleton />
            </div>
            <div className="h-3 w-48">
              <Skeleton />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="h-9 w-56">
              <Skeleton variant="rounded" />
            </div>
            <div className="h-9 w-24">
              <Skeleton variant="rounded" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-2xl border border-border/30 bg-card overflow-hidden"
      >
        <div className="border-b border-border/30 bg-gradient-to-r from-muted/20 to-muted/10 p-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-24">
              <Skeleton />
            </div>
            <div className="ml-auto flex items-center gap-2">
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
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-4 w-4">
                <Skeleton />
              </div>
              <div className="h-9 w-9">
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
        <div className="border-t border-border/30 p-4">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24">
              <Skeleton />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8">
                <Skeleton variant="rounded" />
              </div>
              <div className="h-3 w-8">
                <Skeleton />
              </div>
              <div className="h-8 w-8">
                <Skeleton variant="rounded" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
