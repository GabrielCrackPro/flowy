"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button, Input } from "@components/ui";
import { NewTransaction } from "@components/dashboard";
import { ActiveFilterChips, DataFilters, Icon } from "@components/shared";
import { Filter, FilterX, Search, X } from "@/lib/icons";
import { cn } from "@lib/utils";
import type { FilterField } from "@/types/ui";

interface TransactionFilterToolbarProps {
  filters: Record<string, string | undefined>;
  filterOpen: boolean;
  hasFilters: boolean;
  filterFields: FilterField[];
  t: (key: string) => string;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearFilters: () => void;
  onFilterOpenChange: (open: boolean) => void;
  formatFilterValue: (key: string, value: string) => string | undefined;
  onRemoveChip: (key: string) => void;
}

export function TransactionFilterToolbar({
  filters,
  filterOpen,
  hasFilters,
  filterFields,
  t,
  onFilterChange,
  onClearFilters,
  onFilterOpenChange,
  formatFilterValue,
  onRemoveChip,
}: TransactionFilterToolbarProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h3 className="text-sm font-semibold tracking-tight">
            {t("transactions.title")}
          </h3>
          <p className="text-[11px] text-muted-foreground/50 leading-none mt-1">
            {t("transactions.description")}
          </p>
        </div>
        <div className="relative group w-full sm:w-auto sm:flex-1 sm:max-w-64">
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Icon
              icon={Search}
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
            />
            <Input
              value={filters.search ?? ""}
              onChange={(e) =>
                onFilterChange("search", e.target.value || undefined)
              }
              placeholder={t("transactions.searchPlaceholder")}
              className="h-9 w-full rounded-xl border-border/30 bg-muted/20 pl-9 pr-9 text-xs placeholder:text-muted-foreground/40 focus-visible:bg-background focus-visible:pl-9 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all shadow-sm sm:w-56"
            />
          </motion.div>
          <AnimatePresence>
            {filters.search && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12 }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onFilterChange("search", undefined)}
                  className="flex size-5 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:text-foreground hover:bg-muted/30"
                >
                  <Icon icon={X} className="size-3.5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterOpenChange(!filterOpen)}
          className={cn(
            "relative inline-flex h-9 items-center gap-2 rounded-xl border px-4 text-xs font-medium transition-all duration-200 shadow-sm",
            filterOpen
              ? "border-primary/50 bg-linear-to-r from-primary/15 to-primary/8 text-primary shadow-md"
              : hasFilters
                ? "border-primary/30 bg-linear-to-r from-primary/8 to-primary/4 text-foreground hover:border-primary/40 hover:from-primary/12 hover:to-primary/6"
                : "border-border/30 text-muted-foreground hover:border-border/50 hover:bg-muted/30 hover:text-foreground",
          )}
        >
          <AnimatePresence mode="wait">
            {filterOpen ? (
              <motion.span
                key="filter-x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                <Icon icon={FilterX} className="size-4" />
              </motion.span>
            ) : (
              <motion.span
                key="filter"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                <Icon icon={Filter} className="size-4" />
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {filterOpen ? (
              <motion.span
                key="clear-label"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.12 }}
              >
                {t("transactions.clearFilters")}
              </motion.span>
            ) : (
              <motion.span
                key="filter-label"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.12 }}
              >
                {t("transactions.filterBtn")}
              </motion.span>
            )}
          </AnimatePresence>
          {hasFilters && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex size-5 items-center justify-center rounded-full bg-linear-to-r from-primary to-primary/80 text-[10px] font-bold text-primary-foreground shadow-sm"
            >
              {
                Object.values(filters).filter(
                  (v) => v !== undefined && v !== "",
                ).length
              }
            </motion.span>
          )}
          {filterOpen && (
            <motion.span
              layoutId="filter-underline"
              className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-linear-to-r from-primary via-primary/60 to-primary"
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />
          )}
        </motion.button>
        <NewTransaction size="sm" openInSheet={true} />
      </div>
      <DataFilters
        fields={filterFields.filter((f) => f.type !== "search")}
        values={filters}
        onChange={onFilterChange}
        onClear={onClearFilters}
        open={filterOpen}
        onOpenChange={onFilterOpenChange}
        className="mt-4"
      />
      <ActiveFilterChips
        filters={filters}
        fields={filterFields}
        formatValue={formatFilterValue}
        onRemove={onRemoveChip}
        onClearAll={onClearFilters}
        className="mt-4"
      />
    </>
  );
}
