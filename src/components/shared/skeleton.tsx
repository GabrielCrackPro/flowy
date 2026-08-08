"use client";

import { cn } from "@lib/utils";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface SkeletonProps
  extends Omit<ComponentPropsWithoutRef<"phantom-ui">, "loading"> {
  loading?: boolean;
  className?: string;
  variant?: "default" | "circular" | "rounded";
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
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
        ref={ref}
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
