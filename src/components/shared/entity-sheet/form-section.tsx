"use client";

import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import { FIELD_LABEL } from "@/components/ui/control-styles";
import { Icon, type IconProps } from "../icon";

interface FormSectionProps {
  label: ReactNode;
  htmlFor?: string;
  icon?: IconProps["icon"];
  error?: string;
  hint?: ReactNode;
  /** Inline right-aligned control rendered in the label row (e.g. a switch). */
  trailing?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function FormSection({
  label,
  htmlFor,
  icon,
  error,
  hint,
  trailing,
  className,
  children,
}: FormSectionProps) {
  const labelContent = (
    <>
      {icon && <Icon icon={icon} className="size-4 text-muted-foreground" />}
      {label}
    </>
  );

  const header = htmlFor ? (
    <label
      htmlFor={htmlFor}
      className={`flex items-center gap-2 ${FIELD_LABEL}`}
    >
      {labelContent}
      {trailing ? <span className="ml-auto shrink-0">{trailing}</span> : null}
    </label>
  ) : (
    <div className={`flex items-center gap-2 ${FIELD_LABEL}`}>
      {labelContent}
      {trailing ? <span className="ml-auto shrink-0">{trailing}</span> : null}
    </div>
  );

  return (
    <section className={cn("space-y-2", className)}>
      {header}
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {hint}
    </section>
  );
}
