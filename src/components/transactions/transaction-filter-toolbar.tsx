"use client";

import {
  ActiveFilterChips,
  DataFilters,
  Icon,
  RelativeTime,
  SearchInput,
} from "@components/shared";
import { Button } from "@components/ui";
import { cn } from "@lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, FilterX, RefreshCw } from "@/lib/icons";
import type { Transaction } from "@/types/Transaction";
import type { FilterField } from "@/types/ui";
import { NewTransaction } from "../dashboard/new-transaction/new-transaction";
import { TransactionExportMenu } from "./transaction-export-menu";

interface TransactionFilterToolbarProps {
  filters: Record<string, string | undefined>;
  filterOpen: boolean;
  hasFilters: boolean;
  filterFields: FilterField[];
  t: (key: string) => string;
  transactionCount: number;
  transactions: Transaction[];
  loading: boolean;
  lastRefreshedAt: Date | null;
  locale: string;
  currency: string;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearFilters: () => void;
  onFilterOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  formatFilterValue: (key: string, value: string) => string | undefined;
  onRemoveChip: (key: string) => void;
}

export function TransactionFilterToolbar({
  filters,
  filterOpen,
  hasFilters,
  filterFields,
  t,
  transactionCount,
  transactions,
  loading,
  lastRefreshedAt,
  locale,
  currency,
  onFilterChange,
  onClearFilters,
  onFilterOpenChange,
  onRefresh,
  formatFilterValue,
  onRemoveChip,
}: TransactionFilterToolbarProps) {
  return (
    <>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 sm:mr-auto">
          <h3 className="text-sm font-semibold tracking-tight">
            {t("transactions.title")}
          </h3>
          <p className="text-[11px] text-muted-foreground/50 leading-none mt-1">
            {t("transactions.description")}
          </p>
        </div>

        {/* Search */}
        <SearchInput
          value={filters.search ?? ""}
          onChange={(value) => onFilterChange("search", value || undefined)}
          placeholder={t("transactions.searchPlaceholder")}
          className="w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-64"
          inputClassName="h-9 text-xs"
        />

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {/* Filter toggle */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterOpenChange(!filterOpen)}
            className={cn(
              "relative inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border px-4 text-xs font-medium transition duration-200 shadow-sm",
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
                  {t("common.close")}
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

          {/* Count pill */}
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border/30 bg-card/60 px-2.5 text-xs font-medium tabular-nums text-muted-foreground/70 shadow-sm">
            {loading
              ? "—"
              : new Intl.NumberFormat(locale).format(transactionCount)}
          </span>

          {/* Export */}
          {transactionCount > 0 && (
            <TransactionExportMenu
              transactions={transactions}
              locale={locale}
              currency={currency}
              t={t}
            />
          )}

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRefresh}
            disabled={loading}
            className="size-7 rounded-lg text-muted-foreground/40 hover:bg-muted/60 hover:text-foreground"
          >
            <Icon
              icon={RefreshCw}
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>

          {/* Last refreshed */}
          {lastRefreshedAt && (
            <RelativeTime
              date={lastRefreshedAt}
              locale={locale}
              prefix="·"
              className="text-[11px] text-muted-foreground/40 hidden sm:inline"
            />
          )}

          <div className="max-[420px]:basis-full max-[420px]:[&>button]:w-full">
            <NewTransaction size="sm" openInSheet={true} />
          </div>
        </div>
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
