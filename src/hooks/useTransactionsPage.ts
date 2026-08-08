"use client";

import { useCategoryApi, useTransactionApi } from "@hooks/api";
import { useProfile } from "@hooks/useProfile";
import { filtersToQueryParams } from "@lib/filters";
import {
  EXPENSE_TYPE_KEY,
  getOptions,
  PAYMENT_METHOD_KEY,
} from "@utils/constants";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { bulkDeleteTransactions } from "@/lib/api/transaction";
import { parseDateOnly } from "@/lib/date-only";
import type { TransactionFilters } from "@/types/Transaction";
import type { FilterField } from "@/types/ui";
import { useFilterState } from "./useFilterState";
import { usePagination } from "./usePagination";
import { useSelection } from "./useSelection";

export function useTransactionsPage() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";
  const { categories } = useCategoryApi();

  const {
    filters,
    debouncedFilters,
    filterOpen,
    setFilterOpen,
    handleFilterChange,
    handleClearFilters,
    hasFilters,
  } = useFilterState();

  const { pagination, setPage } = usePagination({
    initialPage: 1,
    initialLimit: 50,
  });

  const {
    selectedIds,
    setSelectedIds,
    handleSelect,
    handleSelectAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
  } = useSelection<string>();

  const queryFilters = useMemo<TransactionFilters>(
    () => ({ ...filtersToQueryParams(debouncedFilters), ...pagination }),
    [debouncedFilters, pagination],
  );

  const { transactions, loading, refresh, update, remove } =
    useTransactionApi(queryFilters);

  const [detailTx, setDetailTx] = useState<
    (typeof transactions)[number] | null
  >(null);
  const [deleteTx, setDeleteTx] = useState<
    (typeof transactions)[number] | null
  >(null);
  const [bulkDeleteTx, setBulkDeleteTx] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (transactions.length > 0) {
      setLastRefreshedAt(new Date());
    }
  }, [transactions]);

  const categoryMap = useMemo(
    () =>
      new Map<string, { name: string }>(
        categories?.map((c) => [c.id, c]) ?? [],
      ),
    [categories],
  );

  const categoryOptions = useMemo(
    () =>
      categories?.map((c) => ({
        value: c.id,
        label: c.name,
        icon: c.icon ?? undefined,
        color: c.color ?? undefined,
      })) ?? [],
    [categories],
  );

  const sorted = useMemo(
    () =>
      [...transactions]
        .map((tx) => ({
          ...tx,
          amount:
            typeof tx.amount === "number" ? tx.amount : Number(tx.amount) || 0,
        }))
        .sort(
          (a, b) =>
            (parseDateOnly(b.date) ?? new Date(b.createdAt)).getTime() -
            (parseDateOnly(a.date) ?? new Date(a.createdAt)).getTime(),
        ),
    [transactions],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const tx of sorted) {
      if (tx.type === "INCOME") income += tx.amount;
      else expenses += tx.amount;
    }
    return { income, expenses, balance: income - expenses };
  }, [sorted]);

  const loadingDone = !loading || transactions.length > 0;

  const handleFilterChangeWithReset = useCallback(
    (key: string, value: string | undefined) => {
      handleFilterChange(key, value);
      setPage(1); // Reset to first page on filter change
    },
    [handleFilterChange, setPage],
  );

  const handleClearFiltersWithReset = useCallback(() => {
    handleClearFilters();
    setPage(1);
  }, [handleClearFilters, setPage]);

  const handleRefresh = useCallback(() => {
    refresh();
    setLastRefreshedAt(new Date());
  }, [refresh]);

  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDeleteTransactions(Array.from(selectedIds));
      clearSelection();
      setBulkDeleteTx(false);
      refresh();
      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error("Failed to delete transactions:", error);
      // Handle error appropriately (could add toast notification here)
      return;
    }
  }, [selectedIds, clearSelection, refresh]);

  const formatFilterValue = useCallback(
    (key: string, value: string) => {
      if (key === "type") {
        return value === "INCOME"
          ? t("transactions.income")
          : t("transactions.expenses");
      }
      if (key === "categoryId") {
        return value
          .split(",")
          .map((id) => categoryMap.get(id)?.name ?? id)
          .join(", ");
      }
      if (key === "paymentMethod") {
        return t(PAYMENT_METHOD_KEY[value] ?? value);
      }
      return undefined;
    },
    [t, categoryMap],
  );

  const handleRemoveChip = useCallback(
    (key: string) => {
      if (key === "date") {
        handleFilterChangeWithReset("dateFrom", undefined);
        handleFilterChangeWithReset("dateTo", undefined);
      } else {
        handleFilterChangeWithReset(key, undefined);
      }
    },
    [handleFilterChangeWithReset],
  );

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: "search",
        type: "search",
        label: "Buscar",
        placeholder: t("transactions.searchPlaceholder"),
      },
      {
        key: "date",
        type: "date-range",
        label: t("transactions.dateRange"),
        placeholder: t("transactions.dateRange"),
      },
      {
        key: "type",
        type: "select",
        label: t("transactions.type"),
        placeholder: t("transactions.all"),
        options: getOptions(EXPENSE_TYPE_KEY, t),
      },
      {
        key: "categoryId",
        type: "multi-select",
        label: t("transactions.category"),
        placeholder: t("transactions.allCategories"),
        options: categoryOptions,
      },
      {
        key: "paymentMethod",
        type: "select",
        label: t("transactions.paymentMethod"),
        placeholder: t("transactions.allMethods"),
        options: getOptions(PAYMENT_METHOD_KEY, t),
      },
    ],
    [t, categoryOptions],
  );

  return {
    // State
    detailTx,
    deleteTx,
    bulkDeleteTx,
    selectedIds,
    lastRefreshedAt,
    filters,
    filterOpen,
    pagination,

    // Computed values
    locale,
    currency,
    categoryMap,
    categoryOptions,
    sorted,
    totals,
    loadingDone,
    hasFilters,
    allSelected: isAllSelected(sorted.map((tx) => tx.id)),
    isSomeSelected,
    filterFields,

    // Actions
    setDetailTx,
    setDeleteTx,
    setBulkDeleteTx,
    setSelectedIds,
    setFilterOpen,
    setPagination: setPage,
    handleFilterChange: handleFilterChangeWithReset,
    handleClearFilters: handleClearFiltersWithReset,
    handleRefresh,
    handleSelect,
    handleSelectAll,
    handleBulkDelete,
    formatFilterValue,
    handleRemoveChip,

    // API methods
    loading,
    refresh,
    update,
    remove,
  };
}
