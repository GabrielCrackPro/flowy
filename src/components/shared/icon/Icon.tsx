import type { ComponentType, CSSProperties, SVGProps } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface IconProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  size?: IconSize;
  className?: string;
  style?: CSSProperties;
  variant?: "default" | "muted" | "primary" | "success" | "warning" | "danger";
}

const sizeClasses: Record<IconSize, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
  xl: "size-6",
  "2xl": "size-8",
  "3xl": "size-10",
};

const variantClasses: Record<NonNullable<IconProps["variant"]>, string> = {
  default: "text-current",
  muted: "text-muted-foreground",
  primary: "text-primary",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
};

export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  (
    { icon: Icon, size = "md", className, variant = "default", ...props },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex shrink-0",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        <Icon className="size-full" />
      </span>
    );
  },
);

Icon.displayName = "Icon";
