"use client";

import { Skeleton, useCardMotion } from "@components/shared";
import {
  CARD_BG_GRADIENT,
  CARD_SHELL,
  CARD_TOP_ACCENT,
} from "@components/shared/card-tokens";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ChartCardSkeleton() {
  const { item } = useCardMotion();
  return (
    <motion.article
      variants={item}
      initial="hidden"
      animate="show"
      className={cn(CARD_SHELL, "min-h-[280px]")}
    >
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

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="size-10"
            >
              <div className="relative h-full w-full">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </motion.div>
            <div className="space-y-2">
              <div className="h-5 w-32">
                <Skeleton />
              </div>
              <div className="h-4 w-48">
                <Skeleton />
              </div>
            </div>
          </div>
          <div className="h-8 w-24">
            <Skeleton variant="rounded" />
          </div>
        </div>
        <div className="mt-5 h-[180px]">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </motion.article>
  );
}
