"use client";

import { motion } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SidebarTooltipProps {
  target: HTMLElement | null;
  open: boolean;
  label: ReactNode;
}

export function SidebarTooltip({ target, open, label }: SidebarTooltipProps) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !target) return;

    const update = () => {
      const rect = target.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, target]);

  if (!mounted || !open || !pos) return null;

  return createPortal(
    <motion.div
      role="tooltip"
      initial={{ opacity: 0, x: -6, y: "-50%", scale: 0.96 }}
      animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      style={{ top: pos.top, left: pos.left }}
      className="pointer-events-none fixed z-[60] flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border/60 bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-xl shadow-black/5"
    >
      <span
        aria-hidden
        className="absolute -left-0.5 top-1/2 size-2 -translate-y-1/2 rotate-45 rounded-[1px] border-l border-t border-border/60 bg-popover"
      />
      {label}
    </motion.div>,
    document.body,
  );
}
