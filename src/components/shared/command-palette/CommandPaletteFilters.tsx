"use client";

import { motion } from "framer-motion";
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

  return (
    <div className="flex items-center gap-1.5 border-b border-border/30 px-4 py-2.5">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onFilterChange("all")}
        data-active={activeFilter === "all"}
        className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all data-[active=true]:bg-gradient-to-r from-primary to-primary/90 text-white data-[active=true]:shadow-md data-[active=false]:text-muted-foreground/70 data-[active=false]:hover:text-foreground"
      >
        {t("filters.all")}
      </motion.button>
      {availableFilters.map((type) => {
        const meta = sectionMeta[type];
        const FIcon = meta.icon;
        return (
          <motion.button
            key={type}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(type)}
            data-active={activeFilter === type}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all data-[active=true]:bg-gradient-to-r from-primary to-primary/90 text-white data-[active=true]:shadow-md data-[active=false]:text-muted-foreground/70 data-[active=false]:hover:text-foreground"
          >
            <Icon icon={FIcon} className="h-3 w-3" />
            {t(sectionLabels[type])}
          </motion.button>
        );
      })}
    </div>
  );
}
