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

// Realtime uses the same dependency graph as local and offline mutations. Keep
// non-entity views here too so a remote write refreshes every affected screen.
export const REALTIME_QUERY_KEYS: Record<string, string[]> = {
  transactions: [
    "transactions",
    SINGULAR_QUERY_KEYS.transactions,
    ...DEPENDENT_QUERY_KEYS.transactions,
  ],
  budgets: ["budgets", ...DEPENDENT_QUERY_KEYS.budgets],
  goals: ["goals", ...DEPENDENT_QUERY_KEYS.goals],
  subscriptions: ["subscriptions", ...DEPENDENT_QUERY_KEYS.subscriptions],
  categories: ["categories", ...DEPENDENT_QUERY_KEYS.categories],
  comments: ["comments"],
  activities: ["activities"],
  profiles: ["profile", "push-preferences", "status-preferences"],
  push_subscriptions: ["push-subscriptions"],
  push_deliveries: ["push-delivery-history", "push-subscriptions"],
  space_members: ["spaces", "profile"],
};
