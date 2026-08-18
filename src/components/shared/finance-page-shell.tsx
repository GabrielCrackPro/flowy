"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "./error-boundary";

interface FinancePageShellProps {
  children: ReactNode;
  className?: string;
}

/** Shared outer layout for finance pages and their sheets/dialogs. */
export function FinancePageShell({
  children,
  className,
}: FinancePageShellProps) {
  return (
    <ErrorBoundary>
      <div className={cn("space-y-6", className)}>{children}</div>
    </ErrorBoundary>
  );
}
