export const DASHBOARD_CARD_IDS = [
  "stats",
  "cashFlow",
  "expenseDistribution",
  "distribution",
  "recentTransactions",
  "budgetProgress",
  "goalProgress",
  "subscriptions",
  "activity",
] as const;

export type DashboardCardId = (typeof DASHBOARD_CARD_IDS)[number];

export const ALL_DASHBOARD_CARDS: readonly DashboardCardId[] =
  DASHBOARD_CARD_IDS;

export type DashboardCardGroupId =
  | "summary"
  | "charts"
  | "spending"
  | "budgetsGoals"
  | "subscriptions";

export const DASHBOARD_CARD_GROUPS: ReadonlyArray<{
  id: DashboardCardGroupId;
  labelKey: string;
  cards: readonly DashboardCardId[];
}> = [
  {
    id: "summary",
    labelKey: "dashboard.cards.groups.summary",
    cards: ["stats"],
  },
  {
    id: "charts",
    labelKey: "dashboard.cards.groups.charts",
    cards: ["cashFlow", "expenseDistribution"],
  },
  {
    id: "spending",
    labelKey: "dashboard.cards.groups.spending",
    cards: ["distribution", "recentTransactions", "activity"],
  },
  {
    id: "budgetsGoals",
    labelKey: "dashboard.cards.groups.budgetsGoals",
    cards: ["budgetProgress", "goalProgress"],
  },
  {
    id: "subscriptions",
    labelKey: "dashboard.cards.groups.subscriptions",
    cards: ["subscriptions"],
  },
];
