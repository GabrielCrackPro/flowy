"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EntitySheetHeader } from "./entity-sheet/entity-sheet-header";
import { SheetActionFooter } from "./entity-sheet/sheet-action-footer";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  metadata?: ReactNode;
  icon?: ReactNode;
  iconGradient?: string;
  iconBackground?: string;
  iconColor?: string;
  headerAction?: ReactNode;
  /** When set, renders a "open in full page" link icon in the header. */
  externalHref?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Left/right footer actions (stacked on mobile, split on desktop). */
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  /** Three-action footer: primary/secondary/tertiary (see SheetActionFooter). */
  footerPrimary?: ReactNode;
  footerSecondary?: ReactNode;
  footerTertiary?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
  /** Ascending viewport-height fractions (0..1) for mobile pull-up expand/collapse. */
  snapPoints?: number[];
  /** Detent to open on (defaults to the smallest). */
  defaultSnapPoint?: number;
}

/**
 * Shared mobile bottom sheet with consistent sizing, header, close action,
 * scrolling, safe-area spacing, and bottom-up opening behavior.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  metadata,
  icon,
  iconGradient,
  iconBackground,
  iconColor,
  headerAction,
  externalHref,
  children,
  footer,
  footerLeft,
  footerRight,
  footerPrimary,
  footerSecondary,
  footerTertiary,
  className,
  contentClassName,
  footerClassName,
  snapPoints,
  defaultSnapPoint,
}: BottomSheetProps) {
  const hasFooter = Boolean(
    footer ||
      footerLeft ||
      footerRight ||
      footerPrimary ||
      footerSecondary ||
      footerTertiary,
  );
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {mounted
        ? createPortal(
            <SheetContent
              side="bottom"
              snapPoints={snapPoints}
              defaultSnapPoint={defaultSnapPoint}
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              className={cn("flex w-full flex-col p-0", className)}
            >
              <EntitySheetHeader
                icon={icon}
                title={title}
                subtitle={description}
                metadata={metadata}
                headerAction={headerAction}
                externalHref={externalHref}
                onExternalNavigate={() => onOpenChange(false)}
                iconGradient={iconGradient}
                iconBackground={iconBackground}
                iconColor={iconColor}
                titleId={titleId}
                subtitleId={description ? descriptionId : undefined}
              />

              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain",
                  !hasFooter && "pb-[env(safe-area-inset-bottom,0px)]",
                  contentClassName,
                )}
              >
                {children}
              </div>

              {hasFooter && (
                <SheetActionFooter
                  start={footerLeft}
                  end={footerRight}
                  primary={footerPrimary}
                  secondary={footerSecondary}
                  tertiary={footerTertiary}
                  content={footer}
                  contentClassName={
                    footer ? "flex-row items-center justify-end" : undefined
                  }
                  className={footerClassName}
                />
              )}
            </SheetContent>,
            document.body,
          )
        : null}
    </Sheet>
  );
}
