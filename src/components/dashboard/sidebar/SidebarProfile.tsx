"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, Skeleton, UserAvatar } from "@/components/shared";
import { useProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useSignOut";
import {
  ChevronRight,
  ChevronUp,
  LogOut,
  Settings2,
  User as UserIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SidebarTooltip } from "./SidebarTooltip";

interface SidebarProfileProps {
  collapsed?: boolean;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  className?: string;
}

export function SidebarProfile({
  collapsed = false,
  variant = "desktop",
  onNavigate,
  className,
}: SidebarProfileProps) {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const handleSignOut = useSignOut();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    setTarget(triggerRef.current);
  }, []);

  useEffect(() => {
    if (!collapsed) setTooltipOpen(false);
  }, [collapsed]);

  if (!profile) {
    return collapsed ? (
      <div className={cn("border-t border-border p-3", className)}>
        <div className="mx-auto h-11 w-11">
          <Skeleton variant="circular" />
        </div>
      </div>
    ) : (
      <div className={cn("border-t border-border px-3 py-2.5", className)}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0">
            <Skeleton variant="circular" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 w-3/4">
              <Skeleton />
            </div>
            <div className="h-3 w-1/2">
              <Skeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fullName = profile.name ?? t("profile.user");
  const email = profile.email ?? t("profile.noEmail");
  const mobile = variant === "mobile";

  return (
    <div className={cn("border-t border-border", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={triggerRef}
          onMouseEnter={() => {
            if (collapsed) setTooltipOpen(true);
          }}
          onMouseLeave={() => setTooltipOpen(false)}
          aria-label={collapsed ? fullName : undefined}
          className={cn(
            "group flex w-full items-center text-left transition-colors outline-none",
            "focus-visible:ring-3 focus-visible:ring-ring/50",
            collapsed
              ? "p-3 justify-center hover:bg-muted/30"
              : cn(
                  "gap-3 rounded-xl hover:bg-accent/70 hover:text-accent-foreground",
                  mobile ? "px-3 py-3" : "px-3 py-2.5",
                ),
            "[&[aria-expanded='true']]:bg-accent [&[aria-expanded='true']]:text-accent-foreground",
          )}
        >
          <UserAvatar
            profile={profile}
            size="lg"
            className="transition-transform duration-200 hover:scale-[1.03]"
          />

          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground leading-tight">
                  {fullName}
                </p>

                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {email}
                </p>
              </div>

              <Icon
                icon={ChevronUp}
                className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-foreground"
              />
            </>
          ) : null}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align={collapsed ? "center" : mobile ? "start" : "end"}
          className="w-64 max-w-[calc(100vw-1rem)] p-1"
          sideOffset={collapsed ? 10 : mobile ? 8 : 12}
        >
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-linear-to-r from-primary/10 to-transparent">
            <UserAvatar profile={profile} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground mt-0.5">
                {email}
              </p>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[0.65rem] uppercase tracking-widest px-2 py-1.5">
              {t("profile.actions")}
            </DropdownMenuLabel>

            <DropdownMenuItem
              className={cn("gap-2 rounded-md p-0", mobile ? "py-1" : "py-1.5")}
            >
              <Link
                href="/dashboard/profile"
                onClick={onNavigate}
                className={cn(
                  "flex w-full items-center gap-2 px-1.5 rounded-md",
                  mobile ? "py-2.5" : "py-1.5",
                )}
              >
                <Icon icon={UserIcon} className="h-4 w-4" />
                {t("profile.myProfile")}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              className={cn("gap-2 rounded-md p-0", mobile ? "py-1" : "py-1.5")}
            >
              <Link
                href="/dashboard/profile#preferences"
                onClick={onNavigate}
                className={cn(
                  "flex w-full items-center gap-2 px-1.5 rounded-md",
                  mobile ? "py-2.5" : "py-1.5",
                )}
              >
                <Icon icon={Settings2} className="h-4 w-4" />
                {t("profile.preferences")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={handleSignOut}
            className={cn(
              "gap-2 rounded-md font-medium",
              mobile ? "py-2.5" : "py-1.5",
            )}
          >
            <Icon icon={LogOut} className="h-4 w-4" />
            {t("profile.signOut")}
            <span className="ml-auto text-[0.68rem] text-muted-foreground/70 font-normal flex items-center gap-0.5">
              {t("profile.esc")}
              <Icon icon={ChevronRight} className="h-3 w-3" />
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SidebarTooltip
        target={collapsed ? target : null}
        open={tooltipOpen}
        label={<span>{fullName}</span>}
      />
    </div>
  );
}
