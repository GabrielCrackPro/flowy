import type { Budget, BudgetFilters } from "@/types/Budget";
import { createApi } from "./factory";

export const budgetApi = createApi<Budget, BudgetFilters>("/api/budget");

export const getBudgets = budgetApi.list;
export const getBudget = budgetApi.get;
export const createBudget = budgetApi.create;
export const updateBudget = budgetApi.update;
export const deleteBudget = budgetApi.delete;
