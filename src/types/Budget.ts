import type { Category } from "./Category";
import type { ProfileIdentity } from "./ProfileIdentity";

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  category?: Category;
  budgetLimit: number;
  month: number | null;
  year: number | null;
  income?: number;
  expenses?: number;
  remaining?: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  user?: ProfileIdentity | null;
  updatedByProfile?: ProfileIdentity | null;
}

export interface CreateBudgetInput {
  categoryIds?: string[];
  budgetLimit: number;
  month?: number | null;
  year?: number | null;
}

export interface UpdateBudgetInput {
  categoryIds?: string[];
  budgetLimit?: number;
  month?: number | null;
  year?: number | null;
}

export interface BudgetFilters {
  categoryId?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BudgetList {
  data: Budget[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
