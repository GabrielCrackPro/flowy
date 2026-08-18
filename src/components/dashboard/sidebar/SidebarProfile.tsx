"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, Icon, Skeleton, UserAvatar } from "@/components/shared";
import { useProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useSignOut";
import {
  ChevronUp,
  LogOut,
  Settings2,
  TriangleAlert,
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
  const router = useRouter();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  // Menu-item shortcut (P → profile), active only while the menu is open on
  // desktop. Capture phase + stopImmediatePropagation so Base UI typeahead
  // doesn't also react to the key.
  useEffect(() => {
    if (!open || variant !== "desktop") return;

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      if (
        (e.target as HTMLElement | null)?.closest(
          "input, textarea, [contenteditable]",
        )
      ) {
        return;
      }

      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
        router.push("/dashboard/profile");
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, router, variant]);

  useEffect(() => {
    setTarget(triggerRef.current);
  }, []);

  useEffect(() => {
    if (!collapsed) setTooltipOpen(false);
  }, [collapsed]);

  if (!profile) {
    return collapsed ? (
      <div className={cn("border-t border-border p-3", className)}>
        <div className="mx-auto size-11">
          <Skeleton variant="circular" />
        </div>
      </div>
    ) : (
      <div className={cn("border-t border-border px-3 py-2.5", className)}>
        <div className="flex items-center gap-3">
          <div className="size-11 shrink-0">
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
      <DropdownMenu open={open} onOpenChange={setOpen}>
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
              ? "p-3 justify-center hover:bg-muted/40"
              : cn(
                  "gap-3 rounded-xl justify-between hover:bg-muted/40 hover:text-foreground",
                  mobile ? "px-3 py-3" : "px-3 py-2.5",
                ),
            "data-open:bg-muted/50",
          )}
        >
          <span
            className={cn("flex min-w-0 items-center", !collapsed && "gap-3")}
          >
            <UserAvatar
              profile={profile}
              size="lg"
              className="transition-transform duration-200 hover:scale-[1.03]"
            />

            <motion.div
              initial={false}
              animate={{
                opacity: collapsed ? 0 : 1,
                x: collapsed ? -6 : 0,
                width: collapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0 overflow-hidden"
            >
              <p className="truncate text-sm font-semibold text-foreground leading-tight">
                {fullName}
              </p>

              <p className="truncate text-xs text-muted-foreground mt-0.5">
                {email}
              </p>
            </motion.div>
          </span>

          <motion.span
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 overflow-hidden"
          >
            <Icon
              icon={ChevronUp}
              className="size-4 text-muted-foreground transition duration-200 group-data-[open]:rotate-180 group-hover:-translate-y-0.5 group-hover:text-foreground"
            />
          </motion.span>
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

            <DropdownMenuLinkItem
              href="/dashboard/profile"
              onClick={(event) => {
                // Navigate imperatively so the menu's merged click handlers
                // and the controlled open state can never swallow the link
                // activation (closeOnClick alone closes the menu without
                // guaranteeing the navigation fires).
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                onNavigate?.();
                router.push("/dashboard/profile");
              }}
              className={cn("gap-2", mobile ? "py-2.5" : "py-1.5")}
            >
              <Icon icon={UserIcon} className="size-4" />
              {t("profile.myProfile")}
              {!mobile ? (
                <kbd className="ml-auto inline-flex items-center rounded border border-border/40 bg-background px-1.5 py-px text-[0.62rem] font-medium tabular-nums text-muted-foreground/80">
                  P
                </kbd>
              ) : null}
            </DropdownMenuLinkItem>

            <DropdownMenuLinkItem
              href="/dashboard/profile#preferences"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                onNavigate?.();
                router.push("/dashboard/profile#preferences");
              }}
              className={cn("gap-2", mobile ? "py-2.5" : "py-1.5")}
            >
              <Icon icon={Settings2} className="size-4" />
              {t("profile.preferences")}
            </DropdownMenuLinkItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
              setSignOutConfirmOpen(true);
            }}
            className={cn(
              "gap-2 rounded-md font-medium",
              mobile ? "py-2.5" : "py-1.5",
            )}
          >
            <Icon icon={LogOut} className="size-4" />
            {t("profile.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SidebarTooltip
        target={collapsed ? target : null}
        open={tooltipOpen}
        label={
          <span className="flex flex-col gap-0.5">
            <span>{fullName}</span>
            <span className="max-w-56 truncate text-[0.68rem] font-normal text-muted-foreground">
              {email}
            </span>
          </span>
        }
      />

      <ConfirmDialog
        open={signOutConfirmOpen}
        onOpenChange={setSignOutConfirmOpen}
        title={t("profile.signOutConfirmTitle")}
        description={t("profile.signOutConfirmDescription")}
        confirmLabel={t("profile.signOut")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleSignOut()}
        variant="destructive"
        icon={<Icon icon={TriangleAlert} className="size-5" />}
      />
    </div>
  );
}
