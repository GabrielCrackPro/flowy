"use client";

import { SheetClose, SheetHeader, SheetTitle } from "@components/ui";
import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import { X } from "@/lib/icons";
import { Icon } from "../icon";

interface EntitySheetHeaderProps {
  icon: ReactNode;
  title: string;
  chipClassName?: string;
  iconGradient?: string;
  iconBackground?: string;
  iconColor?: string;
}

export function EntitySheetHeader({
  icon,
  title,
  chipClassName,
  iconGradient = "from-primary/20 to-primary/10",
  iconBackground = "bg-gradient-to-br",
  iconColor = "text-primary",
}: EntitySheetHeaderProps) {
  return (
    <SheetHeader className="border-b border-border/50 px-6 py-5 text-left bg-gradient-to-r from-muted/30 to-transparent">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            iconBackground,
            iconGradient,
            iconColor,
            chipClassName,
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <SheetTitle className="text-lg">{title}</SheetTitle>
        </div>
        <SheetClose className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 transition hover:bg-muted/50 hover:text-foreground">
          <Icon icon={X} className="size-4" />
          <span className="sr-only">Close</span>
        </SheetClose>
      </div>
    </SheetHeader>
  );
}
