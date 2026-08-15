"use client";

import { motion } from "framer-motion";
import { ChevronRight, Loader2, SearchIcon } from "@/lib/icons";
import type { IconProps } from "../icon";
import { Icon } from "../icon";

interface CommandPaletteSuggestion {
  label: string;
  query: string;
  icon: IconProps["icon"];
}

interface CommandPaletteEmptyProps {
  type: "hint" | "searching" | "noResults" | "filterEmpty";
  t: (key: string) => string;
  suggestions?: CommandPaletteSuggestion[];
  onSuggestion?: (query: string) => void;
}

export function CommandPaletteEmpty({
  type,
  t,
  suggestions = [],
  onSuggestion,
}: CommandPaletteEmptyProps) {
  if (type === "hint") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 px-6 py-12 text-center sm:py-14"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon icon={SearchIcon} className="size-5" />
        </div>
        <p className="text-sm font-medium text-muted-foreground/70">
          {t("search.typeHint")}
        </p>
      </motion.div>
    );
  }

  if (type === "searching") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 px-6 py-12 text-center sm:py-14"
      >
        <Icon icon={Loader2} className="size-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground/60">
          {t("search.searching")}
        </p>
      </motion.div>
    );
  }

  const message =
    type === "noResults" ? t("search.noResults") : t("search.filterEmpty");
  const description = type === "noResults" ? t("search.noResultsDesc") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 px-4 py-10 text-center sm:px-6 sm:py-12"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Icon icon={SearchIcon} className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground/80">
          {message}
        </p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground/50">{description}</p>
        )}
      </div>
      {suggestions.length > 0 && onSuggestion && (
        <div className="w-full max-w-lg space-y-2 text-left">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50">
            {t("search.tryInstead")}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.query}
                type="button"
                onClick={() => onSuggestion(suggestion.query)}
                className="group flex min-h-12 min-w-0 items-center gap-2.5 rounded-xl border border-border/50 bg-card/80 px-3 text-left text-xs font-medium text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon icon={suggestion.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {suggestion.label}
                </span>
                <Icon
                  icon={ChevronRight}
                  className="size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary/70"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
