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
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
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
  children,
  footer,
  className,
  contentClassName,
  footerClassName,
}: BottomSheetProps) {
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
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              className={cn(
                "flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-3xl border-x-0 p-0",
                className,
              )}
            >
              <EntitySheetHeader
                icon={icon}
                title={title}
                subtitle={description}
                metadata={metadata}
                headerAction={headerAction}
                iconGradient={iconGradient}
                iconBackground={iconBackground}
                iconColor={iconColor}
                titleId={titleId}
                subtitleId={description ? descriptionId : undefined}
              />

              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain",
                  !footer && "pb-[env(safe-area-inset-bottom,0px)]",
                  contentClassName,
                )}
              >
                {children}
              </div>

              {footer && (
                <SheetActionFooter
                  content={footer}
                  contentClassName="flex-row items-center justify-end"
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
