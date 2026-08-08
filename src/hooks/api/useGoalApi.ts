"use client";

import { useEntityApi } from "@/hooks/useEntityApi";
import { createGoal, deleteGoal, getGoals, updateGoal } from "@/lib/api/goal";
import type {
  CreateGoalInput,
  Goal,
  GoalFilters,
  UpdateGoalInput,
} from "@/types/Goal";

export function useGoalApi(filters?: GoalFilters) {
  const { data, ...rest } = useEntityApi<
    Goal,
    GoalFilters,
    CreateGoalInput,
    UpdateGoalInput
  >({
    queryKey: "goals",
    listApi: getGoals,
    createApi: createGoal,
    updateApi: updateGoal,
    deleteApi: deleteGoal,
    entityName: "common.goal",
    filters,
  });

  // Handle both array and paginated response formats
  const goals = Array.isArray(data) ? data : (data?.data ?? []);

  return { goals, ...rest };
}
