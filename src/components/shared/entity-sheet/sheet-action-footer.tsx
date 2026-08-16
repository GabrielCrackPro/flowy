"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SheetActionFooterProps {
  /** Left slot for two-action footers (desktop left / mobile bottom). */
  start?: ReactNode;
  /** Right slot for two-action footers (desktop right / mobile top). */
  end?: ReactNode;
  /** Primary action — full-width top on mobile, rightmost on desktop. */
  primary?: ReactNode;
  /** Secondary action — middle on desktop, bottom row on mobile. */
  secondary?: ReactNode;
  /** Tertiary action — far-left on desktop, bottom row on mobile. */
  tertiary?: ReactNode;
  /** Render custom actions directly when the footer needs its own action layout. */
  content?: ReactNode;
  contentClassName?: string;
  className?: string;
}

/**
 * Shared responsive action layout for bottom sheets.
 *
 * - Two-action footers use `start`/`end` (mobile stacks primary above secondary).
 * - Three-action footers use `primary`/`secondary`/`tertiary`: on mobile the
 *   primary action is full-width on top and secondary+tertiary share a
 *   half-width row below (a lone secondary or tertiary stays full-width); on
 *   desktop tertiary sits far-left and secondary+primary group on the right.
 *   Buttons should carry `w-full sm:w-auto` so they fill their mobile slot.
 */
export function SheetActionFooter({
  start,
  end,
  primary,
  secondary,
  tertiary,
  content,
  contentClassName,
  className,
}: SheetActionFooterProps) {
  const twoSlotClasses = cn(
    "flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between",
    contentClassName,
  );

  return (
    <div
      data-slot="sheet-action-footer"
      className={cn(
        "z-10 shrink-0 border-t border-border/60 bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6 sm:py-4 sm:pb-4",
        className,
      )}
    >
      {content ? (
        <div className={twoSlotClasses}>{content}</div>
      ) : primary || secondary || tertiary ? (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          {primary ? (
            <div className="col-span-2 flex items-center gap-2 sm:order-3">
              {primary}
            </div>
          ) : null}
          {secondary ? (
            <div
              className={cn(
                "flex min-w-0 items-center gap-2 sm:order-2 sm:w-auto",
                !tertiary && "col-span-2 sm:ml-auto",
              )}
            >
              {secondary}
            </div>
          ) : null}
          {tertiary ? (
            <div
              className={cn(
                "flex min-w-0 items-center gap-2 sm:order-1 sm:mr-auto sm:w-auto",
                !secondary && "col-span-2",
              )}
            >
              {tertiary}
            </div>
          ) : null}
        </div>
      ) : (
        <div className={twoSlotClasses}>
          {start ? (
            <div className="flex min-w-0 items-center gap-2">{start}</div>
          ) : null}
          {end ? (
            <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
              {end}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
