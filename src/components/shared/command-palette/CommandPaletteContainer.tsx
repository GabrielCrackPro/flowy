"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface CommandPaletteContainerProps {
  open: boolean;
  children: ReactNode;
}

export function CommandPaletteContainer({
  open,
  children,
}: CommandPaletteContainerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 top-[120px] z-[60] w-full max-w-xl -translate-x-1/2 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-background shadow-2xl shadow-black/40 ring-4 ring-black/5">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
