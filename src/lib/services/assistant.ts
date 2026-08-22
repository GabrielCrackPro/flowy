import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { DashboardService } from "@/lib/services/dashboard";
import { computeInsights } from "@/lib/services/insights";
import { SearchService } from "@/lib/services/search";
import { SpaceService } from "@/lib/services/spaces/space-service";
import { StatsService } from "@/lib/services/stats";
import type { DashboardData } from "@/types/Dashboard";

/**
 * Maximum number of rows returned in any tool call — prevents blowing
 * the context window with raw data.
 */
const MAX_ROWS = 10;

/**
 * Build a context string from the user's financial data.
 * Only aggregates and capped rows — never raw notes, comments, or receipts.
 */
export async function buildContext(
  userId: string,
  locale: string,
  currency: string,
): Promise<{
  data: DashboardData;
  userContext: string;
}> {
  const space = await SpaceService.getCurrent(userId);
  const now = new Date();
  const dashboard = await DashboardService.getDashboard(
    userId,
    now.getMonth() + 1,
    now.getFullYear(),
  );

  const spaceLabel = space
    ? space.isPersonal
      ? "personal space"
      : `shared space "${space.name}"`
    : "personal space";

  const userContext = [
    `Active space: ${spaceLabel}`,
    `User locale: ${locale}`,
    `Currency: ${currency}`,
    `Date context: ${now.toISOString()} (current month: ${now.getMonth() + 1}/${now.getFullYear()})`,
  ].join("\n");

  return { data: dashboard, userContext };
}

/**
 * Format a currency value for display in tool results.
 */
