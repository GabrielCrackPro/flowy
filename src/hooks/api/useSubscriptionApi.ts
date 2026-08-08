"use client";

import { useEntityApi } from "@/hooks/useEntityApi";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  updateSubscription,
} from "@/lib/api/subscription";
import type {
  CreateSubscriptionInput,
  Subscription,
  SubscriptionFilters,
  UpdateSubscriptionInput,
} from "@/types/Subscription";

export function useSubscriptionApi(filters?: SubscriptionFilters) {
  const { data, ...rest } = useEntityApi<
    Subscription,
    SubscriptionFilters,
    CreateSubscriptionInput,
    UpdateSubscriptionInput
  >({
    queryKey: "subscriptions",
    listApi: getSubscriptions,
    createApi: createSubscription,
    updateApi: updateSubscription,
    deleteApi: deleteSubscription,
    entityName: "common.subscription",
    filters,
  });

  // Handle both array and paginated response formats
  const subscriptions = Array.isArray(data) ? data : (data?.data ?? []);

  return { subscriptions, ...rest };
}
