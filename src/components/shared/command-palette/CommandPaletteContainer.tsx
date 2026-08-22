"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useBottomSheetSwipe } from "@/hooks/useBottomSheetSwipe";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CommandPalettePortal } from "./CommandPalettePortal";

interface CommandPaletteContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  desktopSideSheet?: boolean;
}

export function CommandPaletteContainer({
  open,
  onOpenChange,
  children,
  desktopSideSheet = false,
}: CommandPaletteContainerProps) {
  const isMobile = useIsMobile();
  const { offset, swipeHandlers } = useBottomSheetSwipe({
    onDismiss: () => onOpenChange(false),
  });

  return (
    <CommandPalettePortal>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={
              isMobile
                ? { opacity: 0, y: "100%" }
                : { opacity: 0, scale: 0.98, y: -10 }
            }
            animate={
              isMobile
                ? { opacity: 1, y: offset }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              isMobile
                ? { opacity: 0, y: "100%" }
                : { opacity: 0, scale: 0.98, y: -10 }
            }
            transition={
              isMobile && offset > 0
                ? { duration: 0 }
                : isMobile
                  ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
            }
            className={
              desktopSideSheet
                ? "fixed inset-x-0 bottom-0 z-[60] w-full sm:inset-y-0 sm:right-0 sm:bottom-auto sm:left-auto sm:top-0 sm:max-w-md sm:translate-x-0"
                : "fixed inset-x-0 bottom-0 z-[60] w-full sm:bottom-auto sm:left-1/2 sm:top-24 sm:max-w-xl sm:-translate-x-1/2 sm:px-4"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={
                desktopSideSheet
                  ? "max-h-[min(88dvh,720px)] sm:h-full overflow-hidden rounded-t-3xl border border-b-0 border-border/50 bg-background pb-[env(safe-area-inset-bottom,0px)] ring-4 ring-black/5 sm:rounded-none sm:border-y-0 sm:border-r-0 sm:pb-0 sm:ring-0"
                  : "max-h-[min(88dvh,720px)] overflow-hidden rounded-t-3xl border border-b-0 border-border/50 bg-background pb-[env(safe-area-inset-bottom,0px)] ring-4 ring-black/5 sm:rounded-2xl sm:border-b sm:pb-0 sm:ring-4"
              }
            >
              <div
                {...swipeHandlers}
                aria-hidden="true"
                className="flex h-7 shrink-0 touch-none items-center justify-center sm:hidden"
              >
                <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
              </div>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CommandPalettePortal>
  );
}