function formatCurrency(value: number, locale: string, currency: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/**
 * Format a percentage for display.
 */
function formatPct(value: number, locale: string) {
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

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export function createAssistantTools(
  userId: string,
  locale: string,
  currency: string,
) {
  return {
    getFinancialSummary: tool({
      description:
        "Get the user's financial summary for the current month: income, expenses, savings rate, balance, and category breakdown.",
      inputSchema: z.object({}),
      execute: async () => {
        const stats = await StatsService.getDashboardStats(userId);

        const categoryBreakdown = stats.expensesByCategory
          .slice(0, 5)
          .map(
            (c) => `- ${c.name}: ${formatCurrency(c.amount, locale, currency)}`,
          )
          .join("\n");

        return {
          incomeThisMonth: formatCurrency(
            stats.incomeThisMonth,
            locale,
            currency,
          ),
          expensesThisMonth: formatCurrency(
            stats.expensesThisMonth,
            locale,
            currency,
          ),
          balance: formatCurrency(stats.balance, locale, currency),
          savingsRate: formatPct(stats.savingsRate, locale),
          activeSubscriptions: stats.activeSubscriptions,
          activeBudgets: stats.activeBudgets,
          previousMonth: {
            income: formatCurrency(stats.prevIncome, locale, currency),
            expenses: formatCurrency(stats.prevExpenses, locale, currency),
            savingsRate: formatPct(stats.prevSavingsRate, locale),
          },
          topExpenseCategories: categoryBreakdown || "No expense data yet",
        };
      },
    }),

    searchTransactions: tool({
      description:
        "Search the user's transactions by text. Returns up to 10 items.",
      inputSchema: z.object({
        query: z.string().describe("Search term for matching transactions"),
      }),
      execute: async ({ query }) => {
        const results = await SearchService.search(userId, query);
        const transactions = results.results
          .filter((r) => r.type === "transaction")
          .slice(0, MAX_ROWS);

        if (transactions.length === 0) {
          return { count: 0, message: "No matching transactions found." };
        }

        return {
          count: transactions.length,
          results: transactions.map((t) => ({
            description: t.title,
            category: t.subtitle || "Uncategorized",
            amount: t.amount
              ? formatCurrency(Math.abs(t.amount), locale, currency)
              : undefined,
            type: t.amount && t.amount >= 0 ? "income" : "expense",
          })),
        };
      },
    }),

    listBudgets: tool({
      description:
        "List the user's current monthly budgets with their spending progress. Returns up to 10 items.",
      inputSchema: z.object({}),
      execute: async () => {
        const data = await DashboardService.getDashboard(userId);
        const budgets = data.budgets.slice(0, MAX_ROWS);

        if (budgets.length === 0) {
          return { count: 0, message: "No budgets set for this month." };
        }

        return {
          count: budgets.length,
          totalBudget: formatCurrency(
            budgets.reduce((sum, b) => sum + Number(b.budgetLimit), 0),
            locale,
            currency,
          ),
          budgets: budgets.map((b) => {
            const limit = Number(b.budgetLimit);
            const spent = b.spent;
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            return {
              category: b.category?.name || "Uncategorized",
              limit: formatCurrency(limit, locale, currency),
              spent: formatCurrency(spent, locale, currency),
              remaining: formatCurrency(limit - spent, locale, currency),
              usagePercent: pct,
              status:
                pct > 100 ? "over" : pct >= 80 ? "near limit" : "on track",
            };
          }),
        };
      },
    }),

    listGoals: tool({
      description:
        "List the user's active savings goals with progress toward the target. Returns up to 10 items.",
      inputSchema: z.object({}),
      execute: async () => {
        const data = await DashboardService.getDashboard(userId);
        const goals = data.goals.slice(0, MAX_ROWS);

        if (goals.length === 0) {
          return { count: 0, message: "No active savings goals." };
        }

        return {
          count: goals.length,
          goals: goals.map((g) => {
            const target = Number(g.targetAmount);
            const saved = Number(g.savedAmount);
            const pct = target > 0 ? Math.round((saved / target) * 100) : 0;
            return {
              title: g.title,
              target: formatCurrency(target, locale, currency),
              saved: formatCurrency(saved, locale, currency),
              remaining: formatCurrency(target - saved, locale, currency),
              progress: `${pct}%`,
              status: pct >= 100 ? "achieved" : "in progress",
            };
          }),
        };
      },
    }),

    listSubscriptions: tool({
      description:
        "List the user's active subscriptions with monthly cost estimates. Returns up to 10 items.",
      inputSchema: z.object({}),
      execute: async () => {
        const data = await DashboardService.getDashboard(userId);
        const subs = data.subscriptions
          .filter((s) => s.active)
          .slice(0, MAX_ROWS);

        if (subs.length === 0) {
          return { count: 0, message: "No active subscriptions." };
        }

        let estimatedMonthly = 0;
        const normalized = subs.map((s) => {
          const amount = Number(s.amount) || 0;
          let monthly = amount;
          switch (s.billingCycle) {
            case "DAILY":
              monthly = amount * 30.44;
              break;
            case "WEEKLY":
              monthly = amount * 4.35;
              break;
            case "MONTHLY":
              monthly = amount;
              break;
            case "QUARTERLY":
              monthly = amount / 3;
              break;
            case "YEARLY":
              monthly = amount / 12;
              break;
          }
          estimatedMonthly += monthly;
          return {
            merchant: s.merchant || "Unknown",
            billingCycle: s.billingCycle || "Unknown",
            amountPerCycle: formatCurrency(amount, locale, currency),
            estimatedMonthly: formatCurrency(monthly, locale, currency),
          };
        });

        return {
          count: subs.length,
          estimatedMonthlyTotal: formatCurrency(
            estimatedMonthly,
            locale,
            currency,
          ),
          subscriptions: normalized,
        };
      },
    }),

    getInsights: tool({
      description:
        "Get rule-based financial insights: savings rate, expense trends, budget status, top spending categories, and subscription review.",
      inputSchema: z.object({}),
      execute: async () => {
        const data = await DashboardService.getDashboard(userId);

        const t = (key: string, opts?: Record<string, unknown>) => key; // Fallback: raw keys
        const insights = computeInsights(data, {
          locale,
          currency,
          t,
        });

        if (insights.length === 0) {
          return { count: 0, message: "Not enough data for insights yet." };
        }

        return {
          count: insights.length,
          insights: insights.map((i) => ({
            type: i.type,
            severity: i.severity,
            title: i.title,
            description: i.description,
          })),
        };
      },
    }),
  };
}

/**
 * Check and enforce the daily per-user message cap.
 * Returns the remaining count for today (or -1 if not configured).
 */
export async function checkDailyLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const limit = Math.max(Number(process.env.AI_DAILY_MESSAGE_LIMIT) || 20, 1);

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  const prefs = (profile?.preferences as Record<string, unknown>) || {};
  const usage = (prefs.assistantUsage as
    | { date: string; count: number }
    | undefined) ?? { date: "", count: 0 };

  const today = new Date().toISOString().slice(0, 10);

  if (usage.date !== today) {
    // New day — reset count but only persist the first use to avoid writes
    // on every read check.
    return { allowed: true, remaining: limit - 1, limit };
  }

  return {
    allowed: usage.count < limit,
    remaining: Math.max(0, limit - usage.count),
    limit,
  };
}

/**
 * Increment the daily message counter for a user.
 * Call AFTER a successful message exchange.
 */
export async function recordDailyUsage(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  const prefs = (profile?.preferences || {}) as Record<string, unknown>;
  const usage = (prefs.assistantUsage as
    | { date: string; count: number }
    | undefined) ?? { date: "", count: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const newCount = usage.date === today ? usage.count + 1 : 1;

  await prisma.profile.update({
    where: { id: userId },
    data: {
      preferences: {
        ...prefs,
        assistantUsage: { date: today, count: newCount },
      },
    },
  });
}
