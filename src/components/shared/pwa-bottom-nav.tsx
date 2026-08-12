"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useProfile } from "@/hooks/useProfile";
import { usePwa } from "@/hooks/usePwa";
import { ArrowUpDown, Home, Target, UserRound, Wallet } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

/**
 * Bottom navigation bar shown only when the app is installed as a PWA.
 *
 * Material-flavored with a sliding active indicator pill, subtle elevation,
 * and the user's avatar for the profile tab.
 */
export function PwaBottomNav() {
  const { isStandalone } = usePwa();
  const { profile } = useProfile();
  const pathname = usePathname();
  const { t } = useTranslation();

  if (!isStandalone) return null;

  const items: NavItem[] = [
    { path: "/dashboard", label: t("nav.overview"), icon: Home },
    {
      path: "/dashboard/transactions",
      label: t("nav.transactions"),
      icon: ArrowUpDown,
    },
    { path: "/dashboard/budgets", label: t("nav.budgets"), icon: Wallet },
    { path: "/dashboard/goals", label: t("nav.goals"), icon: Target },
  ];

  const profileActive =
    pathname === "/dashboard/profile" ||
    pathname.startsWith("/dashboard/profile");

  const indicator = (
    <motion.div
      layoutId="pwa-nav-indicator"
      className="absolute top-0 left-1/2 h-0.5 w-9 -translate-x-1/2 rounded-full bg-primary"
      transition={{ type: "spring", stiffness: 500, damping: 34 }}
    />
  );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "bg-gradient-to-t from-background via-background/90 to-background/0",
        "backdrop-blur-xl",
        "shadow-[0_-8px_20px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_20px_-8px_rgba(0,0,0,0.3)]",
        "pb-[env(safe-area-inset-bottom,0px)]",
      )}
      aria-label={t("nav.mainAriaLabel")}
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-1">
        {items.map((item) => {
          const active =
            item.path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.path || pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground/70 hover:text-foreground/80",
              )}
            >
              {active && indicator}
              <Icon
                icon={item.icon}
                className={cn(
                  "size-[22px] transition-all duration-200",
                  active && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]",
                )}
              />
              <span className="truncate max-w-[56px] text-center leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Profile tab */}
        <Link
          href="/dashboard/profile"
          className={cn(
            "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
            profileActive
              ? "text-primary"
              : "text-muted-foreground/70 hover:text-foreground/80",
          )}
        >
          {profileActive && indicator}
          {profile ? (
            <div className="flex items-center justify-center">
              <UserAvatar
                profile={profile}
                size="md"
                className={cn(
                  "transition-shadow duration-200",
                  profileActive &&
                    "ring-2 ring-primary/40 shadow-md shadow-primary/20",
                )}
              />
            </div>
          ) : (
            <Icon
              icon={UserRound}
              className={cn(
                "size-[22px] transition-all duration-200",
                profileActive &&
                  "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]",
              )}
            />
          )}
          <span className="truncate max-w-[56px] text-center leading-none">
            {t("profile.myProfile")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
