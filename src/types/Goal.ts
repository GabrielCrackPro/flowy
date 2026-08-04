import type { ProfileIdentity } from "./ProfileIdentity";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  user?: ProfileIdentity | null;
  updatedByProfile?: ProfileIdentity | null;
}

export interface CreateGoalInput {
  title: string;
  targetAmount: number;
  savedAmount?: number;
  deadline?: Date | null;
}

export interface UpdateGoalInput {
  title?: string;
  targetAmount?: number;
  savedAmount?: number;
  deadline?: Date | null;
  updatedBy?: string;
}

export interface GoalFilters {
  completed?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GoalList {
  data: Goal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
