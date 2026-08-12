"use client";

import {
  CommandPalette,
  Icon,
  type IconProps,
  InstallAppButton,
  SyncingIndicator,
  ThemeToggle,
} from "@components/shared";
import { Button, Sheet, SheetContent } from "@components/ui";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SpaceSwitcherPill } from "@/components/shared/space-switcher-pill";
import { usePwa } from "@/hooks/usePwa";
import {
  ArrowUpDown,
  ChevronRight,
  Home,
  Menu,
  Repeat2,
  SearchIcon,
  Tag,
  Target,
  User,
  Wallet,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SidebarContent } from "../sidebar/Sidebar";
import { Search } from "./Search";
import { UserMenu } from "./UserMenu";

type Crumb = {
  label: string;
  icon?: IconProps["icon"];
  href: string;
};

function buildCrumbs(pathname: string, t: (key: string) => string): Crumb[] {
  if (pathname === "/dashboard") {
    return [{ label: t("header.overview"), icon: Home, href: "/dashboard" }];
  }

  const segment = pathname.split("/").filter(Boolean)[1] ?? "";

  const bySegment: Record<string, Crumb> = {
    profile: {
      label: t("header.profile"),
      icon: User,
      href: "/dashboard/profile",
    },
    transactions: {
      label: t("header.transactions"),
      icon: ArrowUpDown,
      href: "/dashboard/transactions",
    },
    categories: {
      label: t("header.categories"),
      icon: Tag,
      href: "/dashboard/categories",
    },
    budgets: {
      label: t("header.budgets"),
      icon: Wallet,
      href: "/dashboard/budgets",
    },
    goals: { label: t("header.goals"), icon: Target, href: "/dashboard/goals" },
    subscriptions: {
      label: t("header.subscriptions"),
      icon: Repeat2,
      href: "/dashboard/subscriptions",
    },
  };

  if (bySegment[segment]) {
    return [
      { label: t("header.home"), icon: Home, href: "/dashboard" },
      bySegment[segment],
    ];
  }

  return [{ label: t("header.overview"), icon: Home, href: "/dashboard" }];
}

export function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isStandalone } = usePwa();
  const crumbs = useMemo(() => buildCrumbs(pathname, t), [pathname, t]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Global ⌘K / Ctrl+K toggle + "/" to open (matches the hint in Search.tsx)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore keystrokes during IME composition (e.g. CJK input methods)
      if (e.isComposing) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
        return;
      }

      // "/" opens search unless the user is typing in a field
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (!mod && e.key === "/" && !isTyping) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-40 border-b border-border/40 backdrop-blur-xl"
      >
        <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("nav.openMenu")}
                className={cn(
                  "rounded-xl hover:bg-muted/40",
                  isStandalone ? "hidden" : "md:hidden",
                )}
                onClick={() => setMobileNavOpen(true)}
              >
                <Icon icon={Menu} className="size-5" />
              </Button>
            </motion.div>

            <nav
              aria-label={t("header.breadcrumb")}
              className="flex min-w-0 items-center gap-1 text-sm"
            >
              {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                const IconComponent = crumb.icon;
                return (
                  <motion.div
                    key={crumb.href}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                      delay: i * 0.05,
                    }}
                    className="flex min-w-0 items-center gap-1.5"
                  >
                    {i > 0 && (
                      <Icon
                        icon={ChevronRight}
                        className="size-3.5 shrink-0 text-muted-foreground/40"
                      />
                    )}
                    {isLast ? (
                      <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                        {IconComponent && (
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icon icon={IconComponent} className="size-3.5" />
                          </span>
                        )}
                        <span className="truncate">{crumb.label}</span>
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                      >
                        {IconComponent && (
                          <Icon icon={IconComponent} className="size-4" />
                        )}
                        {crumb.label}
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </nav>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className={cn(
                "shrink-0",
                isStandalone ? "block" : "hidden md:block",
              )}
            >
              <SpaceSwitcherPill />
            </motion.div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <Search onOpenDialog={() => setSearchOpen(true)} />
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("search.open")}
                className="rounded-xl hover:bg-muted/40 sm:hidden"
                onClick={() => setSearchOpen(true)}
              >
                <Icon icon={SearchIcon} className="size-4" />
              </Button>
            </motion.div>

            <SyncingIndicator />

            <InstallAppButton />

            <div className="flex items-center gap-0.5 rounded-xl border border-border/30 bg-card/50 p-0.5 shadow-sm">
              <LanguageSwitcher />
              <ThemeToggle className="rounded-lg hover:bg-accent" />
            </div>

            <UserMenu />
          </div>
        </div>

        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </motion.header>

      <SheetContent side="left" className="w-72 max-w-[80vw] p-0">
        <SidebarContent
          variant="mobile"
          onNavigate={() => setMobileNavOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
