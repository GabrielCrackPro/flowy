"use client";

import { AnimatePresence, motion } from "framer-motion";

interface CommandPaletteOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPaletteOverlay({
  open,
  onClose,
}: CommandPaletteOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md"
          style={{ top: "64px" }}
          onClick={onClose}
        />
      )}
    </AnimatePresence>
  );
}
