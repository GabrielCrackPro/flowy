"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { useBottomSheetDetents } from "@/hooks/useBottomSheetDetents";
import { useBottomSheetSwipe } from "@/hooks/useBottomSheetSwipe";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSystemBackDismiss } from "@/hooks/useSystemBackDismiss";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = React.useContext(SheetContext);

  if (!ctx) {
    throw new Error("Sheet components must be used inside <Sheet>");
  }

  return ctx;
}

export function Sheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [openState, setOpenState] = React.useState(defaultOpen);

  const open = openProp !== undefined ? openProp : openState;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) {
        setOpenState(next);
      }

      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  // Android system back / iOS swipe-back / browser back closes the sheet
  // instead of navigating away.
  useSystemBackDismiss(open, () => setOpen(false));

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useSheet();

  return (
    <button
      type="button"
      data-slot="sheet-trigger"
      onClick={(event) => {
        setOpen(true);
        props.onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function SheetContent({
  side = "right",
  className,
  children,
  snapPoints,
  defaultSnapPoint,
  ...props
}: {
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
  children: React.ReactNode;
  /** Ascending viewport-height fractions (0..1) for pull-up expand/collapse. */
  snapPoints?: number[];
  /** Detent to open on (defaults to the smallest). */
  defaultSnapPoint?: number;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}) {
  const { open, setOpen } = useSheet();
  const isMobile = useIsMobile();
  const { offset, swipeHandlers: dismissSwipeHandlers } = useBottomSheetSwipe({
    onDismiss: () => setOpen(false),
  });
  const detents = useBottomSheetDetents({
    detents: snapPoints && snapPoints.length > 1 ? snapPoints : [1],
    defaultIndex: defaultSnapPoint,
    onDismiss: () => setOpen(false),
  });

  // On mobile every sheet becomes a bottom sheet for consistent UX; on
  // desktop every sheet opens from the right edge. `useIsMobile` starts false
  // during SSR, so nothing renders until the viewport is known to avoid a
  // flash of the desktop side before the mobile re-render.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  type EffectiveSide = "right" | "bottom";

  // `side` is kept for API compatibility; desktop is always right, mobile is
  // always bottom.
  void side;

  const effectiveSide: EffectiveSide =
    !mounted || !isMobile ? "right" : "bottom";

  const hasDetents =
    isMobile && snapPoints !== undefined && snapPoints.length > 1;
  const swipeHandlers = hasDetents
    ? detents.swipeHandlers
    : dismissSwipeHandlers;
  const translateY = hasDetents ? detents.dragY : offset;
  const dragging = hasDetents ? detents.isDragging : offset > 0;

  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const sidePosition: Record<EffectiveSide, string> = {
    right: "inset-y-0 right-0 h-full border-l",
    bottom: "inset-x-0 bottom-0 border-t",
  };

  const hiddenTransform: Record<EffectiveSide, { x?: string; y?: string }> = {
    right: { x: "100%" },
    bottom: { y: "100%" },
  };

  const bottomPosition = "inset-x-0 bottom-0 max-h-[92dvh] w-full border-t";

  const initialAnimation = {
    ...hiddenTransform[effectiveSide],
    ...(hasDetents
      ? { height: `${detents.targetHeightFraction * 100}dvh` }
      : {}),
  };

  const animateAnimation = {
    x: 0,
    y: effectiveSide === "bottom" ? translateY : 0,
    ...(hasDetents
      ? {
          height: `${
            (detents.isDragging
              ? detents.heightFraction
              : detents.targetHeightFraction) * 100
          }dvh`,
        }
      : {}),
  };

  const exitAnimation = hiddenTransform[effectiveSide];

  // Mobile sheets take their own height; drop the full-height constraint
  // that right-side sheets use so `max-h-[92dvh]` wins.
  const responsiveClassName =
    effectiveSide === "bottom" ? className?.replace(/h-full/g, "") : className;

  return (
    <AnimatePresence>
      {open && mounted && (
        <>
          <motion.div
            key="sheet-overlay"
            data-slot="sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            key="sheet-content"
            data-slot="sheet-content"
            role="dialog"
            aria-modal="true"
            initial={initialAnimation}
            animate={animateAnimation}
            exit={exitAnimation}
            transition={
              dragging
                ? { duration: 0 }
                : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            }
            style={hasDetents ? { maxHeight: "none" } : undefined}
            className={cn(
              "fixed z-50 bg-background outline-none",
              effectiveSide === "bottom"
                ? cn(bottomPosition, "rounded-t-3xl border-x-0")
                : sidePosition[effectiveSide],
              responsiveClassName,
            )}
            {...props}
          >
            {effectiveSide === "bottom" && (
              <div
                {...swipeHandlers}
                aria-hidden="true"
                className="flex h-7 shrink-0 touch-none items-center justify-center"
              >
                <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="sheet-title"
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function SheetClose({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useSheet();

  return (
    <button
      type="button"
      data-slot="sheet-close"
      onClick={(event) => {
        setOpen(false);
        props.onClick?.(event);
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}
