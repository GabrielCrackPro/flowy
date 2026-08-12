"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
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
import {
  Check,
  ChevronsUpDown,
  Layers,
  Loader2,
  Settings2,
  Users,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SidebarTooltip } from "./SidebarTooltip";

interface SpaceSwitcherProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

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

export function SpaceSwitcher({
  collapsed = false,
  onNavigate,
}: SpaceSwitcherProps) {
  const { t } = useTranslation();
  const { spaces, activeSpace, setActive } = useSpaces();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    setTarget(triggerRef.current);
  }, []);

  useEffect(() => {
    if (!collapsed) setTooltipOpen(false);
  }, [collapsed]);

  const isPending = setActive.isPending;
  const spaceCount = spaces.length;

  const displayName = activeSpace?.name ?? t("profile.spaces.noSpace");
  const subtitle = activeSpace
    ? `${activeSpace.isPersonal ? t("profile.spaces.personal") : t("profile.spaces.shared")} · ${t("profile.spaces.count", { count: spaceCount })}`
    : t("profile.spaces.selectSpace");

  return (
    <div className={cn("shrink-0", collapsed ? "px-2 pt-3" : "px-3 pt-3")}>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={triggerRef}
          aria-label={collapsed ? displayName : undefined}
          onMouseEnter={() => {
            if (collapsed) setTooltipOpen(true);
          }}
          onMouseLeave={() => setTooltipOpen(false)}
          onFocus={() => {
            if (collapsed) setTooltipOpen(true);
          }}
          onBlur={() => setTooltipOpen(false)}
          className={cn(
            "relative flex w-full items-center gap-2.5 rounded-xl border border-border/40 bg-muted/30 text-left outline-none transition",
            "hover:border-primary/40 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50",
            "data-open:border-primary/40 data-open:bg-muted/50",
            collapsed
              ? "mx-auto size-11 justify-center px-0"
              : "h-12 justify-between px-3",
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <SpaceGlyph
              name={activeSpace?.name ?? ""}
              active={!!activeSpace}
              shared={activeSpace ? !activeSpace.isPersonal : false}
              avatarUrl={activeSpace?.avatarUrl}
              className={collapsed ? "size-9" : "size-8"}
            />

            <motion.span
              initial={false}
              animate={{
                opacity: collapsed ? 0 : 1,
                x: collapsed ? -6 : 0,
                width: collapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0 overflow-hidden"
            >
              <span className="block truncate text-sm font-semibold text-foreground">
                {displayName}
              </span>
              <span className="block truncate text-[0.65rem] text-muted-foreground uppercase tracking-wide">
                {subtitle}
              </span>
            </motion.span>
          </span>

          {collapsed && isPending ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Icon icon={Loader2} className="size-2.5" />
              </motion.span>
            </span>
          ) : null}

          <motion.span
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 overflow-hidden"
          >
            {isPending ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="text-muted-foreground/60"
              >
                <Icon icon={Loader2} className="size-4" />
              </motion.span>
            ) : (
              <Icon icon={ChevronsUpDown} className="size-3.5 shrink-0" />
            )}
          </motion.span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={collapsed ? "center" : "start"}
          side="bottom"
          sideOffset={6}
          className="w-72 p-1"
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
                      if (!isActive) {
                        setActive.mutate(space.id);
                        onNavigate?.();
                      }
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

                    {isActive ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                      >
                        <Icon icon={Check} className="size-3.5" />
                      </motion.span>
                    ) : null}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="rounded-md p-0">
            <Link
              href="/dashboard/profile#spaces"
              onClick={onNavigate}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5"
            >
              <Icon icon={Settings2} className="size-4" />
              {t("profile.spaces.manageSpaces")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SidebarTooltip
        target={collapsed ? target : null}
        open={tooltipOpen}
        label={displayName}
      />
    </div>
  );
}
