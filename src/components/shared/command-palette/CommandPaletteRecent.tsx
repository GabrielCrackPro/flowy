"use client";

import { Clock, X } from "@/lib/icons";
import { Icon } from "../icon";
import { CommandPaletteItem } from "./CommandPaletteItem";
import { CommandPaletteSection } from "./CommandPaletteSection";

interface CommandPaletteRecentProps {
  recentSearches: string[];
  onRecentClick: (query: string) => void;
  onClearRecent: (e: React.MouseEvent) => void;
  t: (key: string) => string;
}

export function CommandPaletteRecent({
  recentSearches,
  onRecentClick,
  onClearRecent,
  t,
}: CommandPaletteRecentProps) {
  if (recentSearches.length === 0) return null;

  return (
    <CommandPaletteSection
      icon={Clock}
      label={t("search.recent")}
      footer={
        <div className="px-2 pb-1 pt-1">
          <button
            type="button"
            onClick={onClearRecent}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[11px] text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Icon icon={X} className="size-3" />
            {t("search.clearRecent")}
          </button>
        </div>
      }
    >
      {recentSearches.map((query) => (
        <CommandPaletteItem
          key={query}
          value={query}
          onSelect={() => onRecentClick(query)}
          icon={Clock}
          label={<span className="truncate">{query}</span>}
          showChevron
        />
      ))}
    </CommandPaletteSection>
  );
}
