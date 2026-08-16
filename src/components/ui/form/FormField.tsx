import type * as React from "react";
import { FIELD_LABEL } from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label &&
        (htmlFor ? (
          <label htmlFor={htmlFor} className={FIELD_LABEL}>
            {label}

            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        ) : (
          <div className={FIELD_LABEL}>
            {label}

            {required && <span className="ml-1 text-destructive">*</span>}
          </div>
        ))}

      {children}

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
