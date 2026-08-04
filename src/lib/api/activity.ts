import type { Activity, ActivityFilters } from "@/types/Activity";
import { authenticatedRequest } from "./client";
import { createApi } from "./factory";

export const activityApi = createApi<Activity, ActivityFilters>(
  "/api/activity",
);

export const getActivities = activityApi.list;
export const getActivity = activityApi.get;
export const createActivity = activityApi.create;
export const updateActivity = activityApi.update;
export const deleteActivity = activityApi.delete;
export const clearActivities = () =>
  authenticatedRequest<{ deletedCount: number }>("/api/activity", {
    method: "DELETE",
  });
