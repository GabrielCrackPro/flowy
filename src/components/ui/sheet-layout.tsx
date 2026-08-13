"use client";

import type * as React from "react";
import { Icon, type IconProps } from "@/components/shared/icon";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { X } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SheetLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  icon?: IconProps["icon"];
  iconGradient?: string;
  iconBackground?: string;
  iconColor?: string;
  children: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  className?: string;
  side?: "left" | "right" | "top" | "bottom";
  maxWidth?: string;
  contentClassName?: string;
  showDescriptionInHeader?: boolean;
  showHeader?: boolean;
}

export function SheetLayout({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  icon,
  iconGradient = "from-primary/20 to-primary/10",
  iconBackground = "bg-gradient-to-br",
  iconColor = "text-primary",
  children,
  footerLeft,
  footerRight,
  className,
  side = "right",
  maxWidth = "sm:max-w-md",
  contentClassName,
  showDescriptionInHeader = true,
  showHeader = true,
}: SheetLayoutProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger>{trigger}</SheetTrigger>}
      <SheetContent
        side={side}
        className={cn("flex h-full w-full flex-col p-0", maxWidth, className)}
      >
        {showHeader ? (
          <SheetHeader className="shrink-0 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent px-4 py-4 text-left sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              {icon && (
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    iconBackground,
                    iconGradient,
                    iconColor,
                  )}
                >
                  <Icon icon={icon} className="size-5" />
                </div>
              )}
              <div className="flex-1">
                <SheetTitle className="text-lg">{title}</SheetTitle>
                {description && showDescriptionInHeader && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <SheetClose className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 transition hover:bg-muted/50 hover:text-foreground">
                <Icon icon={X} className="size-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
          </SheetHeader>
        ) : (
          <SheetTitle className="sr-only">{title}</SheetTitle>
        )}

        <div className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}>
          <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
        </div>

        {(footerLeft || footerRight) && (
          <div className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border/50 bg-gradient-to-r from-muted/30 to-transparent px-4 py-3 sm:gap-x-6 sm:px-6 sm:py-4">
            {footerLeft}
            <div className="flex flex-wrap justify-end gap-2">
              {footerRight}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
