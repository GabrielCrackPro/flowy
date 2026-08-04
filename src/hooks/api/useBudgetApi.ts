"use client";

import { useEntityApi } from "@/hooks/useEntityApi";
import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "@/lib/api/budget";
import type {
  Budget,
  BudgetFilters,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/Budget";

export function useBudgetApi(filters?: BudgetFilters) {
  const { data, ...rest } = useEntityApi<
    Budget,
    BudgetFilters,
    CreateBudgetInput,
    UpdateBudgetInput
  >({
    queryKey: "budgets",
    listApi: getBudgets,
    createApi: createBudget,
    updateApi: updateBudget,
    deleteApi: deleteBudget,
    entityName: "Presupuesto",
    filters,
  });

  // Handle both array and paginated response formats
  const budgets = Array.isArray(data) ? data : (data?.data ?? []);

  return { budgets, ...rest };
}
