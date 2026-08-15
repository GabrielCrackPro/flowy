"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/shared/icon";
import { Droplet } from "@/lib/icons";

/** Root loading state shown while the app shell initializes (first paint). */
export default function RootLoading() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.output
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-5"
        aria-label="Flowy"
      >
        <div className="relative">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
            <Icon icon={Droplet} className="size-8" />
          </div>
          {!prefersReducedMotion ? (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ) : null}
        </div>

        {!prefersReducedMotion ? (
          <div className="flex items-center gap-2" aria-hidden="true">
            <div className="size-2 animate-pulse rounded-full bg-primary" />
            <div
              className="size-2 animate-pulse rounded-full bg-primary/40"
              style={{ animationDelay: "75ms" }}
            />
            <div
              className="size-2 animate-pulse rounded-full bg-primary/20"
              style={{ animationDelay: "150ms" }}
            />
          </div>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            Flowy
          </span>
        )}
      </motion.output>
    </div>
  );
}
