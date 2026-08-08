"use client";

import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, TriangleAlert } from "@/lib/icons";
import { Icon, type IconProps } from "./icon";

type AlertVariant = "default" | "info" | "success" | "warning" | "danger";

interface AlertProps {
  title: ReactNode;
  description?: ReactNode;

  variant?: AlertVariant;
  visible?: boolean;

  icon?: IconProps["icon"];

  action?: ReactNode;

  className?: string;
}

const variants = {
  default: {
    container: "border-border/40 bg-gradient-to-br from-card to-card/50",
    accent: "from-primary/40 via-primary/20 to-transparent",
    icon: "bg-gradient-to-br from-muted/70 to-muted/40 text-muted-foreground",
    defaultIcon: Info,
  },

  info: {
    container:
      "border-primary/20 bg-gradient-to-br from-primary/8 to-primary/2",
    accent: "from-primary/60 via-primary/30 to-transparent",
    icon: "bg-gradient-to-br from-primary/20 to-primary/5 text-primary",
    defaultIcon: Info,
  },

  success: {
    container:
      "border-success/20 bg-gradient-to-br from-success/8 to-success/2",
    accent: "from-success/60 via-success/30 to-transparent",
    icon: "bg-gradient-to-br from-success/20 to-success/5 text-success",
    defaultIcon: CheckCircle2,
  },

  warning: {
    container:
      "border-warning/20 bg-gradient-to-br from-warning/8 to-warning/2",
    accent: "from-warning/60 via-warning/30 to-transparent",
    icon: "bg-gradient-to-br from-warning/20 to-warning/5 text-warning",
    defaultIcon: TriangleAlert,
  },

  danger: {
    container: "border-danger/20 bg-gradient-to-br from-danger/8 to-danger/2",
    accent: "from-danger/60 via-danger/30 to-transparent",
    icon: "bg-gradient-to-br from-danger/20 to-danger/5 text-danger",
    defaultIcon: AlertTriangle,
  },
} satisfies Record<
  AlertVariant,
  {
    container: string;
    accent: string;
    icon: string;
    defaultIcon: IconProps["icon"];
  }
>;

export function Alert({
  title,
  description,
  variant = "default",
  visible = true,
  icon,
  action,
  className,
}: AlertProps) {
  if (!visible) return null;

  const style = variants[variant];
  const IconComponent = icon ?? style.defaultIcon;

  return (
    <div
      className={cn(
        "relative flex items-center gap-5 overflow-hidden rounded-3xl border p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition duration-300",
        "hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]",
        style.container,
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          style.accent,
        )}
      />

      <div
        className={cn(
          "relative flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] ring-1 ring-inset ring-foreground/5",
          style.icon,
        )}
      >
        <Icon icon={IconComponent} className="size-7" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>

        {description && (
          <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </div>
        )}
      </div>

      {action && <div className="shrink-0 self-start">{action}</div>}
    </div>
  );
}
