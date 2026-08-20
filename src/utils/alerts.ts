import {
  Receipt as ReceiptData,
  Repeat2 as Repeat2Data,
  Target as TargetData,
  Wallet as WalletData,
} from "lucide";
import type { LucideIcon } from "lucide-react";
import { Receipt, Repeat2, Target, Wallet } from "@/lib/icons";

type LucideDataIcon = Parameters<
  typeof import("morphicons/react").MorphIcon
>[0]["icon"];

export interface AlertAction {
  labelKey: string;
  url: string;
  /** Icon shown inside the action button; fallback to ArrowRight when absent. */
  icon?: LucideIcon;
  /** Lucide data icon for LoadingIcon morph in banners. */
  iconData?: LucideDataIcon;
}

const ALERT_ACTIONS: Record<string, AlertAction | null> = {
  overspending: {
    labelKey: "alerts.actions.viewTransactions",
    url: "/dashboard/transactions",
    icon: Receipt,
    iconData: ReceiptData,
  },
  "low-savings": {
    labelKey: "alerts.actions.viewTransactions",
    url: "/dashboard/transactions",
    icon: Receipt,
    iconData: ReceiptData,
  },
  "budget-exceeded": {
    labelKey: "alerts.actions.reviewBudgets",
    url: "/dashboard/budgets",
    icon: Wallet,
    iconData: WalletData,
  },
  "budget-near": {
    labelKey: "alerts.actions.reviewBudgets",
    url: "/dashboard/budgets",
    icon: Wallet,
    iconData: WalletData,
  },
  "no-budgets": {
    labelKey: "alerts.actions.setBudgets",
    url: "/dashboard/budgets",
    icon: Wallet,
    iconData: WalletData,
  },
  "upcoming-payment": {
    labelKey: "alerts.actions.viewSubscriptions",
    url: "/dashboard/subscriptions",
    icon: Repeat2,
    iconData: Repeat2Data,
  },
  "goal-deadline": {
    labelKey: "alerts.actions.viewGoals",
    url: "/dashboard/goals",
    icon: Target,
    iconData: TargetData,
  },
  "goal-achieved": {
    labelKey: "alerts.actions.viewGoals",
    url: "/dashboard/goals",
    icon: Target,
    iconData: TargetData,
  },
};

export function getAlertAction(type: string): AlertAction | null {
  return ALERT_ACTIONS[type] ?? null;
}
