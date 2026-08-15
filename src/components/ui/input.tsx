import * as React from "react";
import {
  CONTROL_DISABLED,
  CONTROL_FOCUS,
  CONTROL_SURFACE,
} from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", startIcon, endIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {startIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground/60">
            {startIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={cn(
            "flex h-11 w-full px-3 text-sm",
            CONTROL_SURFACE,
            "placeholder:text-muted-foreground/50",
            CONTROL_FOCUS,
            CONTROL_DISABLED,
            "aria-invalid:border-destructive/60 aria-invalid:ring-3 aria-invalid:ring-destructive/15",
            startIcon ? "pl-10" : "",
            endIcon ? "pr-10" : "",
            className,
          )}
          {...props}
        />

        {endIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground/60">
            {endIcon}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
