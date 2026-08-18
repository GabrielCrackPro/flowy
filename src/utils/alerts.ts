import type { LucideIcon } from "lucide-react";
import { Receipt, Repeat2, Target, Wallet } from "@/lib/icons";

export interface AlertAction {
  labelKey: string;
  url: string;
  /** Icon shown inside the action button; fallback to ArrowRight when absent. */
  icon?: LucideIcon;
}

const ALERT_ACTIONS: Record<string, AlertAction | null> = {
  overspending: {
    labelKey: "alerts.actions.viewTransactions",
    url: "/dashboard/transactions",
    icon: Receipt,
  },
  "low-savings": {
    labelKey: "alerts.actions.viewTransactions",
    url: "/dashboard/transactions",
    icon: Receipt,
  },
  "budget-exceeded": {
    labelKey: "alerts.actions.reviewBudgets",
    url: "/dashboard/budgets",
    icon: Wallet,
  },
  "budget-near": {
    labelKey: "alerts.actions.reviewBudgets",
    url: "/dashboard/budgets",
    icon: Wallet,
  },
  "no-budgets": {
    labelKey: "alerts.actions.setBudgets",
    url: "/dashboard/budgets",
    icon: Wallet,
  },
  "upcoming-payment": {
    labelKey: "alerts.actions.viewSubscriptions",
    url: "/dashboard/subscriptions",
    icon: Repeat2,
  },
  "goal-deadline": {
    labelKey: "alerts.actions.viewGoals",
    url: "/dashboard/goals",
    icon: Target,
  },
  "goal-achieved": {
    labelKey: "alerts.actions.viewGoals",
    url: "/dashboard/goals",
    icon: Target,
  },
};

export function getAlertAction(type: string): AlertAction | null {
  return ALERT_ACTIONS[type] ?? null;
}
