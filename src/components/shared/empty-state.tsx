"use client";

import { cn } from "@lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  iconClassName = "from-muted/50 to-muted/20 text-muted-foreground",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br",
          iconClassName,
        )}
      >
        {icon}
      </div>

      {title && (
        <p className="mt-4 text-base font-semibold tracking-tight">{title}</p>
      )}

      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
