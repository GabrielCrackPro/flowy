"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/shared/skeleton";

export default function ProfileLoading() {
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
      className="space-y-6"
      aria-busy="true"
    >
      {/* Profile header — avatar + name */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Skeleton variant="rounded" className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </motion.div>

      {/* Settings cards */}
      {[0, 1, 2].map((section) => (
        <motion.div key={section} variants={itemVariants}>
          <div className="space-y-3 rounded-2xl border border-border/40 bg-card p-5">
            <div className="flex items-center gap-2">
              <Skeleton variant="rounded" className="size-8" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-56" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
