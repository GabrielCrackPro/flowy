import { serializeDateOnly } from "@/lib/date-only";
import type {
  CreateSubscriptionInput,
  Subscription,
  SubscriptionFilters,
  UpdateSubscriptionInput,
} from "@/types/Subscription";
import { createApi } from "./factory";

export const subscriptionApi = createApi<Subscription, SubscriptionFilters>(
  "/api/subscription",
);

export const getSubscriptions = subscriptionApi.list;
export const getSubscription = subscriptionApi.get;
export const createSubscription = (data: CreateSubscriptionInput) =>
  subscriptionApi.create({
    ...data,
    nextPayment: serializeDateOnly(data.nextPayment),
  });
export const updateSubscription = (id: string, data: UpdateSubscriptionInput) =>
  subscriptionApi.update(id, {
    ...data,
    nextPayment: serializeDateOnly(data.nextPayment),
  });
export const deleteSubscription = subscriptionApi.delete;
