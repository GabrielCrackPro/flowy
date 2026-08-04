export interface AlertAction {
  labelKey: string;
  url: string;
}

const ALERT_ACTIONS: Record<string, AlertAction> = {
  overspending: {
    labelKey: "alerts.actions.viewDashboard",
    url: "/dashboard",
  },
  "low-savings": {
    labelKey: "alerts.actions.viewDashboard",
    url: "/dashboard",
  },
  "budget-exceeded": {
    labelKey: "alerts.actions.reviewBudgets",
    url: "/dashboard/budgets",
  },
  "budget-near": {
    labelKey: "alerts.actions.reviewBudgets",
    url: "/dashboard/budgets",
  },
  "no-budgets": {
    labelKey: "alerts.actions.reviewBudgets",
    url: "/dashboard/budgets",
  },
  "upcoming-payment": {
    labelKey: "alerts.actions.viewSubscriptions",
    url: "/dashboard/subscriptions",
  },
  "goal-deadline": {
    labelKey: "alerts.actions.viewGoals",
    url: "/dashboard/goals",
  },
  "goal-achieved": {
    labelKey: "alerts.actions.viewGoals",
    url: "/dashboard/goals",
  },
};

const DEFAULT_ACTION: AlertAction = {
  labelKey: "alerts.actions.viewDashboard",
  url: "/dashboard",
};

export function getAlertAction(
  type: string,
  dataUrl?: string | null,
): AlertAction {
  const known = ALERT_ACTIONS[type];
  if (known) return known;
  return {
    labelKey: DEFAULT_ACTION.labelKey,
    url: dataUrl ?? DEFAULT_ACTION.url,
  };
}
