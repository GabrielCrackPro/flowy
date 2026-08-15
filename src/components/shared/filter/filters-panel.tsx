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
          <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-3 shadow-sm sm:p-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
