"use client";

import { Filter } from "@/lib/icons";
import { Icon, type IconProps } from "../icon";

export type FilterType =
  | "all"
  | "transaction"
  | "category"
  | "budget"
  | "goal"
  | "subscription";

interface CommandPaletteFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  availableFilters: Exclude<FilterType, "all">[];
  sectionMeta: Record<
    Exclude<FilterType, "all">,
    { icon: IconProps["icon"]; labelKey: string }
  >;
  sectionLabels: Record<Exclude<FilterType, "all">, string>;
  t: (key: string) => string;
}

export function CommandPaletteFilters({
  activeFilter,
  onFilterChange,
  availableFilters,
  sectionMeta,
  sectionLabels,
  t,
}: CommandPaletteFiltersProps) {
  if (availableFilters.length <= 1) return null;

  const buttonClass =
    "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/50 px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onFilterChange("all")}
        aria-pressed={activeFilter === "all"}
        className={`${buttonClass} ${
          activeFilter === "all"
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border/50 bg-background/70 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        <Icon icon={Filter} className="size-3.5" />
        {t("filters.all")}
      </button>

      {availableFilters.map((type) => {
        const meta = sectionMeta[type];
        const active = activeFilter === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onFilterChange(type)}
            aria-pressed={active}
            className={`${buttonClass} ${
              active
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/50 bg-background/70 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Icon icon={meta.icon} className="size-3.5" />
            {t(sectionLabels[type])}
          </button>
        );
      })}
    </div>
  );
}
