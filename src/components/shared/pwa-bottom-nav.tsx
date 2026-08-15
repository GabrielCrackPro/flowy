"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Icon } from "@/components/shared/icon";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  AlertDialogMedia,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { useHaptic } from "@/hooks/useHaptic";
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
  Palette,
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [profileActionsOpen, setProfileActionsOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const profileMenuStartY = useRef<number | null>(null);
  const profileMenuOffsetRef = useRef(0);
  const profileMenuSuppressClick = useRef(false);
  const profileLongPressRef = useRef(false);
  const lastScrollTop = useRef(0);
  const [profileMenuOffset, setProfileMenuOffset] = useState(0);
  const [profileMenuDragging, setProfileMenuDragging] = useState(false);

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
  const profileActive =
    pathname === "/dashboard/profile" ||
    pathname.startsWith("/dashboard/profile/");
  const profileVisualActive = profileActive || profileActionsOpen;
  const closeProfileActions = () => {
    profileLongPressRef.current = false;
    setProfileActionsOpen(false);
  };
  const { isPressing: profilePressing, pressHandlers: profilePressHandlers } =
    usePressAndHold({
      onTap: () => {
        closeProfileActions();
        router.push("/dashboard/profile");
      },
      onLongPress: () => {
        profileLongPressRef.current = true;
        haptic("light");
        setProfileActionsOpen(true);
      },
    });

  const resetProfileMenuSwipe = () => {
    profileMenuStartY.current = null;
    profileMenuOffsetRef.current = 0;
    setProfileMenuOffset(0);
    setProfileMenuDragging(false);
  };

  const handleProfileMenuOpenChange = (open: boolean) => {
    // PopoverTrigger can request an open during a normal press. Only the
    // long-press handler is allowed to open this controlled menu.
    if (open && !profileLongPressRef.current) return;

    if (open) {
      setProfileActionsOpen(true);
      return;
    }

    closeProfileActions();
    resetProfileMenuSwipe();
  };

  const handleProfileMenuPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType === "mouse") return;
    profileMenuStartY.current = event.clientY;
    profileMenuOffsetRef.current = 0;
    profileMenuSuppressClick.current = false;
    setProfileMenuDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleProfileMenuPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (profileMenuStartY.current === null) return;
    const nextOffset = Math.max(0, event.clientY - profileMenuStartY.current);
    if (nextOffset > 8) profileMenuSuppressClick.current = true;
    profileMenuOffsetRef.current = nextOffset;
    setProfileMenuOffset(nextOffset);
  };

  const finishProfileMenuSwipe = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (profileMenuStartY.current === null) return;
    const shouldDismiss = profileMenuOffsetRef.current >= 64;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    profileMenuStartY.current = null;
    profileMenuOffsetRef.current = 0;
    setProfileMenuOffset(0);
    setProfileMenuDragging(false);
    if (shouldDismiss) handleProfileMenuOpenChange(false);
  };

  useEffect(() => {
    if (!pathname) return;
    setPendingPath(null);
    setNavHidden(false);
    setProfileActionsOpen(false);
    setProfileMenuOffset(0);
    setProfileMenuDragging(false);
    profileMenuStartY.current = null;
    profileMenuOffsetRef.current = 0;
    profileMenuSuppressClick.current = false;
    profileLongPressRef.current = false;
  }, [pathname]);

  // Hide the bar while reading and reveal it as soon as the user scrolls up.
  // The dashboard scrolls inside main[data-scroll-container], not the window.
  useEffect(() => {
    if (!isMobile) return;
    const scrollContainer = document.querySelector<HTMLElement>(
      "[data-scroll-container]",
    );
    if (!scrollContainer) return;

    lastScrollTop.current = scrollContainer.scrollTop;
    const handleScroll = () => {
      const currentTop = scrollContainer.scrollTop;
      const delta = currentTop - lastScrollTop.current;
      if (Math.abs(delta) < 8) return;

      if (currentTop <= 8 || delta < 0) {
        setNavHidden(false);
      } else if (!moreOpen && !profileActionsOpen && delta > 0) {
        setNavHidden(true);
      }
      lastScrollTop.current = currentTop;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [isMobile, moreOpen, profileActionsOpen]);

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

  const tabIconClass = (active: boolean) =>
    cn("size-[19px] transition-transform duration-200", active && "scale-105");

  const tabIconSlot = (active: boolean) =>
    cn(
      "relative z-10 flex size-10 items-center justify-center rounded-2xl transition-colors duration-200",
      active
        ? "bg-primary/12 text-primary shadow-sm shadow-primary/10"
        : "text-muted-foreground/80 hover:bg-muted/60",
    );

  const profileIconSlot = cn(
    "relative z-10 flex size-10 items-center justify-center rounded-2xl border transition-[background-color,border-color,box-shadow,transform] duration-200",
    profileVisualActive
      ? "border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/10"
      : "border-transparent text-muted-foreground/80 group-hover/profile:bg-muted/60",
    profileActionsOpen &&
      "border-primary/30 bg-primary/15 shadow-md shadow-primary/10",
    profilePressing && "scale-[0.97]",
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
      onFocusCapture={() => setNavHidden(false)}
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
              className={tabClass(active)}
            >
              <span className={tabIconSlot(active)}>
                <Icon icon={item.icon} className={tabIconClass(active)} />
              </span>
            </Link>
          );
        })}

        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger
            aria-label={t("nav.more")}
            title={t("nav.more")}
            className={tabClass(moreActive)}
          >
            <span className={tabIconSlot(moreActive)}>
              <Icon
                icon={MoreHorizontal}
                className={tabIconClass(moreActive)}
              />
            </span>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={10}
            className={cn(
              "w-52 max-w-[calc(100vw-1rem)] rounded-2xl border-border/50 p-2 shadow-xl",
              prefersReducedMotion
                ? "data-open:animate-none data-closed:animate-none"
                : "data-open:slide-in-from-bottom-2 data-open:duration-150",
            )}
          >
            <div className="mb-2 border-b border-border/40 px-1 pb-2">
              <span className="text-xs font-semibold text-foreground">
                {t("nav.more")}
              </span>
            </div>
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
                      if (!active) {
                        setPendingPath(item.path);
                        setMoreOpen(false);
                      }
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
          </PopoverContent>
        </Popover>

        {/* Profile tab: a long press reveals the mobile sign-out action. */}
        <Popover
          open={profileActionsOpen}
          onOpenChange={handleProfileMenuOpenChange}
        >
          <PopoverTrigger
            type="button"
            aria-current={profileActive ? "page" : undefined}
            title={`${t("profile.myProfile")} · ${t("profile.longPressHint")}`}
            aria-label={`${t("profile.myProfile")}. ${t("profile.longPressHint")}`}
            aria-haspopup="menu"
            aria-expanded={profileActionsOpen}
            className={cn(
              tabClass(profileVisualActive),
              "group/profile",
              profilePressing && "text-primary",
            )}
            {...profilePressHandlers}
            onPointerDown={(event) => {
              profileLongPressRef.current = false;
              profilePressHandlers.onPointerDown(event);
            }}
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
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            sideOffset={10}
            role="menu"
            aria-label={t("profile.actions")}
            onPointerDown={handleProfileMenuPointerDown}
            onPointerMove={handleProfileMenuPointerMove}
            onPointerUp={finishProfileMenuSwipe}
            onPointerCancel={finishProfileMenuSwipe}
            onClickCapture={(event) => {
              if (profileMenuSuppressClick.current) {
                event.preventDefault();
                event.stopPropagation();
                profileMenuSuppressClick.current = false;
              }
            }}
            style={{
              translate: `0 ${profileMenuOffset}px`,
              transition:
                profileMenuDragging || prefersReducedMotion
                  ? "none"
                  : "translate 180ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="w-52 rounded-2xl border-border/50 p-2 shadow-xl"
          >
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
                className="flex min-w-0 items-center gap-2 rounded-xl bg-primary/[0.06] px-2 py-1.5 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {profile ? (
                  <UserAvatar profile={profile} size="sm" className="size-8" />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon icon={UserRound} className="size-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold leading-tight text-foreground">
                    {profile?.name ?? t("profile.user")}
                  </span>
                  {profile?.email ? (
                    <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted-foreground">
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

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.16, delay: 0.06, ease: "easeOut" }
                }
              >
                <div className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
                    <Icon icon={Palette} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    {t("common.toggleTheme")}
                  </span>
                  <ThemeToggle className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" />
                </div>
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
          </PopoverContent>
        </Popover>

        <ConfirmDialog
          open={signOutConfirmOpen}
          onOpenChange={setSignOutConfirmOpen}
          title={t("profile.signOutConfirmTitle")}
          description={t("profile.signOutConfirmDescription")}
          confirmLabel={t("profile.signOut")}
          cancelLabel={t("common.cancel")}
          onConfirm={() => void handleSignOut()}
          variant="destructive"
          icon={
            <AlertDialogMedia className="bg-destructive/15 shadow-destructive/20">
              <Icon icon={TriangleAlert} className="size-6 text-destructive" />
            </AlertDialogMedia>
          }
        />
      </div>
    </motion.nav>
  );
}
