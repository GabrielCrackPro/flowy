"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSpaces } from "@/hooks/useSpaces";
import { Check, ChevronsUpDown, Layers, Settings2, Users } from "@/lib/icons";
import { cn } from "@/lib/utils";

function SpaceGlyph({
  name,
  active,
  shared,
  avatarUrl,
  className,
}: {
  name: string;
  active?: boolean;
  shared?: boolean;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg font-semibold text-primary-foreground shadow-sm",
        active
          ? "bg-gradient-to-br from-primary to-primary/70 shadow-primary/20"
          : "bg-gradient-to-br from-primary/80 to-primary/50 shadow-primary/10",
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

/**
 * Compact space switcher pill for the header.
 *
 * Shows the active space name in a rounded pill with a dropdown to switch
 * between spaces. Designed for PWA mode (where the sidebar is hidden) and
 * mobile layouts.
 */
export function SpaceSwitcherPill({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { spaces, activeSpace, setActive } = useSpaces();
  const isPending = setActive.isPending;

  const displayName = activeSpace?.name ?? t("profile.spaces.noSpace");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group inline-flex max-w-44 items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 py-1 pl-1.5 pr-2.5 text-xs font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition hover:border-primary/40 hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)] data-open:border-primary/40",
          "max-sm:gap-1 max-sm:py-0.5 max-sm:pl-1 max-sm:pr-1.5",
          className,
        )}
      >
        <SpaceGlyph
          name={activeSpace?.name ?? ""}
          active={!!activeSpace}
          shared={activeSpace ? !activeSpace.isPersonal : false}
          avatarUrl={activeSpace?.avatarUrl}
          className="size-5 text-[0.6rem]"
        />
        <span className="min-w-0 truncate">{displayName}</span>
        <Icon
          icon={ChevronsUpDown}
          className="hidden size-3 shrink-0 opacity-50 transition group-hover:opacity-100 sm:block"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-64 p-1"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-[0.65rem] uppercase tracking-widest">
            {t("profile.spaces.switchSpace")}
          </DropdownMenuLabel>

          {spaces.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {t("profile.spaces.noSpaces")}
            </div>
          ) : (
            spaces.map((space) => {
              const isActive = space.id === activeSpace?.id;

              return (
                <DropdownMenuItem
                  key={space.id}
                  disabled={isActive || isPending}
                  onClick={() => {
                    if (!isActive) setActive.mutate(space.id);
                  }}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2"
                >
                  <SpaceGlyph
                    name={space.name}
                    shared={!space.isPersonal}
                    avatarUrl={space.avatarUrl}
                    className="size-8 text-sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {space.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t("profile.spaces.member", {
                        count: space.members.length,
                      })}
                      {space.isPersonal
                        ? ` · ${t("profile.spaces.personal")}`
                        : ""}
                    </span>
                  </span>
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                    >
                      <Icon icon={Check} className="size-3.5" />
                    </motion.span>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="rounded-md p-0">
          <Link
            href="/dashboard/profile#spaces"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5"
          >
            <Icon icon={Settings2} className="size-4" />
            {t("profile.spaces.manageSpaces")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
