"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon, type IconProps } from "@/components/shared";
import { useFlags } from "@/hooks/useFlags";
import {
  Bell,
  Droplet,
  MessageSquare,
  Settings2,
  Shield,
  UserRound,
  Users,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const BASE_SECTIONS: Array<{
  id: string;
  icon: IconProps["icon"];
  labelKey: string;
  requiresFlag?: boolean;
}> = [
  { id: "profile", icon: UserRound, labelKey: "settings.profile.title" },
  {
    id: "preferences",
    icon: Settings2,
    labelKey: "settings.preferences.title",
  },
  {
    id: "assistant",
    icon: MessageSquare,
    labelKey: "settings.assistant.title",
    requiresFlag: true,
  },
  { id: "spaces", icon: Users, labelKey: "profile.spaces.title" },
  { id: "notifications", icon: Bell, labelKey: "settings.notifications.title" },
  { id: "security", icon: Shield, labelKey: "settings.security.title" },
  { id: "about", icon: Droplet, labelKey: "settings.about.title" },
];

/** The dashboard scrolls inside `main[data-scroll-container]`, not the window. */
function getScrollContainer(): Element | null {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector("[data-scroll-container]") ??
    document.scrollingElement
  );
}

/**
 * Tracks which settings section is currently in view. The "active line" sits
 * just below the sticky header; at the very bottom the last section wins.
 */
function useScrollSpy(ids: string[], offset = 140) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const container = getScrollContainer();
      if (!container) return;

      let current = ids[0];
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= offset) current = id;
      }

      const atBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 2;
      if (atBottom) current = ids[ids.length - 1];

      setActiveId(current);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    const container = getScrollContainer();
    container?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      container?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ids, offset]);

  return activeId;
}

/**
 * Settings section navigation. On desktop it's a sticky sidebar rail next to
 * the content; on mobile it collapses into a scrollable strip of pills at the
 * top of the page (it scrolls away with the content — no pinned top bar).
 */
export function SettingsNav() {
  const { t } = useTranslation();
  const { assistantEnabled: assistantFlag } = useFlags();
  const sections = BASE_SECTIONS.filter(
    (section) => !section.requiresFlag || assistantFlag,
  );
  const ids = sections.map((section) => section.id);
  const activeId = useScrollSpy(ids);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <nav
      aria-label={t("settings.navLabel")}
      className="min-w-0 lg:sticky lg:top-6"
    >
      <div className="-mx-1 overflow-hidden rounded-2xl border border-border/40 bg-muted/20 p-1 lg:mx-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
        <ul className="flex min-w-max gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:min-w-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
          {sections.map((section) => {
            const isActive = activeId === section.id;
            return (
              <li key={section.id} className="shrink-0 lg:min-w-0">
                <button
                  type="button"
                  onClick={() => scrollTo(section.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex min-h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors lg:w-full lg:justify-start lg:rounded-lg",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon icon={section.icon} className="size-4 shrink-0" />
                  <span>{t(section.labelKey)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
