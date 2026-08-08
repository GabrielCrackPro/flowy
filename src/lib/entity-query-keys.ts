// Detail queries that live under a singular key (e.g. ["transaction", ...])
// while the list uses the plural prefix.
export const SINGULAR_QUERY_KEYS: Record<string, string> = {
  transactions: "transaction",
};

// Other views that aggregate each entity's data and must refresh when the
// entity changes. Shared by the mutation layer (useEntityApi) and the offline
// sync engine so both invalidate the exact same set of views.
export const DEPENDENT_QUERY_KEYS: Record<string, string[]> = {
  transactions: ["dashboard", "activities", "notifications", "budgets"],
  budgets: ["dashboard", "notifications"],
  goals: ["dashboard", "notifications"],
  subscriptions: ["dashboard", "notifications"],
  categories: ["transactions", "budgets", "dashboard"],
};
