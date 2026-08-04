"use client";

import { SidebarContent } from "@components/dashboard";
import {
  CommandPalette,
  Icon,
  type IconProps,
  ThemeToggle,
} from "@components/shared";
import { Button, Sheet, SheetContent } from "@components/ui";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSpaces } from "@/hooks/useSpaces";
import {
  ArrowUpDown,
  ChevronRight,
  Home,
  Layers,
  Menu,
  Repeat2,
  SearchIcon,
  Tag,
  Target,
  User,
  Wallet,
} from "@/lib/icons";
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
  const { activeSpace } = useSpaces();
  const crumbs = useMemo(() => buildCrumbs(pathname, t), [pathname, t]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
                className="rounded-xl hover:bg-muted/40 md:hidden"
                onClick={() => setMobileNavOpen(true)}
              >
                <Icon icon={Menu} className="h-5 w-5" />
              </Button>
            </motion.div>

            <nav
              aria-label="Breadcrumb"
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
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40"
                      />
                    )}
                    {isLast ? (
                      <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                        {IconComponent && (
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icon
                              icon={IconComponent}
                              className="h-3.5 w-3.5"
                            />
                          </span>
                        )}
                        <span className="truncate">{crumb.label}</span>
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground"
                      >
                        {IconComponent && (
                          <Icon icon={IconComponent} className="h-4 w-4" />
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
              className="hidden shrink-0 md:block"
            >
              <Link
                href="/dashboard/profile#spaces"
                title={t("profile.spaces.manageSpaces")}
                className="group inline-flex max-w-44 items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 py-1 pl-1.5 pr-2.5 text-xs font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-primary/40 hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)]"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-[0.6rem] font-bold text-primary-foreground shadow-sm shadow-primary/20">
                  {activeSpace?.name?.charAt(0).toUpperCase() ?? (
                    <Icon icon={Layers} className="size-2.5" />
                  )}
                </span>
                <span className="truncate">
                  {activeSpace?.name ?? t("profile.spaces.noSpace")}
                </span>
              </Link>
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
                <Icon icon={SearchIcon} className="h-4 w-4" />
              </Button>
            </motion.div>

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
