import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", startIcon, endIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {startIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground/60">
            {startIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-border/30 bg-background text-sm text-foreground shadow-sm transition-all duration-200",
            "placeholder:text-muted-foreground/50",
            "outline-none",
            "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive/50 aria-invalid:ring-destructive/20",
            startIcon ? "pl-10" : "px-3",
            endIcon ? "pr-10" : "",
            className,
          )}
          {...props}
        />

        {endIcon && (
          <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground/60">
            {endIcon}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
