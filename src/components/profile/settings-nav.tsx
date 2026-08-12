"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon, type IconProps } from "@/components/shared";
import { Bell, Droplet, Shield, UserRound, Users } from "@/lib/icons";
import { cn } from "@/lib/utils";

const SECTIONS: Array<{
  id: string;
  icon: IconProps["icon"];
  labelKey: string;
}> = [
  { id: "profile", icon: UserRound, labelKey: "settings.profile.title" },
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
  const ids = SECTIONS.map((section) => section.id);
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
    <nav aria-label={t("settings.navLabel")} className="lg:sticky lg:top-6">
      <ul className="mt-1 flex gap-1.5 overflow-x-auto pb-1 lg:mt-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {SECTIONS.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => scrollTo(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors lg:w-full lg:rounded-lg lg:border-0 lg:px-3 lg:py-2",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/40 bg-card/50 text-muted-foreground hover:border-border/70 hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <Icon icon={section.icon} className="size-4 shrink-0" />
                <span className="truncate">{t(section.labelKey)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
