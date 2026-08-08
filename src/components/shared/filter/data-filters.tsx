"use client";

import { Icon } from "@/components/shared";
import { useTranslation } from "react-i18next";
import { cn } from "@lib/utils";
import { X } from "@/lib/icons";
import { motion } from "framer-motion";
import { useDataFilters } from "@/hooks/filter/useDataFilters";
import type { FilterField } from "@/types/ui";
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
      {open === undefined && (
        <div className="flex items-center gap-3">
          {title && (
            <div className="mr-auto">
              <h3 className="text-base font-semibold tracking-tight">
                {title}
              </h3>

              <p className="mt-0.5 text-xs leading-none text-muted-foreground/50">
                {t("filters.filterAndSearch")}
              </p>
            </div>
          )}

          <FiltersToggleButton
            open={filtersOpen}
            hasActiveFilters={hasActiveFilters}
            activeFiltersCount={activeFiltersCount}
            label={resolvedFilterLabel}
            onClick={() => setFiltersOpen(!filtersOpen)}
          />
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

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
          {filterFields.map((field, index) => (
            <motion.div
              key={field.key}
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
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/30 px-2.5 text-xs font-medium text-muted-foreground/60 transition-all duration-200 hover:border-border/50 hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground"
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
