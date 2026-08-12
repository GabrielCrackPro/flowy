"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Icon, type IconProps } from "@/components/shared";
import { Button } from "@/components/ui";
import { usePwa } from "@/hooks/usePwa";
import {
  ArrowUpDown,
  Droplet,
  Home,
  Plus,
  Repeat2,
  Tag,
  Target,
  Wallet,
  X,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { NewTransaction } from "../new-transaction";
import { SidebarCollapseButton } from "./SidebarCollapseButton";
import { SidebarItem } from "./SidebarItem";
import { SidebarProfile } from "./SidebarProfile";
import { SpaceSwitcher } from "./SpaceSwitcher";

type NavSection = {
  title: string;
  items: {
    path: string;
    label: string;
    icon: IconProps["icon"];
    badge?: string | number;
    matchPrefix?: boolean;
  }[];
};

type SidebarStateContextValue = {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
  toggleCollapsed: () => void;
};

const SidebarStateContext = createContext<SidebarStateContextValue | null>(
  null,
);

export function useSidebarState() {
  const ctx = useContext(SidebarStateContext);
  if (!ctx) {
    return {
      collapsed: false,
      setCollapsed: () => {},
      toggleCollapsed: () => {},
    };
  }
  return ctx;
}

export interface SidebarContentProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  className?: string;
}

