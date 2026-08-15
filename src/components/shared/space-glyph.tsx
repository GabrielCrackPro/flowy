"use client";

import { Icon } from "@/components/shared/icon";
import { Layers, Users } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SpaceGlyphProps {
  name: string;
  active?: boolean;
  shared?: boolean;
  avatarUrl?: string | null;
  className?: string;
}

/**
 * Space identity mark: gradient tile with the space initial (or avatar), plus
 * a small "shared" badge on shared spaces. Used by the space switchers, the
 * switcher sheet and any space row that needs a compact visual identity.
 */
export function SpaceGlyph({
  name,
  active,
  shared,
  avatarUrl,
  className,
}: SpaceGlyphProps) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg font-semibold text-primary-foreground shadow-sm",
        active
          ? "bg-linear-to-br from-primary to-primary/70 shadow-primary/20"
          : "bg-linear-to-br from-primary/80 to-primary/50 shadow-primary/10",
        className,
      )}
    >
      {avatarUrl ? (
        /* biome-ignore lint/performance/noImgElement: Avatars are served from Supabase public storage. */
        <img
          src={avatarUrl}
          alt={name}
          className="size-full rounded-lg object-cover"
        />
      ) : name ? (
        name.trim().charAt(0).toUpperCase()
      ) : (
        <Icon icon={Layers} className="size-3.5" />
      )}
      {shared ? (
        <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background text-primary ring-1 ring-border/60">
          <Icon icon={Users} className="size-2.5" />
        </span>
      ) : null}
    </span>
  );
}
