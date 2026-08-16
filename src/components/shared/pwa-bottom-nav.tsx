"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Icon } from "@/components/shared/icon";
import { useRouteProgress } from "@/components/shared/route-progress";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useHaptic } from "@/hooks/useHaptic";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePressAndHold } from "@/hooks/usePressAndHold";
import { useProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useSignOut";
import {
  ArrowUpDown,
  Check,
  Home,
  Loader2,
  LogOut,
  MoreHorizontal,
  Repeat2,
  Settings2,
  Tag,
  Target,
  TriangleAlert,
  UserRound,
  Wallet,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

// The long-press indicator completes at 550ms (see usePressAndHold duration
// below). Start the actions sheet's slide this many ms earlier so it is
// already rising the instant the underline finishes — a brief peek preview.
const LONG_PRESS_PREVIEW_MS = 450;

/**
 * Bottom navigation bar for mobile viewports — shown identically for mobile
 * browsers and installed PWAs (hidden on desktop, where the sidebar lives).
 *
 * Minimal tab-bar feel: an elevated blurred surface, quiet inactive tabs, and
 * a compact icon surface that keeps the current location visible without
 * adding another large visual panel to the content.
 */
export function PwaBottomNav() {
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const handleSignOut = useSignOut();
  const haptic = useHaptic();
  const prefersReducedMotion = useReducedMotion();
  const { isNavigating } = useRouteProgress();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [profileActionsOpen, setProfileActionsOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const { hidden: navHidden, reset: resetNavHidden } = useHideOnScroll({
    enabled: isMobile,
    suppress: moreOpen || profileActionsOpen,
  });

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

  const moreItems: NavItem[] = [
    {
      path: "/dashboard/subscriptions",
      label: t("nav.subscriptions"),
      icon: Repeat2,
    },
    {
      path: "/dashboard/categories",
      label: t("nav.categories"),
      icon: Tag,
    },
  ];

  const isPathActive = (path: string) =>
    path === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === path || pathname.startsWith(`${path}/`);

  const moreActive = moreItems.some((item) => isPathActive(item.path));
  const morePending = moreItems.some((item) => pendingPath === item.path);
  const profileActive =
    pathname === "/dashboard/profile" ||
    pathname.startsWith("/dashboard/profile/");
  const profileVisualActive = profileActive || profileActionsOpen;
  const closeProfileActions = () => setProfileActionsOpen(false);
  const { isPressing: profilePressing, pressHandlers: profilePressHandlers } =
    usePressAndHold({
      onTap: () => {
        closeProfileActions();
        setPendingPath("/dashboard/profile");
        router.push("/dashboard/profile");
      },
      onLongPress: () => {
        haptic("light");
        setProfileActionsOpen(true);
      },
    });

  // Brief preview: while the press indicator is still completing, start the
  // actions sheet's slide so it is already rising exactly when the underline
  // finishes. Releasing before the preview fires cancels the timer (normal
  // taps still navigate); a navigation while the sheet previewed closes it via
  // the pathname reset.
  useEffect(() => {
    if (!profilePressing) return;
    const previewTimer = window.setTimeout(
      () => setProfileActionsOpen(true),
      LONG_PRESS_PREVIEW_MS,
    );
    return () => window.clearTimeout(previewTimer);
  }, [profilePressing]);

  useEffect(() => {
    if (!pathname) return;
    setPendingPath(null);
    resetNavHidden();
    setMoreOpen(false);
    setProfileActionsOpen(false);
  }, [pathname, resetNavHidden]);

  if (!isMobile) return null;

  const tabClass = (active: boolean) =>
    cn(
      "relative flex min-h-14 min-w-0 flex-1 touch-manipulation select-none items-center justify-center rounded-2xl px-1 py-1 transition-colors duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      "active:scale-[0.96]",
      active
        ? "text-primary"
        : "text-muted-foreground/70 hover:text-foreground/80",
    );

  const tabIconClass = (active: boolean, pending = false) =>
    cn(
      "size-[19px] transition-transform duration-200",
      active && "scale-105",
      pending && "motion-safe:animate-pulse",
    );

  const tabIconSlot = (active: boolean, pending = false) =>
    cn(
      "relative z-10 flex size-10 items-center justify-center rounded-2xl transition-[background-color,opacity] duration-200",
      active
        ? "bg-primary/12 text-primary shadow-sm shadow-primary/10"
        : "text-muted-foreground/80 hover:bg-muted/60",
      // In-flight navigation: the tapped tab stays lit and pulses; every
      // other tab dims so the tap reads as registered before the swap.
      pending && "bg-primary/20 text-primary",
      isNavigating && !pending && "opacity-40",
    );

  const profilePending = pendingPath === "/dashboard/profile";
  const profileIconSlot = cn(
    "relative z-10 flex size-10 items-center justify-center rounded-2xl border transition-[background-color,border-color,box-shadow,transform,opacity] duration-200",
    profileVisualActive
      ? "border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/10"
      : "border-transparent text-muted-foreground/80 group-hover/profile:bg-muted/60",
    profileActionsOpen &&
      "border-primary/30 bg-primary/15 shadow-md shadow-primary/10",
    profilePressing && "scale-[0.97]",
    profilePending &&
      "border-primary/30 bg-primary/15 motion-safe:animate-pulse",
    isNavigating && !profilePending && "opacity-40",
  );

  return (
    <motion.nav
      initial={false}
      animate={{
        y: navHidden && !moreOpen && !profileActionsOpen ? "110%" : 0,
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 420, damping: 38 }
      }
      onFocusCapture={resetNavHidden}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "border-t border-border/70 bg-card pb-[env(safe-area-inset-bottom,0px)]",
      )}
      aria-label={t("nav.mainAriaLabel")}
    >
      <div className="relative mx-auto flex h-16 w-full max-w-lg items-center justify-between gap-1 px-2 pt-0.5">
        {items.map((item) => {
          const active = isPathActive(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              onClick={(event) => {
                // A transition is already in flight — ignore taps on other
                // tabs so rapid taps can't stack navigations.
                if (isNavigating && !active) {
                  event.preventDefault();
                  return;
                }
                if (!active) setPendingPath(item.path);
              }}
              aria-busy={pendingPath === item.path || undefined}
              className={tabClass(active)}
            >
              <span className={tabIconSlot(active, pendingPath === item.path)}>
                <Icon
                  icon={item.icon}
                  className={tabIconClass(active, pendingPath === item.path)}
                />
              </span>
            </Link>
          );
        })}{" "}
        <button
          type="button"
          aria-label={t("nav.more")}
          title={t("nav.more")}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-busy={morePending || undefined}
          onClick={() => setMoreOpen(true)}
          className={tabClass(moreActive)}
        >
          <span className={tabIconSlot(moreActive, morePending)}>
            <Icon
              icon={MoreHorizontal}
              className={tabIconClass(moreActive, morePending)}
            />
          </span>
        </button>
        <BottomSheet
          open={moreOpen}
          onOpenChange={setMoreOpen}
          title={t("nav.more")}
          description={t("nav.moreHint")}
          icon={<Icon icon={MoreHorizontal} className="size-5" />}
          contentClassName="p-3"
        >
          <div className="space-y-1" role="menu" aria-label={t("nav.more")}>
            {moreItems.map((item) => {
              const active = isPathActive(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  role="menuitem"
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    if (!active && !isNavigating) {
                      setPendingPath(item.path);
                    }
                    setMoreOpen(false);
                  }}
                  aria-busy={pendingPath === item.path || undefined}
                  className={cn(
                    "flex min-h-11 touch-manipulation items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/60 text-muted-foreground",
                    )}
                  >
                    <Icon icon={item.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">{item.label}</span>
                  {pendingPath === item.path ? (
                    <Icon
                      icon={Loader2}
                      className="size-4 motion-reduce:animate-none animate-spin"
                    />
                  ) : active ? (
                    <Icon icon={Check} className="size-4" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </BottomSheet>
        {/* Profile tab: a long press opens the quick-actions sheet; a tap
            navigates to the profile page. */}
        <button
          type="button"
          aria-current={profileActive ? "page" : undefined}
          title={`${t("profile.myProfile")} · ${t("profile.longPressHint")}`}
          aria-label={`${t("profile.myProfile")}. ${t("profile.longPressHint")}`}
          aria-haspopup="dialog"
          aria-expanded={profileActionsOpen}
          className={cn(
            tabClass(profileVisualActive),
            "group/profile",
            profilePressing && "text-primary",
          )}
          {...profilePressHandlers}
        >
          {profilePressing ? (
            <motion.span
              aria-hidden="true"
              initial={{ scaleX: 0, opacity: 0.5 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.55, ease: "linear" }}
              className="pointer-events-none absolute bottom-1 h-0.5 w-6 origin-left rounded-full bg-primary"
            />
          ) : null}
          <span className={profileIconSlot}>
            {profile ? (
              <span className="relative flex items-center justify-center">
                <UserAvatar
                  profile={profile}
                  size="md"
                  className={cn(
                    "size-7 transition-[transform,box-shadow] duration-200",
                    profileVisualActive &&
                      "scale-105 ring-2 ring-primary/50 ring-offset-1 ring-offset-background",
                  )}
                />
                {profileVisualActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-background"
                  />
                ) : null}
              </span>
            ) : (
              <Icon
                icon={UserRound}
                className={tabIconClass(profileVisualActive)}
              />
            )}
          </span>
        </button>
        <BottomSheet
          open={profileActionsOpen}
          onOpenChange={setProfileActionsOpen}
          title={t("profile.myProfile")}
          icon={<Icon icon={UserRound} className="size-5" />}
          contentClassName="p-3"
        >
          <div role="menu" aria-label={t("profile.actions")}>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.14, ease: "easeOut" }
              }
              className="mb-1.5"
            >
              <Link
                href="/dashboard/profile"
                onClick={closeProfileActions}
                aria-label={t("profile.myProfile")}
                className="flex min-w-0 items-center gap-3 rounded-xl bg-primary/[0.06] px-3 py-2.5 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {profile ? (
                  <UserAvatar profile={profile} size="sm" className="size-9" />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon icon={UserRound} className="size-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-tight text-foreground">
                    {profile?.name ?? t("profile.user")}
                  </span>
                  {profile?.email ? (
                    <span className="mt-0.5 block truncate text-xs leading-tight text-muted-foreground">
                      {profile.email}
                    </span>
                  ) : null}
                </span>
              </Link>
            </motion.div>

            <div className="space-y-1">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.16, delay: 0.02, ease: "easeOut" }
                }
              >
                <Link
                  href="/dashboard/profile#preferences"
                  role="menuitem"
                  onClick={closeProfileActions}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
                    <Icon icon={Settings2} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    {t("profile.preferences")}
                  </span>
                </Link>
              </motion.div>
            </div>

            <div className="my-1 border-t border-border/50" />

            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.16, delay: 0.1, ease: "easeOut" }
              }
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeProfileActions();
                  setSignOutConfirmOpen(true);
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <Icon icon={LogOut} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">{t("profile.signOut")}</span>
              </button>
            </motion.div>
          </div>
        </BottomSheet>
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
    </motion.nav>
  );
}
