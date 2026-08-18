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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, Icon, UserAvatar } from "@/components/shared";
import { useProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useSignOut";
import {
  LogOut,
  Settings2,
  TriangleAlert,
  User as UserIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const handleSignOut = useSignOut();
  const router = useRouter();
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  if (!profile) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          <UserAvatar
            profile={profile}
            size="sm"
            className="transition-transform hover:scale-[1.03]"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 p-1" sideOffset={8}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-primary/5">
            <UserAvatar profile={profile} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {profile.name ?? t("profile.user")}
              </p>
              <p className="truncate text-xs text-muted-foreground mt-0.5">
                {profile.email ?? t("profile.noEmail")}
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
                // Imperative navigation: the menu's merged handlers must not
                // be able to swallow the link activation.
                event.preventDefault();
                event.stopPropagation();
                router.push("/dashboard/profile");
              }}
              className="gap-2 py-1.5"
            >
              <Icon icon={UserIcon} className="size-4" />
              {t("profile.myProfile")}
            </DropdownMenuLinkItem>

            <DropdownMenuLinkItem
              href="/dashboard/profile#preferences"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                router.push("/dashboard/profile#preferences");
              }}
              className="gap-2 py-1.5"
            >
              <Icon icon={Settings2} className="size-4" />
              {t("profile.preferences")}
            </DropdownMenuLinkItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setSignOutConfirmOpen(true)}
            className="gap-2 rounded-md py-1.5 font-medium"
          >
            <Icon icon={LogOut} className="size-4" />
            {t("profile.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}
