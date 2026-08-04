import { serializeDateOnly } from "@/lib/date-only";
import type {
  CreateGoalInput,
  Goal,
  GoalFilters,
  UpdateGoalInput,
} from "@/types/Goal";
import { createApi } from "./factory";

export const goalApi = createApi<Goal, GoalFilters>("/api/goal");

export const getGoals = goalApi.list;
export const getGoal = goalApi.get;
export const createGoal = (data: CreateGoalInput) =>
  goalApi.create({
    ...data,
    deadline: serializeDateOnly(data.deadline),
  });
export const updateGoal = (id: string, data: UpdateGoalInput) =>
  goalApi.update(id, {
    ...data,
    deadline: serializeDateOnly(data.deadline),
  });
export const deleteGoal = goalApi.delete;
