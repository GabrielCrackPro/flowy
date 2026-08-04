import type { ProfileIdentity } from "./ProfileIdentity";

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  user?: ProfileIdentity | null;
  updatedByProfile?: ProfileIdentity | null;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
  type: "INCOME" | "EXPENSE";
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  type?: "INCOME" | "EXPENSE";
}
