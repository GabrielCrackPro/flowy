"use client";

import { cn } from "@lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Info, TriangleAlert, X } from "@/lib/icons";

export type BannerSeverity = "danger" | "warning" | "success" | "info";
export type BannerVariant = "card" | "strip";

const cardStyles: Record<
  BannerSeverity,
  {
    container: string;
    accent: string;
    icon: string;
    iconComponent: typeof Info;
    button: string;
  }
> = {
  danger: {
    container:
      "border-danger/25 bg-gradient-to-br from-danger/10 via-card to-card",
    accent: "from-danger/60 via-danger/30 to-transparent",
    icon: "bg-gradient-to-br from-danger/25 to-danger/10 text-danger",
    iconComponent: TriangleAlert,
    button: "bg-danger/10 text-danger hover:bg-danger/15 ring-danger/15",
  },
  warning: {
    container:
      "border-warning/25 bg-gradient-to-br from-warning/10 via-card to-card",
    accent: "from-warning/60 via-warning/30 to-transparent",
    icon: "bg-gradient-to-br from-warning/25 to-warning/10 text-warning",
    iconComponent: TriangleAlert,
    button: "bg-warning/10 text-warning hover:bg-warning/15 ring-warning/15",
  },
  success: {
    container:
      "border-success/25 bg-gradient-to-br from-success/10 via-card to-card",
    accent: "from-success/60 via-success/30 to-transparent",
    icon: "bg-gradient-to-br from-success/25 to-success/10 text-success",
    iconComponent: CheckCircle2,
    button: "bg-success/10 text-success hover:bg-success/15 ring-success/15",
  },
  info: {
    container:
      "border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card",
    accent: "from-primary/60 via-primary/30 to-transparent",
    icon: "bg-gradient-to-br from-primary/20 to-primary/5 text-primary",
    iconComponent: Info,
    button: "bg-primary/10 text-primary hover:bg-primary/15 ring-primary/15",
  },
};

const stripStyles: Record<
  BannerSeverity,
  { bar: string; icon: string; title: string; sub: string; button: string }
> = {
  danger: {
    bar: "border-danger/25 bg-danger/10",
    icon: "text-danger",
    title: "text-red-900 dark:text-red-100",
    sub: "text-red-800/80 dark:text-red-200/70",
    button: "bg-danger text-white hover:bg-danger/90",
  },
  warning: {
    bar: "border-amber-500/25 bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-100",
    sub: "text-amber-800/80 dark:text-amber-200/70",
    button: "bg-amber-600 text-white hover:bg-amber-700",
  },
  success: {
    bar: "border-emerald-500/25 bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-900 dark:text-emerald-100",
    sub: "text-emerald-800/80 dark:text-emerald-200/70",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  info: {
    bar: "border-primary/20 bg-primary/5",
    icon: "text-primary",
    title: "text-foreground/80",
    sub: "text-muted-foreground",
    button: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
};

interface BannerProps {
  variant?: BannerVariant;
  severity?: BannerSeverity;
  /** Overrides the default severity icon (e.g. a themed ShieldCheck for MFA). */
  icon?: LucideIcon;
  /** Strip only: renders the animated ping behind the icon (e.g. active incident). */
  pulse?: boolean;
  title: string;
  description?: ReactNode;
  /** Renders a trailing action button; hidden when omitted. */
  actionLabel?: string;
  /** Icon inside the action button (card defaults to ArrowRight, strip is icon-free). */
  actionIcon?: LucideIcon;
  onAction?: () => void;
  /** Card only: when provided, the title/description area becomes clickable (e.g. open alert). */
  onBodyClick?: () => void;
  /** Renders a trailing dismiss button; hidden when omitted. */
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

function BannerBody({
  Icon,
  title,
  description,
  iconClass,
}: {
  Icon: LucideIcon;
  title: string;
  description?: ReactNode;
  iconClass: string;
}) {
  return (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-foreground/5",
          iconClass,
        )}
      >
        <Icon className="size-4" />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
          {title}
        </span>
        {description && (
          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </>
  );
}

function StripBanner({
  severity,
  Icon,
  pulse,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  onDismiss,
  dismissLabel,
}: {
  severity: BannerSeverity;
  Icon: LucideIcon;
  pulse?: boolean;
  title: string;
  description?: ReactNode;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  const style = stripStyles[severity];
  const ActionIcon = actionIcon;

  return (
    <div className={cn("w-full border-b px-4 py-2", style.bar)}>
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-2.5 gap-y-1">
        {pulse ? (
          <span
            className={cn(
              "relative flex size-4 shrink-0 items-center justify-center",
              style.icon,
            )}
          >
            <span
              className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-40"
              aria-hidden="true"
            />
            <Icon aria-hidden className="relative size-4 shrink-0" />
          </span>
        ) : (
          <Icon aria-hidden className={cn("size-4 shrink-0", style.icon)} />
        )}

        <div className="min-w-0 flex-1 basis-40">
          <p className={cn("truncate text-sm font-semibold", style.title)}>
            {title}
          </p>
          {description && (
            <p className={cn("truncate text-xs", style.sub)}>{description}</p>
          )}
        </div>

        {actionLabel && onAction && (
          <Button
            size="sm"
            onClick={onAction}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm transition",
              style.button,
            )}
          >
            {ActionIcon && <ActionIcon className="size-3.5" />}
            {actionLabel}
          </Button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Shared banner used by service alerts (card toast), inline prompts (MFA
 * setup) and the under-header strips (push notifications, incident status).
 * Owns the severity theming, icon, title/description, action and dismiss
 * controls so callers only provide content.
 */
export function Banner({
  variant = "card",
  severity = "info",
  icon: IconOverride,
  pulse,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  onBodyClick,
  onDismiss,
  dismissLabel,
  className,
}: BannerProps) {
  const style = cardStyles[severity];
  const Icon = IconOverride ?? style.iconComponent;

  if (variant === "strip") {
    return (
      <StripBanner
        severity={severity}
        Icon={Icon}
        pulse={pulse}
        title={title}
        description={description}
        actionLabel={actionLabel}
        actionIcon={actionIcon}
        onAction={onAction}
        onDismiss={onDismiss}
        dismissLabel={dismissLabel}
      />
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.08)]",
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

      {onBodyClick ? (
        <Button
          variant="ghost"
          onClick={onBodyClick}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left",
            "cursor-pointer hover:opacity-90",
          )}
        >
          <BannerBody
            Icon={Icon}
            title={title}
            description={description}
            iconClass={style.icon}
          />
        </Button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left">
          <BannerBody
            Icon={Icon}
            title={title}
            description={description}
            iconClass={style.icon}
          />
        </div>
      )}

      {actionLabel && onAction && (
        <Button
          size="sm"
          onClick={onAction}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ring-1 ring-inset",
            "bg-none hover:bg-none",
            style.button,
          )}
        >
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </Button>
      )}

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-none hover:bg-muted/60 hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
