"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useProfile } from "@/hooks/useProfile";
import { ArrowUpDown, Home, Target, UserRound, Wallet } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const PILL_TRANSITION = {
  type: "spring",
  stiffness: 380,
  damping: 32,
} as const;

/**
 * Bottom navigation bar for mobile viewports — shown identically for mobile
 * browsers and installed PWAs (hidden on desktop, where the sidebar lives).
 *
 * Modern tab-bar feel: an elevated blurred surface with a top hairline, a
 * single persistent active pill that spring-glides to the selected tab, an
 * icon pop on selection and a subtle press squish.
 *
 * The pill is positioned by measuring the active tab on every pathname change
 * and spring-animating a persistent element — NOT a framer-motion `layoutId`
 * crossfade, which does not fire across Next.js App Router route changes
 * (navigations run inside a React transition, so the previous instance is
 * already unmounted when the next one mounts).
 */
export function PwaBottomNav() {
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const pathname = usePathname();
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [pill, setPill] = useState({ x: 0, width: 0 });

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

  const tabs: { path: string; active: boolean }[] = [
    ...items.map((item) => ({
      path: item.path,
      active:
        item.path === "/dashboard"
          ? pathname === "/dashboard"
          : pathname === item.path || pathname.startsWith(`${item.path}/`),
    })),
    {
      path: "/dashboard/profile",
      active:
        pathname === "/dashboard/profile" ||
        pathname.startsWith("/dashboard/profile/"),
    },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.active);

  // Measure the active tab and glide the pill to it. Runs after every pathname
  // change and on resize; `initial={false}` skips the mount animation.
  useEffect(() => {
    if (!isMobile) return;
    const measure = () => {
      const container = containerRef.current;
      const activeTab = tabRefs.current[activeIndex];
      if (!container || !activeTab) return;
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setPill({
        x: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, isMobile]);

  if (!isMobile) return null;

  const tabClass = (active: boolean) =>
    cn(
      "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors duration-200",
      "active:scale-95",
      active
        ? "text-primary"
        : "text-muted-foreground/70 hover:text-foreground/80",
    );

  const tabIconClass = (active: boolean) =>
    cn(
      "relative z-10 size-[22px] transition-all duration-300",
      active && "scale-110 drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]",
    );

  const tabLabelClass = (active: boolean) =>
    cn(
      "relative z-10 max-w-[56px] truncate text-center leading-none transition-colors duration-200",
      active && "font-semibold",
    );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "border-t border-border/40 bg-background/85 backdrop-blur-xl",
        "shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.4)]",
        "pb-[env(safe-area-inset-bottom,0px)]",
      )}
      aria-label={t("nav.mainAriaLabel")}
    >
      <div
        ref={containerRef}
        className="relative mx-auto flex h-16 max-w-md items-center justify-around px-1"
      >
        {activeIndex >= 0 ? (
          <motion.span
            aria-hidden
            className="absolute inset-y-1.5 left-0 rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/15"
            initial={false}
            animate={{ x: pill.x, width: pill.width }}
            transition={PILL_TRANSITION}
          />
        ) : null}

        {items.map((item, index) => {
          const active =
            item.path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.path || pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.path}
              href={item.path}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              aria-current={active ? "page" : undefined}
              className={tabClass(active)}
            >
              <span className="relative z-10 flex size-6 items-center justify-center">
                <Icon icon={item.icon} className={tabIconClass(active)} />
              </span>
              <span className={tabLabelClass(active)}>{item.label}</span>
            </Link>
          );
        })}

        {/* Profile tab */}
        <Link
          href="/dashboard/profile"
          ref={(node) => {
            tabRefs.current[4] = node;
          }}
          aria-current={tabs[4].active ? "page" : undefined}
          className={tabClass(tabs[4].active)}
        >
          <span className="relative z-10 flex size-6 items-center justify-center">
            {profile ? (
              <UserAvatar
                profile={profile}
                size="md"
                className={cn(
                  "size-6 transition-all duration-300",
                  tabs[4].active &&
                    "scale-110 ring-2 ring-primary/40 shadow-md shadow-primary/20",
                )}
              />
            ) : (
              <Icon icon={UserRound} className={tabIconClass(tabs[4].active)} />
            )}
          </span>
          <span className={tabLabelClass(tabs[4].active)}>
            {t("profile.myProfile")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
