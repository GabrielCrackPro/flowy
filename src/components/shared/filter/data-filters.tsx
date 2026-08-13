"use client";

import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useDataFilters } from "@/hooks/filter/useDataFilters";
import { X } from "@/lib/icons";
import type { FilterField } from "@/types/ui";
import { Icon } from "../icon";
import { FilterRenderer } from "./filter-renderer";
import { FiltersPanel } from "./filters-panel";
import { FiltersToggleButton } from "./filters-toggle";
import { SearchFilter } from "./search-filter";

export interface DataFiltersProps {
  fields: FilterField[];
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
  onClear: () => void;
  className?: string;
  title?: string;
  filterLabel?: string;
  clearLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DataFilters({
  fields,
  values,
  onChange,
  onClear,
  className,
  title,
  filterLabel,
  clearLabel,
  open,
  onOpenChange,
}: DataFiltersProps) {
  const { t } = useTranslation();

  const resolvedFilterLabel = filterLabel ?? t("filters.title");
  const resolvedClearLabel = clearLabel ?? t("filters.clearFilters");

  const {
    filtersOpen,
    setFiltersOpen,
    searchField,
    searchDraft,
    setSearchDraft,
    searchPlaceholder,
    filterFields,
    activeFiltersCount,
    hasActiveFilters,
  } = useDataFilters({
    fields,
    values,
    onChange,
    open,
    onOpenChange,
  });

  return (
    <div className={cn("space-y-3", className)}>
      {(open === undefined || filtersOpen) && (
        <div className="flex flex-wrap items-center gap-3">
          {(title || filtersOpen) && (
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold tracking-tight">
                {title ?? resolvedFilterLabel}
              </h3>

              <p className="mt-0.5 text-xs leading-none text-muted-foreground/60">
                {t("filters.filterAndSearch")}
              </p>
            </div>
          )}

          {open === undefined && (
            <FiltersToggleButton
              open={filtersOpen}
              hasActiveFilters={hasActiveFilters}
              activeFiltersCount={activeFiltersCount}
              label={resolvedFilterLabel}
              onClick={() => setFiltersOpen(!filtersOpen)}
            />
          )}

          {open !== undefined && filtersOpen && hasActiveFilters && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium tabular-nums text-primary ring-1 ring-primary/20">
              {activeFiltersCount}
            </span>
          )}
        </div>
      )}

      <FiltersPanel open={filtersOpen}>
        {searchField && (
          <SearchFilter
            value={searchDraft}
            placeholder={searchPlaceholder}
            onChange={setSearchDraft}
            onClear={() => {
              setSearchDraft("");
              onChange(searchField.key, undefined);
            }}
          />
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2.5">
          {filterFields.map((field, index) => (
            <motion.div
              key={field.key}
              className="min-w-0 max-sm:w-full"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <FilterRenderer
                field={field}
                values={values}
                onChange={onChange}
                t={t}
              />
            </motion.div>
          ))}

          {hasActiveFilters && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClear}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/30 px-2.5 text-xs font-medium text-muted-foreground/60 transition duration-200 hover:border-border/50 hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground max-sm:w-full max-sm:justify-center"
            >
              <Icon icon={X} className="size-3" />

              <span>{resolvedClearLabel}</span>
            </motion.button>
          )}
        </div>
      </FiltersPanel>
    </div>
  );
}
