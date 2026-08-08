import { prisma } from "@/lib/prisma/client";
import type {
  DailyStatsPoint,
  DashboardStats,
  ExpenseCategoryStat,
} from "@/types/Dashboard";
import { OTHER_CATEGORY_KEY } from "@/types/Dashboard";
import { SpaceService } from "./spaces/space-service";

const TOP_CATEGORIES = 5;

function sumAmounts(items: { amount: { toString(): string } }[]): number {
  return items.reduce((total, item) => total + Number(item.amount), 0);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export const StatsService = {
  async getDashboardStats(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<DashboardStats> {
    const now = new Date();
    const activeSpace = await SpaceService.getCurrent(userId);
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const startOfNextMonth = new Date(targetYear, targetMonth, 1);
    const startOfPrevMonth = new Date(targetYear, targetMonth - 2, 1);

    const [
      monthTransactions,
      activeSubscriptions,
      activeBudgets,
      prevMonthTransactions,
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
        select: {
          type: true,
          amount: true,
          date: true,
          tags: {
            select: {
              category: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.subscription.count({
        where: {
          spaceId: activeSpace?.id ?? null,
          active: true,
        },
      }),
      prisma.budget.count({
        where: {
          spaceId: activeSpace?.id ?? null,
          month: targetMonth,
          year: targetYear,
        },
      }),
      prisma.transaction.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          date: {
            gte: startOfPrevMonth,
            lt: startOfMonth,
          },
        },
        select: {
          type: true,
          amount: true,
        },
      }),
    ]);

    const incomeThisMonth = sumAmounts(
      monthTransactions.filter((item) => item.type === "INCOME"),
    );
    const expensesThisMonth = sumAmounts(
      monthTransactions.filter((item) => item.type === "EXPENSE"),
    );

    const balance = incomeThisMonth - expensesThisMonth;
    const savingsRate =
      incomeThisMonth > 0
        ? ((incomeThisMonth - expensesThisMonth) / incomeThisMonth) * 100
        : expensesThisMonth > 0
          ? -100
          : 0;

    const prevIncome = sumAmounts(
      prevMonthTransactions.filter((item) => item.type === "INCOME"),
    );
    const prevExpenses = sumAmounts(
      prevMonthTransactions.filter((item) => item.type === "EXPENSE"),
    );
    const prevSavingsRate =
      prevIncome > 0
        ? ((prevIncome - prevExpenses) / prevIncome) * 100
        : prevExpenses > 0
          ? -100
          : 0;

    const dailySeries: DailyStatsPoint[] = Array.from(
      { length: daysInMonth(targetYear, targetMonth) },
      (_, index) => ({
        day: index + 1,
        income: 0,
        expenses: 0,
        balance: 0,
      }),
    );

    for (const tx of monthTransactions) {
      const date = tx.date;
      if (!date) continue;
      const day = date.getUTCDate();
      const point = dailySeries[day - 1];
      if (!point) continue;
      const amount = Number(tx.amount);
      if (tx.type === "INCOME") point.income += amount;
      else point.expenses += amount;
    }

    for (const point of dailySeries) {
      point.balance = point.income - point.expenses;
    }

    const expensesByCategory: ExpenseCategoryStat[] =
      buildExpensesByCategory(monthTransactions);

    return {
      balance,
      incomeThisMonth,
      expensesThisMonth,
      savingsRate,
      prevIncome,
      prevExpenses,
      prevSavingsRate,
      activeSubscriptions,
      activeBudgets,
      dailySeries,
      expensesByCategory,
    };
  },
};

function buildExpensesByCategory(
  transactions: {
    type: string;
    amount: { toString(): string };
    tags: { category: { id: string; name: string } | null }[];
  }[],
): ExpenseCategoryStat[] {
  const totals = new Map<string, number>();
  const names = new Map<string, string>();
  let uncategorized = 0;

  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    const amount = Number(tx.amount);
    const tags = tx.tags.filter(
      (link): link is { category: { id: string; name: string } } =>
        link.category !== null,
    );

    if (tags.length === 0) {
      uncategorized += amount;
      continue;
    }

    for (const link of tags) {
      const category = link.category;
      totals.set(category.id, (totals.get(category.id) ?? 0) + amount);
      names.set(category.id, category.name);
    }
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, TOP_CATEGORIES).map(([id, amount]) => ({
    name: names.get(id) ?? OTHER_CATEGORY_KEY,
    amount,
  }));
  const other =
    uncategorized +
    ranked.slice(TOP_CATEGORIES).reduce((sum, [, amount]) => sum + amount, 0);

  return other > 0
    ? [...top, { name: OTHER_CATEGORY_KEY, amount: other }]
    : top;
}
