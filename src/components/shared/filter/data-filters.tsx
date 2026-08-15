"use client";

import { Button } from "@components/ui";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDataFilters } from "@/hooks/filter/useDataFilters";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Check, Filter, X } from "@/lib/icons";
import type { FilterField } from "@/types/ui";
import { BottomSheet } from "../bottom-sheet";
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
  const isMobile = useIsMobile();
  const resolvedFilterLabel = filterLabel ?? t("filters.title");
  const resolvedClearLabel = clearLabel ?? t("filters.clearFilters");
  const [mobileDraftValues, setMobileDraftValues] = useState(values);

  const mobileFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      setMobileDraftValues((current) => ({ ...current, [key]: value }));
    },
    [],
  );

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
    values: isMobile ? mobileDraftValues : values,
    onChange: isMobile ? mobileFilterChange : onChange,
    open,
    onOpenChange,
  });

  const filterKeys = useMemo(
    () =>
      fields.flatMap((field) =>
        field.type === "date-range"
          ? [`${field.key}From`, `${field.key}To`]
          : [field.key],
      ),
    [fields],
  );

  const resetMobileDraft = useCallback(() => {
    setMobileDraftValues(values);
  }, [values]);

  useEffect(() => {
    if (filtersOpen) {
      resetMobileDraft();
      return;
    }
    resetMobileDraft();
  }, [filtersOpen, resetMobileDraft]);

  // `useIsMobile` starts false during SSR. Once the viewport is known, the
  // controlled filter state determines whether the sheet is being edited.
  const isMobileEditing = isMobile && filtersOpen;

  const handleMobileOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && searchField) {
        setSearchDraft(values[searchField.key] ?? "");
      }
      setFiltersOpen(nextOpen);
    },
    [searchField, setFiltersOpen, setSearchDraft, values],
  );

  const clearMobileDraft = useCallback(() => {
    setSearchDraft("");
    setMobileDraftValues((current) => {
      const cleared = { ...current };
      const keys = new Set([...filterKeys, ...Object.keys(current)]);
      for (const key of keys) cleared[key] = undefined;
      return cleared;
    });
  }, [filterKeys, setSearchDraft]);

  const applyMobileDraft = useCallback(() => {
    const nextValues = { ...mobileDraftValues };
    if (searchField) {
      nextValues[searchField.key] = searchDraft || undefined;
      setSearchDraft(nextValues[searchField.key] ?? "");
    }

    const keys = new Set([...filterKeys, ...Object.keys(values)]);
    for (const key of keys) {
      const currentValue = values[key] || undefined;
      const nextValue = nextValues[key] || undefined;
      if (currentValue !== nextValue) onChange(key, nextValue);
    }

    setFiltersOpen(false);
  }, [
    filterKeys,
    mobileDraftValues,
    onChange,
    searchDraft,
    searchField,
    setFiltersOpen,
    setSearchDraft,
    values,
  ]);

  const filterControls = (
    <>
      {searchField && (
        <SearchFilter
          value={searchDraft}
          placeholder={searchPlaceholder}
          onChange={setSearchDraft}
          onClear={() => {
            setSearchDraft("");
            if (isMobileEditing) {
              mobileFilterChange(searchField.key, undefined);
            } else {
              onChange(searchField.key, undefined);
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2.5">
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
              values={isMobileEditing ? mobileDraftValues : values}
              onChange={isMobileEditing ? mobileFilterChange : onChange}
              t={t}
            />
          </motion.div>
        ))}

        {!isMobile && hasActiveFilters && (
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
    </>
  );

  const showFilterHeader =
    (!isMobile && (open === undefined || filtersOpen)) ||
    (isMobile && open === undefined && !filtersOpen);

  return (
    <div className={cn("space-y-3", className)}>
      {showFilterHeader && (
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

      {!isMobile ? (
        <FiltersPanel open={filtersOpen}>{filterControls}</FiltersPanel>
      ) : (
        <BottomSheet
          open={filtersOpen}
          onOpenChange={handleMobileOpenChange}
          title={resolvedFilterLabel}
          description={t("filters.filterAndSearch")}
          icon={<Icon icon={Filter} className="size-5" />}
          metadata={
            activeFiltersCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium tabular-nums text-primary ring-1 ring-primary/20">
                {t("filters.activeCount", { count: activeFiltersCount })}
              </span>
            ) : undefined
          }
          contentClassName="px-4 py-4"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={clearMobileDraft}
                className="min-w-0 flex-1"
              >
                {resolvedClearLabel}
              </Button>
              <Button
                type="button"
                onClick={applyMobileDraft}
                className="min-w-0 flex-1 gap-1.5"
              >
                <Icon icon={Check} className="size-3.5" />
                {t("filters.applyFilters")}
              </Button>
            </>
          }
        >
          {filterControls}
        </BottomSheet>
      )}
    </div>
  );
}
