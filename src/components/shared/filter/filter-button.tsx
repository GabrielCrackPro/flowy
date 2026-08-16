"use client";

import { cn } from "@lib/utils";
import {
  CONTROL_FOCUS,
  CONTROL_ICON_GAP,
  CONTROL_PLACEHOLDER,
  CONTROL_SURFACE,
} from "@/components/ui/control-styles";

interface FilterButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FilterButton({
  active,
  children,
  className,
  ...props
}: FilterButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        `inline-flex h-11 items-center ${CONTROL_ICON_GAP} px-3 text-xs touch-manipulation sm:h-9`,
        CONTROL_SURFACE,
        CONTROL_FOCUS,
        active
          ? "border-primary/40 bg-primary/8 text-foreground hover:bg-primary/12"
          : `border-border/50 bg-background/80 ${CONTROL_PLACEHOLDER} hover:border-border hover:bg-muted/40 hover:text-foreground`,
        className,
      )}
      aria-pressed={active}
      {...props}
    >
      {children}
    </button>
  );
}
