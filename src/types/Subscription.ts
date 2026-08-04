import type { ProfileIdentity } from "./ProfileIdentity";

export type BillingCycle =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface Subscription {
  id: string;
  userId: string;
  merchant: string | null;
  amount: number | null;
  billingCycle: BillingCycle | null;
  nextPayment: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  user?: ProfileIdentity | null;
  updatedByProfile?: ProfileIdentity | null;
}

export interface CreateSubscriptionInput {
  merchant?: string | null;
  amount?: number | null;
  billingCycle?: BillingCycle | null;
  nextPayment?: Date | null;
  active?: boolean;
}

export interface UpdateSubscriptionInput
  extends Partial<CreateSubscriptionInput> {}

export interface SubscriptionFilters {
  active?: boolean;
  billingCycle?: BillingCycle;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SubscriptionList {
  data: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
