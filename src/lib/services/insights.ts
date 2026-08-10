/**
 * Pure rule-based spending insights computed from existing dashboard data.
 * No AI, no DB calls — deterministic, testable, runs entirely on the client.
 *
 * Each insight is a human-readable observation backed by a rule:
 * - Savings rate nudge when below 20%
 * - Expense trend vs previous month
 * - Budget status (overspent / near limit)
 * - Subscription monthly total
 * - Top expense category analysis
 * - Income trend vs previous month
 */

import type { DashboardData } from "@/types/Dashboard";

export type InsightSeverity = "positive" | "neutral" | "warning" | "critical";

export interface Insight {
  type:
    | "savings_rate"
    | "expense_trend"
    | "budget_status"
    | "subscription_total"
    | "top_category"
    | "income_trend";
  severity: InsightSeverity;
  title: string;
  description: string;
}

interface InsightsConfig {
  locale: string;
  currency: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Compute insights from DashboardData.
 * Returns an ordered array of Insights (most important first).
 * Returns empty array when there's no data to analyze.
 */
export function computeInsights(
  data: DashboardData,
  config: InsightsConfig,
): Insight[] {
  const { stats, budgets, subscriptions } = data;
  const { t, locale, currency } = config;
  const insights: Insight[] = [];

  if (!stats) return insights;

  const {
    incomeThisMonth,
    expensesThisMonth,
    savingsRate,
    prevIncome,
    prevExpenses,
    activeSubscriptions,
    expensesByCategory,
  } = stats;

  const hasIncome = incomeThisMonth > 0;
  const hasExpenses = expensesThisMonth > 0;

  // 1. Savings rate insight
  if (hasIncome) {
    if (savingsRate < 0) {
      insights.push({
        type: "savings_rate",
        severity: "critical",
        title: t("insights.spendingMoreThanEarning"),
        description: t("insights.spendingMoreThanEarningDesc", {
          amount: formatCurrencyValue(
            expensesThisMonth - incomeThisMonth,
            locale,
            currency,
          ),
        }),
      });
    } else if (savingsRate < 20) {
      insights.push({
        type: "savings_rate",
        severity: "warning",
        title: t("insights.lowSavingsRate"),
        description: t("insights.lowSavingsRateDesc", {
          rate: formatPercentageValue(savingsRate, locale),
          target: "20%",
        }),
      });
    } else {
      insights.push({
        type: "savings_rate",
        severity: "positive",
        title: t("insights.goodSavingsRate"),
        description: t("insights.goodSavingsRateDesc", {
          rate: formatPercentageValue(savingsRate, locale),
        }),
      });
    }
  }

  // 2. Budget overspend / near-limit
  for (const budget of budgets) {
    const spent = Number(budget.spent);
    const limit = Number(budget.budgetLimit);
    if (limit <= 0) continue;

    const pct = (spent / limit) * 100;
    const categoryName = budget.category?.name ?? t("insights.unknownCategory");

    if (pct > 100) {
      insights.push({
        type: "budget_status",
        severity: "critical",
        title: t("insights.budgetExceeded", { category: categoryName }),
        description: t("insights.budgetExceededDesc", {
          pct: formatPercentageValue(pct, locale),
          overspent: formatCurrencyValue(spent - limit, locale, currency),
        }),
      });
    } else if (pct >= 80) {
      insights.push({
        type: "budget_status",
        severity: "warning",
        title: t("insights.budgetNearLimit", { category: categoryName }),
        description: t("insights.budgetNearLimitDesc", {
          pct: formatPercentageValue(pct, locale),
          remaining: formatCurrencyValue(limit - spent, locale, currency),
        }),
      });
    }
  }

  // 3. Expense trend vs previous month
  if (prevExpenses > 0 && hasExpenses) {
    const change = ((expensesThisMonth - prevExpenses) / prevExpenses) * 100;
    if (Math.abs(change) >= 5) {
      const isUp = change > 0;
      insights.push({
        type: "expense_trend",
        severity: isUp ? "warning" : "positive",
        title: isUp ? t("insights.expensesUp") : t("insights.expensesDown"),
        description: isUp
          ? t("insights.expensesUpDesc", {
              pct: formatPercentageValue(change, locale),
              amount: formatCurrencyValue(
                expensesThisMonth - prevExpenses,
                locale,
                currency,
              ),
            })
          : t("insights.expensesDownDesc", {
              pct: formatPercentageValue(Math.abs(change), locale),
              amount: formatCurrencyValue(
                prevExpenses - expensesThisMonth,
                locale,
                currency,
              ),
            }),
      });
    }
  }

  // 4. Income trend vs previous month
  if (prevIncome > 0 && hasIncome) {
    const change = ((incomeThisMonth - prevIncome) / prevIncome) * 100;
    if (Math.abs(change) >= 5) {
      const isUp = change > 0;
      insights.push({
        type: "income_trend",
        severity: isUp ? "positive" : "warning",
        title: isUp ? t("insights.incomeUp") : t("insights.incomeDown"),
        description: isUp
          ? t("insights.incomeUpDesc", {
              pct: formatPercentageValue(change, locale),
              amount: formatCurrencyValue(
                incomeThisMonth - prevIncome,
                locale,
                currency,
              ),
            })
          : t("insights.incomeDownDesc", {
              pct: formatPercentageValue(Math.abs(change), locale),
              amount: formatCurrencyValue(
                prevIncome - incomeThisMonth,
                locale,
                currency,
              ),
            }),
      });
    }
  }

  // 5. Top expense category
  if (expensesByCategory.length > 0 && hasExpenses) {
    const top = expensesByCategory[0];
    if (top && top.name !== "__other__") {
      const topPct = (top.amount / expensesThisMonth) * 100;
      insights.push({
        type: "top_category",
        severity: topPct > 50 ? "warning" : "neutral",
        title: t("insights.topCategory"),
        description: t("insights.topCategoryDesc", {
          category: top.name,
          pct: formatPercentageValue(topPct, locale),
          amount: formatCurrencyValue(top.amount, locale, currency),
        }),
      });
    }
  }

  // 6. Subscription monthly total
  if (activeSubscriptions > 0 && subscriptions.length > 0) {
    const monthlyTotal = computeMonthlySubscriptions(subscriptions);
    if (monthlyTotal > 0) {
      const subsPct =
        incomeThisMonth > 0 ? (monthlyTotal / incomeThisMonth) * 100 : 0;
      insights.push({
        type: "subscription_total",
        severity: subsPct > 30 ? "warning" : "neutral",
        title: t("insights.subscriptionTotal"),
        description: t("insights.subscriptionTotalDesc", {
          total: formatCurrencyValue(monthlyTotal, locale, currency),
          count: activeSubscriptions,
          pct: subsPct > 0 ? formatPercentageValue(subsPct, locale) : "",
        }),
      });
    }
  }

  // Sort: critical first, then warning, then positive/neutral
  return insights.sort(bySeverity);
}

// --- Helpers ---

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  neutral: 2,
  positive: 3,
};

function bySeverity(a: Insight, b: Insight): number {
  return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
}

function formatCurrencyValue(
  value: number,
  locale: string,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  } catch {
    return `${Math.abs(value).toFixed(0)} ${currency}`;
  }
}

function formatPercentageValue(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(value / 100);
  } catch {
    return `${Math.round(value)}%`;
  }
}

/**
 * Convert all subscriptions to a monthly equivalent and return the total.
 * Normalizes daily/weekly/quarterly/yearly to monthly.
 */
function computeMonthlySubscriptions(
  subscriptions: { amount: number | null; billingCycle: string | null }[],
): number {
  let total = 0;
  for (const sub of subscriptions) {
    const amount = Number(sub.amount);
    if (amount <= 0) continue;
    switch (sub.billingCycle) {
      case "DAILY":
        total += amount * 30.44;
        break;
      case "WEEKLY":
        total += amount * 4.35;
        break;
      case "MONTHLY":
        total += amount;
        break;
      case "QUARTERLY":
        total += amount / 3;
        break;
      case "YEARLY":
        total += amount / 12;
        break;
      default:
        total += amount;
    }
  }
  return total;
}
