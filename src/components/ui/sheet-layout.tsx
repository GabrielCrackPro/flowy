"use client";

import type * as React from "react";
import { EntitySheetHeader } from "@/components/shared/entity-sheet/entity-sheet-header";
import { SheetActionFooter } from "@/components/shared/entity-sheet/sheet-action-footer";
import { Icon, type IconProps } from "@/components/shared/icon";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SheetLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  metadata?: React.ReactNode;
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
  titleId?: string;
}

export function SheetLayout({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  metadata,
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
  titleId,
}: SheetLayoutProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger>{trigger}</SheetTrigger>}
      <SheetContent
        side={side}
        className={cn("flex h-full w-full flex-col p-0", maxWidth, className)}
      >
        {showHeader ? (
          <EntitySheetHeader
            icon={icon ? <Icon icon={icon} className="size-5" /> : undefined}
            title={title}
            subtitle={showDescriptionInHeader ? description : undefined}
            metadata={metadata}
            iconGradient={iconGradient}
            iconBackground={iconBackground}
            iconColor={iconColor}
            titleId={titleId}
          />
        ) : (
          <SheetTitle className="sr-only">{title}</SheetTitle>
        )}

        <div className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}>
          <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
        </div>

        {(footerLeft || footerRight) && (
          <SheetActionFooter start={footerLeft} end={footerRight} />
        )}
      </SheetContent>
    </Sheet>
  );
}
