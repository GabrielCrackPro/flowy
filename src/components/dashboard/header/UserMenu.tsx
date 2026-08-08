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
import { useTranslation } from "react-i18next";
import { Icon, UserAvatar } from "@/components/shared";
import { useProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useSignOut";
import { LogOut, Settings2, User as UserIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const handleSignOut = useSignOut();

  if (!profile) return null;

  return (
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

          <DropdownMenuItem className="gap-2 rounded-md py-1.5 p-0">
            <Link
              href="/dashboard/profile"
              className="flex w-full items-center gap-2 px-1.5 py-1.5 rounded-md"
            >
              <Icon icon={UserIcon} className="size-4" />
              {t("profile.myProfile")}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="gap-2 rounded-md py-1.5 p-0">
            <Link
              href="/dashboard/profile#preferences"
              className="flex w-full items-center gap-2 px-1.5 py-1.5 rounded-md"
            >
              <Icon icon={Settings2} className="size-4" />
              {t("profile.preferences")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleSignOut}
          className="gap-2 rounded-md py-1.5 font-medium"
        >
          <Icon icon={LogOut} className="size-4" />
          {t("profile.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
