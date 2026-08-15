import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Icon } from "@/components/shared/icon";
import { Droplet } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface AppLogoProps extends HTMLAttributes<HTMLAnchorElement> {
  compact?: boolean;
  showName?: boolean;
}

/** Branded logo link shared by the dashboard navigation surfaces. */
export function AppLogo({
  compact = false,
  showName = true,
  className,
  ...props
}: AppLogoProps) {
  return (
    <Link
      href="/dashboard"
      aria-label="Flowy"
      className={cn(
        "group inline-flex min-w-0 shrink-0 items-center gap-2 rounded-xl outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/40",
        compact ? "px-1 py-1" : "px-1.5 py-1.5",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105",
          compact ? "size-8" : "size-9",
        )}
      >
        <Icon icon={Droplet} className={compact ? "size-4" : "size-5"} />
      </span>
      {showName ? (
        <span
          className={cn(
            "truncate font-bold tracking-tight text-foreground",
            compact ? "text-sm" : "text-base",
          )}
        >
          Flowy
        </span>
      ) : null}
    </Link>
  );
}
