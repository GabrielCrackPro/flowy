"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/shared/bottom-sheet";
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
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSpaces } from "@/hooks/useSpaces";
import {
  Check,
  ChevronsUpDown,
  Layers,
  Loader2,
  Settings2,
  Users,
} from "@/lib/icons";
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

interface SpaceSwitcherPillProps {
  className?: string;
  compactMobile?: boolean;
}

/**
 * Space switcher used in the dashboard header. Desktop keeps a compact menu;
 * mobile uses the shared bottom-sheet pattern for larger touch targets.
 */
export function SpaceSwitcherPill({
  className,
  compactMobile = false,
}: SpaceSwitcherPillProps) {
  const { t } = useTranslation();
  const { spaces, activeSpace, setActive } = useSpaces();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isPending = setActive.isPending;
  const displayName = activeSpace?.name ?? t("profile.spaces.noSpace");

  const triggerClassName = cn(
    "group inline-flex max-w-44 items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 py-1 pl-1.5 pr-2.5 text-xs font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition hover:border-primary/40 hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)] data-open:border-primary/40 aria-expanded:border-primary/40 aria-expanded:bg-primary/10",
    "max-sm:gap-1 max-sm:py-0.5 max-sm:pl-1 max-sm:pr-1.5",
    compactMobile &&
      "max-md:h-9 max-md:max-w-[8.5rem] max-md:rounded-xl max-md:border-primary/20 max-md:bg-primary/5 max-md:px-1.5 max-md:py-1",
    className,
  );

  const triggerContent = (
    <>
      <SpaceGlyph
        name={activeSpace?.name ?? ""}
        active={!!activeSpace}
        shared={activeSpace ? !activeSpace.isPersonal : false}
        avatarUrl={activeSpace?.avatarUrl}
        className={cn(
          "size-5 text-[0.6rem]",
          compactMobile && "max-md:size-6 max-md:rounded-xl",
        )}
      />
      <span className="min-w-0 truncate">{displayName}</span>
      <Icon
        icon={ChevronsUpDown}
        className="size-3 shrink-0 opacity-60 transition group-hover:opacity-100"
      />
    </>
  );

  const handleSelect = (spaceId: string) => {
    if (spaceId === activeSpace?.id || isPending) return;
    setActive.mutate(spaceId);
    setSheetOpen(false);
  };

  if (compactMobile && isMobile) {
    return (
      <>
        <button
          type="button"
          aria-label={displayName}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          title={displayName}
          onClick={() => setSheetOpen(true)}
          className={triggerClassName}
        >
          {triggerContent}
        </button>

        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={t("profile.spaces.switchSpace")}
          description={t("profile.spaces.selectSpace")}
          icon={<Icon icon={Layers} className="size-5" />}
          metadata={
            <span className="truncate font-medium text-primary">
              {displayName}
            </span>
          }
          className="max-h-[min(82dvh,640px)]"
          contentClassName="p-3"
        >
          <div className="space-y-1">
            {spaces.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                {t("profile.spaces.noSpaces")}
              </div>
            ) : (
              spaces.map((space) => {
                const isActive = space.id === activeSpace?.id;

                return (
                  <button
                    key={space.id}
                    type="button"
                    disabled={isPending}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => handleSelect(space.id)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/60 active:bg-muted",
                      isPending && !isActive && "opacity-60",
                    )}
                  >
                    <SpaceGlyph
                      name={space.name}
                      active={isActive}
                      shared={!space.isPersonal}
                      avatarUrl={space.avatarUrl}
                      className="size-9 text-sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {space.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t("profile.spaces.member", {
                          count: space.members.length,
                        })}
                        {space.isPersonal
                          ? ` · ${t("profile.spaces.personal")}`
                          : ` · ${t("profile.spaces.shared")}`}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Icon icon={Check} className="size-4" />
                      </span>
                    ) : isPending ? (
                      <Icon
                        icon={Loader2}
                        className="size-4 shrink-0 animate-spin text-muted-foreground"
                      />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-3 border-t border-border/50 pt-3">
            <Link
              href="/dashboard/profile#spaces"
              onClick={() => setSheetOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Icon icon={Settings2} className="size-4" />
              {t("profile.spaces.manageSpaces")}
            </Link>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={displayName}
        title={displayName}
        className={triggerClassName}
      >
        {triggerContent}
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
                  onClick={() => handleSelect(space.id)}
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
