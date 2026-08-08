"use client";

import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import { Icon, type IconProps } from "../icon";

interface FormSectionProps {
  label: ReactNode;
  htmlFor?: string;
  icon?: IconProps["icon"];
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function FormSection({
  label,
  htmlFor,
  icon,
  error,
  hint,
  className,
  children,
}: FormSectionProps) {
  return (
    <section className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sm font-medium"
      >
        {icon && <Icon icon={icon} className="size-4" />}
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {hint}
    </section>
  );
}
