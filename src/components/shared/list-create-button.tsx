"use client";

import { cn } from "@/lib/utils";
import { GradientButton } from "./gradient-button";

interface ListCreateButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

/**
 * Create action for entity list toolbars. It keeps the full label on desktop
 * and becomes a compact, still accessible icon button on mobile.
 */
export function ListCreateButton({
  label,
  onClick,
  className,
}: ListCreateButtonProps) {
  return (
    <GradientButton
      onClick={onClick}
      fullWidth={false}
      ariaLabel={label}
      mobileIconOnly
      size="sm"
      className={cn(
        "h-10 rounded-xl shadow-md shadow-primary/20 sm:px-3",
        "max-sm:size-10 max-sm:gap-0 max-sm:px-0 max-sm:shadow-primary/30",
        className,
      )}
    >
      <span className="hidden sm:inline">{label}</span>
    </GradientButton>
  );
}
