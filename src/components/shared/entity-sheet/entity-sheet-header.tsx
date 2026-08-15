"use client";

import { SheetClose, SheetHeader, SheetTitle } from "@components/ui/sheet";
import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "@/lib/icons";
import { Icon } from "../icon";

interface EntitySheetHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  metadata?: ReactNode;
  headerAction?: ReactNode;
  subtitleId?: string;
  chipClassName?: string;
  iconGradient?: string;
  iconBackground?: string;
  iconColor?: string;
  titleId?: string;
}

export function EntitySheetHeader({
  icon,
  title,
  subtitle,
  metadata,
  headerAction,
  subtitleId,
  chipClassName,
  iconGradient = "from-primary/20 to-primary/10",
  iconBackground = "bg-gradient-to-br",
  iconColor = "text-primary",
  titleId,
}: EntitySheetHeaderProps) {
  const { t } = useTranslation();

  return (
    <SheetHeader className="sticky top-0 z-10 shrink-0 border-b border-border/60 bg-background/95 px-4 py-3 text-left backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6 sm:py-4">
      <div className="flex min-h-10 items-center gap-3">
        {icon ? (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 dark:ring-white/10",
              iconBackground,
              iconGradient,
              iconColor,
              chipClassName,
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <SheetTitle
            id={titleId}
            className="truncate text-base font-semibold leading-tight sm:text-lg"
          >
            {title}
          </SheetTitle>
          {subtitle ? (
            <p
              id={subtitleId}
              className="mt-0.5 truncate text-xs leading-snug text-muted-foreground"
            >
              {subtitle}
            </p>
          ) : null}
          {metadata ? (
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {metadata}
            </div>
          ) : null}
        </div>
        {headerAction}
        <SheetClose
          aria-label={t("common.close")}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:size-8 sm:rounded-lg"
        >
          <Icon icon={X} className="size-4" />
          <span className="sr-only">{t("common.close")}</span>
        </SheetClose>
      </div>
    </SheetHeader>
  );
}
