"use client";

import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@lib/utils";

export interface SkeletonProps
  extends Omit<ComponentPropsWithoutRef<"phantom-ui">, "loading"> {
  loading?: boolean;
  className?: string;
  variant?: "default" | "circular" | "rounded";
}

export const Skeleton = forwardRef<HTMLElement, SkeletonProps>(
  (
    {
      children,
      loading = true,
      animation = "shimmer",
      reveal = 1,
      stagger = 0.04,
      className,
      variant = "default",
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref as any}
        className={cn(
          "block",
          variant === "circular" && "rounded-full",
          variant === "rounded" && "rounded-lg",
          variant === "default" && "rounded-md",
          className,
        )}
      >
        <phantom-ui
          loading={loading || undefined}
          animation={animation}
          reveal={reveal}
          stagger={stagger}
          {...props}
        >
          {children}
        </phantom-ui>
      </div>
    );
  },
);

Skeleton.displayName = "Skeleton";
