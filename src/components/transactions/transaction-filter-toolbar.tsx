"use client";

import {
  ActionBar,
  ActiveFilterChips,
  DataFilters,
  Icon,
  RelativeTime,
  SearchInput,
} from "@components/shared";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide";
import { MorphIcon } from "morphicons/react";
import { Filter } from "@/lib/icons";
import type { Transaction } from "@/types/Transaction";
import type { FilterField } from "@/types/ui";
import { NewTransaction } from "../dashboard/new-transaction/new-transaction";
import { TransactionExportMenu } from "./transaction-export-menu";

interface TransactionFilterToolbarProps {
  filters: Record<string, string | undefined>;
  filterOpen: boolean;
  filterFields: FilterField[];
  t: (key: string, options?: Record<string, unknown>) => string;
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
  const activeFilterCount = filterFields.reduce((count, field) => {
    if (field.type === "search") return count;
    if (field.type === "date-range") {
      return (
        count +
        (filters[`${field.key}From`] || filters[`${field.key}To`] ? 1 : 0)
      );
    }
    return count + (filters[field.key] ? 1 : 0);
  }, 0);

  const filterAction = (
    <motion.button
      type="button"
      onClick={() => onFilterOpenChange(!filterOpen)}
      aria-expanded={filterOpen}
      aria-controls="transaction-filters"
      aria-label={t("transactions.filterBtn")}
      title={t("transactions.filterBtn")}
      className={cn(
        "relative inline-flex h-10 min-w-0 shrink-0 items-center justify-start gap-2 rounded-xl border px-3 text-xs font-medium touch-manipulation transition duration-200 sm:h-9 sm:justify-center",
        "max-sm:flex-1",
        filterOpen
          ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
          : activeFilterCount > 0
            ? "border-primary/30 bg-primary/5 text-foreground hover:border-primary/40 hover:bg-primary/10"
            : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
      )}
    >
      <Icon icon={Filter} className="size-4" />
      <span>{t("transactions.filterBtn")}</span>
      <span className="hidden sm:flex">
        <MorphIcon
          icon={filterOpen ? ChevronUp : ChevronDown}
          size={14}
          reducedMotion="user"
        />
      </span>
      {activeFilterCount > 0 && (
        <span
          title={t("filters.activeCount", { count: activeFilterCount })}
          className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        >
          {activeFilterCount}
        </span>
      )}
    </motion.button>
  );

  return (
    <>
      <ActionBar
        ariaLabel={t("profile.actions")}
        surface="plain"
        className="gap-2.5 sm:gap-3"
        actionsClassName="w-full sm:w-auto sm:gap-1.5"
        search={
          <SearchInput
            value={filters.search ?? ""}
            onChange={(value) => onFilterChange("search", value || undefined)}
            placeholder={t("transactions.searchPlaceholder")}
            className="w-full min-w-0"
            inputClassName="h-10 text-xs sm:h-9"
          />
        }
        filterAction={filterAction}
        exportAction={
          transactionCount > 0 ? (
            <TransactionExportMenu
              transactions={transactions}
              locale={locale}
              currency={currency}
              t={t}
            />
          ) : undefined
        }
        onRefresh={onRefresh}
        refreshing={loading}
        refreshLabel={t("dashboard.refresh")}
        createAction={
          <div className="w-auto sm:w-auto">
            <NewTransaction size="sm" openInSheet={true} compactMobile />
          </div>
        }
      >
        {lastRefreshedAt && (
          <RelativeTime
            date={lastRefreshedAt}
            locale={locale}
            prefix="·"
            className="hidden text-[11px] text-muted-foreground/60 sm:inline"
          />
        )}
      </ActionBar>

      <div id="transaction-filters">
        <DataFilters
          fields={filterFields.filter((field) => field.type !== "search")}
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
      </div>
    </>
  );
}