export function SidebarContent({
  variant = "desktop",
  onNavigate,
  className,
}: SidebarContentProps) {
  const pathname = usePathname();
  const state = useSidebarState();
  const collapsed = variant === "desktop" ? state.collapsed : false;
  const { t } = useTranslation();

  const nav: NavSection[] = useMemo(
    () => [
      {
        title: t("nav.main"),
        items: [
          {
            path: "/dashboard",
            label: t("nav.overview"),
            icon: Home,
            matchPrefix: false,
          },
        ],
      },
      {
        title: t("nav.finances"),
        items: [
          {
            path: "/dashboard/transactions",
            label: t("nav.transactions"),
            icon: ArrowUpDown,
            matchPrefix: true,
          },
          {
            path: "/dashboard/categories",
            label: t("nav.categories"),
            icon: Tag,
            matchPrefix: true,
          },
          {
            path: "/dashboard/budgets",
            label: t("nav.budgets"),
            icon: Wallet,
            matchPrefix: true,
          },
          {
            path: "/dashboard/goals",
            label: t("nav.goals"),
            icon: Target,
            matchPrefix: true,
          },
          {
            path: "/dashboard/subscriptions",
            label: t("nav.subscriptions"),
            icon: Repeat2,
            matchPrefix: true,
          },
        ],
      },
    ],
    [t],
  );

  const isActive = (item: NavSection["items"][number]) => {
    if (item.matchPrefix) {
      return pathname === item.path || pathname.startsWith(`${item.path}/`);
    }
    return pathname === item.path;
  };

  return (
    <div
      className={cn("flex h-full w-full flex-col bg-transparent", className)}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-border/30 transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          collapsed && variant === "desktop"
            ? "flex-col gap-1.5 px-2 py-1.5"
            : "justify-between px-5 py-5",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            "flex items-center min-w-0 group/logo",
            collapsed && variant === "desktop"
              ? "justify-center w-full"
              : "gap-3",
          )}
        >
          <motion.div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 transition duration-300",
              collapsed && variant === "desktop" ? "size-9" : "size-10",
            )}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon
              icon={Droplet}
              className="size-5 transition-transform duration-300 group-hover/logo:rotate-[8deg]"
            />
          </motion.div>

          <motion.div
            className="min-w-0 overflow-hidden"
            initial={{ opacity: 0, x: -12 }}
            animate={{
              opacity: collapsed ? 0 : 1,
              x: collapsed ? -12 : 0,
              width: collapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-lg font-bold tracking-tight leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Flowy
            </h1>
            <p
              className="text-xs text-muted-foreground truncate mt-1"
              suppressHydrationWarning
            >
              {t("nav.personalFinances")}
            </p>
          </motion.div>
        </Link>

        {variant === "desktop" ? (
          <SidebarCollapseButton
            collapsed={collapsed}
            onToggle={state.toggleCollapsed}
          />
        ) : (
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={t("nav.closeMenu")}
            onClick={onNavigate}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
          >
            <Icon icon={X} className="size-4" />
          </motion.button>
        )}
      </div>

      <SpaceSwitcher
        collapsed={collapsed && variant === "desktop"}
        onNavigate={onNavigate}
      />

      <nav
        className={cn(
          "sidebar-scrollbar flex-1 min-h-0 w-full scroll-smooth overflow-y-auto transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          collapsed && variant === "desktop"
            ? "px-0 py-3 space-y-1"
            : "px-3 py-3 space-y-5",
        )}
      >
        {nav.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.05 }}
            className="space-y-1 transition-[margin-top] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            <div
              className={cn(
                "px-3 transition duration-300 overflow-hidden",
                collapsed && variant === "desktop"
                  ? "max-h-0 opacity-0"
                  : cn(
                      "max-h-12 opacity-100",
                      section.title === nav[0]?.title
                        ? "pt-0 pb-1"
                        : "pt-3 pb-1",
                    ),
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  {section.title}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
              </div>
            </div>
            {collapsed && variant === "desktop" ? (
              <div className="mx-auto my-2.5 h-px w-7 rounded-full bg-gradient-to-r from-border/80 via-border/60 to-border/80" />
            ) : null}

            <div className="space-y-1 px-0.5">
              {section.items.map((item, itemIndex) => {
                const active = isActive(item);
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: sectionIndex * 0.05 + itemIndex * 0.03,
                    }}
                  >
                    <SidebarItem
                      path={item.path}
                      label={item.label}
                      icon={item.icon}
                      active={active}
                      collapsed={collapsed && variant === "desktop"}
                      onClick={onNavigate}
                      badge={item.badge}
                      expandDelay={itemIndex * 25}
                      pillLayoutId={
                        variant === "desktop"
                          ? "sidebar-active-pill"
                          : "sidebar-active-pill-mobile"
                      }
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border/30">
        <AnimatePresence initial={false} mode="popLayout">
          {!(collapsed && variant === "desktop") ? (
            <motion.div
              key="cta-expanded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="p-3 pb-0 pt-3"
            >
              <NewTransaction />
            </motion.div>
          ) : (
            <motion.div
              key="cta-collapsed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="p-3 pb-0 pt-3"
            >
              <Button
                asChild
                size="icon"
                className="mx-auto flex size-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md transition duration-300 hover:from-primary/90 hover:to-primary/70 hover:ring-4 hover:ring-primary/20"
              >
                <Link
                  href="/dashboard/transactions/add"
                  onClick={onNavigate}
                  aria-label={t("nav.newTransaction")}
                  className="group"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon icon={Plus} className="size-5" />
                  </motion.div>
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "flex items-center justify-between",
            collapsed && variant === "desktop" ? "py-1" : "px-3 py-2",
          )}
        >
          <SidebarProfile
            variant={variant}
            collapsed={collapsed && variant === "desktop"}
            onNavigate={onNavigate}
            className="border-t-0"
          />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isStandalone } = usePwa();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem("sidebar-collapsed", String(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("sidebar-collapsed") === "true") {
        setCollapsed(true);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  // Cmd/Ctrl + B toggles the sidebar (standard dashboard shortcut)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Let text editing keep its shortcuts (e.g. future rich-text bold)
      if (
        (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCollapsed]);

  // In PWA standalone mode the sidebar is replaced by the bottom nav bar
  if (isStandalone) return null;

  return (
    <SidebarStateContext.Provider
      value={{ collapsed, setCollapsed, toggleCollapsed }}
    >
      <aside
        id="sidebar"
        style={{ width: collapsed ? "4.5rem" : "18rem" }}
        className={cn(
          "hidden md:flex h-screen shrink-0 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-r border-border/30 bg-transparent",
        )}
        aria-label={t("nav.mainAriaLabel")}
      >
        <SidebarContent />
      </aside>
    </SidebarStateContext.Provider>
  );
}
