export type EntityKey =
  | "transactions"
  | "budgets"
  | "goals"
  | "subscriptions"
  | "categories";

export interface EntityDefinition {
  key: EntityKey;
  singular?: string;
  dependencies: readonly string[];
  realtimeTables: readonly string[];
  offline: boolean;
}

export const ENTITY_REGISTRY: Record<EntityKey, EntityDefinition> = {
  transactions: {
    key: "transactions",
    singular: "transaction",
    dependencies: ["dashboard", "activities", "notifications", "budgets"],
    realtimeTables: ["transactions"],
    offline: true,
  },
  budgets: {
    key: "budgets",
    dependencies: ["dashboard", "notifications"],
    realtimeTables: ["budgets"],
    offline: true,
  },
  goals: {
    key: "goals",
    dependencies: ["dashboard", "notifications"],
    realtimeTables: ["goals"],
    offline: true,
  },
  subscriptions: {
    key: "subscriptions",
    dependencies: ["dashboard", "notifications"],
    realtimeTables: ["subscriptions"],
    offline: true,
  },
  categories: {
    key: "categories",
    dependencies: ["transactions", "budgets", "dashboard"],
    realtimeTables: ["categories"],
    offline: true,
  },
};

export function getEntityDefinition(key: string): EntityDefinition | undefined {
  return ENTITY_REGISTRY[key as EntityKey];
}

export function getEntityDependencies(key: string): readonly string[] {
  return getEntityDefinition(key)?.dependencies ?? [];
}
