import type { Category } from "@/types/Category";
import { createApi } from "./factory";

export const categoryApi = createApi<Category>("/api/category");

export const getCategories = categoryApi.list;
export const getCategory = categoryApi.get;
export const createCategory = categoryApi.create;
export const updateCategory = categoryApi.update;
export const deleteCategory = categoryApi.delete;
