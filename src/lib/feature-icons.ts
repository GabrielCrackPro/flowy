import type { IconProps } from "@/components/shared";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpDown,
  Repeat2,
  Tag,
  Target,
  Wallet,
} from "@/lib/icons";

/**
 * Feature-specific icons
 * These icons should be used consistently across the application
 * for their respective features to maintain visual consistency.
 */

export const FEATURE_ICONS = {
  // Main navigation icons
  transactions: ArrowUpDown,
  categories: Tag,
  budgets: Wallet,
  goals: Target,
  subscriptions: Repeat2,

  // Transaction type icons
  income: ArrowUpCircle,
  expense: ArrowDownCircle,
} as const;

export type FeatureIcon = keyof typeof FEATURE_ICONS;

/**
 * Get the icon for a specific feature
 */
export function getFeatureIcon(feature: FeatureIcon): IconProps["icon"] {
  return FEATURE_ICONS[feature];
}

// Export individual icons for easier imports
export const IconTransactions = ArrowUpDown;
export const IconCategories = Tag;
export const IconBudgets = Wallet;
export const IconGoals = Target;
export const IconSubscriptions = Repeat2;
export const IconIncome = ArrowUpCircle;
export const IconExpense = ArrowDownCircle;
