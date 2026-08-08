export interface AlertAction {
  labelKey: string;
  url: string;
}

// Alerts that would only navigate to the dashboard ("Abrir panel") get no
// dedicated action button; the banner itself already directs users there.
const ALERT_ACTIONS: Record<string, AlertAction | null> = {
  overspending: null,
  "low-savings": null,
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

export function getAlertAction(type: string): AlertAction | null {
  return ALERT_ACTIONS[type] ?? null;
}
