"use client";

import { useEntityApi } from "@/hooks/useEntityApi";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api/category";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/Category";

export function useCategoryApi() {
  const { data, ...rest } = useEntityApi<
    Category,
    undefined,
    CreateCategoryInput,
    UpdateCategoryInput
  >({
    queryKey: "categories",
    listApi: getCategories,
    createApi: createCategory,
    updateApi: updateCategory,
    deleteApi: deleteCategory,
    entityName: "Categoría",
  });

  // Handle both array and paginated response formats
  const categories = Array.isArray(data) ? data : (data?.data ?? []);

  return { categories, ...rest };
}
