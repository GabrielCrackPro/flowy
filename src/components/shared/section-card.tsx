import { Card } from "@components/ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  CARD_BG_GRADIENT,
  CARD_ICON_TILE,
  CARD_SHELL,
  CARD_TOP_ACCENT,
} from "./card-tokens";

interface SectionCardProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  iconClassName?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  accentClassName?: string;
  backgroundClassName?: string;
}

export function SectionCard({
  title,
  description,
  icon,
  iconClassName,
  action,
  children,
  className,
  accentClassName = "from-primary via-primary/50 to-primary",
  backgroundClassName = "from-primary/5 via-primary/[0.02] to-transparent",
}: SectionCardProps) {
  return (
    <Card className={cn(CARD_SHELL, className)}>
      <div className={cn(CARD_BG_GRADIENT, backgroundClassName)} />
      <div className={cn(CARD_TOP_ACCENT, accentClassName)} />

      <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                iconClassName ?? CARD_ICON_TILE,
              )}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2
              className={cn(
                "font-semibold tracking-tight",
                icon ? "text-base" : "text-lg",
              )}
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>

      <div className="relative">{children}</div>
    </Card>
  );
}
