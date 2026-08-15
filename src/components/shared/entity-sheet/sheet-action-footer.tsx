"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SheetActionFooterProps {
  start?: ReactNode;
  end?: ReactNode;
  /** Render custom actions directly when the footer needs its own action layout. */
  content?: ReactNode;
  contentClassName?: string;
  className?: string;
}

/** Shared responsive action layout for right-side sheets and mobile bottom sheets. */
export function SheetActionFooter({
  start,
  end,
  content,
  contentClassName,
  className,
}: SheetActionFooterProps) {
  return (
    <div
      data-slot="sheet-action-footer"
      className={cn(
        "z-10 shrink-0 border-t border-border/60 bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6 sm:py-4 sm:pb-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between",
          contentClassName,
        )}
      >
        {content ?? (
          <>
            {start ? (
              <div className="flex min-w-0 items-center gap-2">{start}</div>
            ) : null}
            {end ? (
              <div className="flex min-w-0 items-center justify-end gap-2">
                {end}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
