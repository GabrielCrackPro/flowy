export const DASHBOARD_CARD_IDS = [
  "stats",
  "insights",
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

/**
 * The regions a card can live in on the dashboard page. They mirror the page's
 * actual layout (summary rows, the charts row, the main column and the side
 * rail) so reordering in the Customize sheet maps 1:1 to where cards render.
 */
export type DashboardRegionId = "summary" | "charts" | "main" | "aside";

export const DASHBOARD_REGIONS: ReadonlyArray<{
  id: DashboardRegionId;
  labelKey: string;
  cards: readonly DashboardCardId[];
}> = [
  {
    id: "summary",
    labelKey: "dashboard.cards.groups.summary",
    cards: ["stats", "insights"],
  },
  {
    id: "charts",
    labelKey: "dashboard.cards.groups.charts",
    cards: ["cashFlow", "expenseDistribution"],
  },
  {
    id: "main",
    labelKey: "dashboard.cards.groups.main",
    cards: [
      "distribution",
      "recentTransactions",
      "budgetProgress",
      "goalProgress",
    ],
  },
  {
    id: "aside",
    labelKey: "dashboard.cards.groups.aside",
    cards: ["subscriptions", "activity"],
  },
];

/**
 * Validate a stored dashboard order and fall back to the canonical order for
 * anything missing/duplicated/invalid, so a partial value still renders.
 */
export function normalizeDashboardOrder(raw: unknown): DashboardCardId[] {
  const validIds = ALL_DASHBOARD_CARDS as readonly string[];
  if (!Array.isArray(raw)) return [...ALL_DASHBOARD_CARDS];

  const seen = new Set<DashboardCardId>();
  const ordered: DashboardCardId[] = [];
  for (const item of raw) {
    const id = item as DashboardCardId;
    if (validIds.includes(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }

  for (const id of ALL_DASHBOARD_CARDS) {
    if (!seen.has(id)) ordered.push(id);
  }

  return ordered;
}

/** Cards of `region` in the order they appear within the full dashboard order. */
export function orderForRegion(
  order: readonly DashboardCardId[],
  cards: readonly DashboardCardId[],
): DashboardCardId[] {
  const cardSet = cards as readonly string[];
  return order.filter((id) => cardSet.includes(id));
}

/** Reorder one region's cards in place, leaving every other card untouched. */
export function reorderRegion(
  order: readonly DashboardCardId[],
  cards: readonly DashboardCardId[],
  nextRegionOrder: readonly DashboardCardId[],
): DashboardCardId[] {
  const cardSet = new Set<string>(cards);
  const result: DashboardCardId[] = [];
  let regionIndex = 0;

  for (const id of order) {
    if (cardSet.has(id)) {
      result.push(nextRegionOrder[regionIndex] ?? id);
      regionIndex += 1;
    } else {
      result.push(id);
    }
  }

  return result.length === order.length ? result : [...order];
}
