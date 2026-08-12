import type { DashboardAlertType } from "@/utils/dashboard";

/**
 * The alert types a user can opt in/out of for OS-level push notifications.
 * Mirrors `DashboardAlertType`; an empty stored preference list means all
 * types are enabled (legacy default).
 */
export const PUSH_ALERT_TYPES = [
  "overspending",
  "budget-exceeded",
  "budget-near",
  "upcoming-payment",
  "goal-deadline",
  "goal-achieved",
  "low-savings",
  "no-budgets",
] as const satisfies readonly DashboardAlertType[];

export type PushAlertType = (typeof PUSH_ALERT_TYPES)[number];
