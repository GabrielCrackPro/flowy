"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CommandPalettePortal } from "./CommandPalettePortal";

interface CommandPaletteOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPaletteOverlay({
  open,
  onClose,
}: CommandPaletteOverlayProps) {
  return (
    <CommandPalettePortal>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm sm:top-16"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
    </CommandPalettePortal>
  );
}
