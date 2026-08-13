"use client";

import { AnimatePresence, motion } from "framer-motion";

interface FiltersPanelProps {
  open: boolean;
  children: React.ReactNode;
}

export function FiltersPanel({ open, children }: FiltersPanelProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="filters"
          initial={{
            opacity: 0,
            y: -8,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -8,
            scale: 0.98,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
        >
          <div className="relative space-y-4 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-muted/40 via-muted/20 to-muted/10 p-3.5 shadow-lg sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="relative">{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
