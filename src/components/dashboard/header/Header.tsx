"use client";

import {
  AppLogo,
  AssistantPanel,
  CommandPalette,
  Icon,
  type IconProps,
  InstallAppButton,
  SyncingIndicator,
  ThemeToggle,
} from "@components/shared";
import { Button } from "@components/ui";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SpaceSwitcherPill } from "@/components/shared/space-switcher-pill";
import { useFlags } from "@/hooks/useFlags";
import { usePreferences } from "@/hooks/usePreferences";
import {
  ArrowUpDown,
  ChevronRight,
  Home,
  MessageSquare,
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
  const crumbs = useMemo(() => buildCrumbs(pathname, t), [pathname, t]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { get } = usePreferences();
  const { assistantEnabled: assistantFlag } = useFlags();
  const userAssistantEnabled = get("assistantEnabled");
  const assistantEnabled = assistantFlag && userAssistantEnabled;

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
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-40 border-b border-border/70 bg-card"
    >
      <div className="flex min-h-14 items-center gap-1.5 px-2 sm:h-16 sm:gap-4 sm:px-4 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
          <div className="flex min-w-0 items-center gap-1.5 md:hidden">
            <AppLogo compact showName={false} />
            <SpaceSwitcherPill compactMobile className="max-w-[7rem]" />
          </div>

          <nav
            aria-label={t("header.breadcrumb")}
            className="hidden min-w-0 items-center gap-1 text-sm md:flex"
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
                      className="hidden size-3.5 shrink-0 text-muted-foreground/40 sm:block"
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
                      className="hidden shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground sm:flex"
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
            className="hidden min-w-0 md:block"
          >
            <SpaceSwitcherPill />
          </motion.div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <div className="hidden md:block">
            <Search onOpenDialog={() => setSearchOpen(true)} />
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("search.open")}
              className="rounded-xl text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Icon icon={SearchIcon} className="size-4" />
            </Button>
          </motion.div>

          {assistantEnabled && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("assistant.title")}
              className="rounded-xl text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground"
              onClick={() => setAssistantOpen(true)}
            >
              <Icon icon={MessageSquare} className="size-4" />
            </Button>
          )}

          <SyncingIndicator className="max-md:text-muted-foreground/80 max-md:hover:bg-muted/60 max-md:hover:text-foreground" />

          <InstallAppButton className="max-md:text-muted-foreground/80 max-md:hover:bg-muted/60 max-md:hover:text-foreground" />

          <span className="hidden md:block">
            <LanguageSwitcher />
          </span>
          <ThemeToggle className="size-9 rounded-xl text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground max-md:size-10" />

          <div className="hidden md:block">
            <UserMenu />
          </div>
        </div>
      </div>

      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        openAssistant={() => setAssistantOpen(true)}
      />
      {assistantEnabled && (
        <AssistantPanel open={assistantOpen} onOpenChange={setAssistantOpen} />
      )}
    </motion.header>
  );
}
