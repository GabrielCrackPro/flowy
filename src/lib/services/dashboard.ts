import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import type { Activity } from "@/types/Activity";
import type { BudgetWithSpent, DashboardData } from "@/types/Dashboard";
import type { Goal } from "@/types/Goal";
import type { Subscription } from "@/types/Subscription";
import type { Transaction } from "@/types/Transaction";
import { SpaceService } from "./spaces/space-service";
import { StatsService } from "./stats";

const RECENT_TRANSACTIONS_LIMIT = 5;
const GOALS_LIMIT = 50;
const SUBSCRIPTIONS_LIMIT = 50;
const ACTIVITIES_LIMIT = 15;

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const DashboardService = {
  async getDashboard(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<DashboardData> {
    const now = new Date();
    const activeSpace = await SpaceService.getCurrent(userId);
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const startOfNextMonth = new Date(targetYear, targetMonth, 1);

    const monthWhere = {
      spaceId: activeSpace?.id ?? null,
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    };

    const [
      stats,
      recentTransactions,
      expenseTransactions,
      budgets,
      goals,
      subscriptions,
      activities,
    ] = await Promise.all([
      StatsService.getDashboardStats(userId, targetMonth, targetYear),
      prisma.transaction.findMany({
        where: monthWhere,
        include: {
          tags: {
            include: {
              category: true,
            },
          },
          user: {
            select: profileIdentity,
          },
          updatedByProfile: {
            select: profileIdentity,
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: RECENT_TRANSACTIONS_LIMIT,
      }),
      prisma.transaction.findMany({
        where: {
          ...monthWhere,
          type: "EXPENSE",
        },
        select: {
          id: true,
          amount: true,
          tags: {
            select: {
              categoryId: true,
            },
          },
        },
      }),
      prisma.budget.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          month: targetMonth,
          year: targetYear,
        },
        include: {
          category: true,
          user: {
            select: profileIdentity,
          },
          updatedByProfile: {
            select: profileIdentity,
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      }),
      prisma.goal.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
        },
        include: {
          user: {
            select: profileIdentity,
          },
          updatedByProfile: {
            select: profileIdentity,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: GOALS_LIMIT,
      }),
      prisma.subscription.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
        },
        include: {
          user: {
            select: profileIdentity,
          },
          updatedByProfile: {
            select: profileIdentity,
          },
        },
        orderBy: {
          nextPayment: "asc",
        },
        take: SUBSCRIPTIONS_LIMIT,
      }),
      prisma.activity.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: ACTIVITIES_LIMIT,
      }),
    ]);

    const budgetsWithSpent = budgets.map((budget) => {
      let spent = 0;
      for (const tx of expenseTransactions) {
        if (tx.tags.some((link) => link.categoryId === budget.categoryId)) {
          spent += Number(tx.amount);
        }
      }

      return {
        ...budget,
        spent,
      };
    });

    const incompleteGoals = goals.filter(
      (goal) => Number(goal.savedAmount) < Number(goal.targetAmount),
    );

    return {
      stats,
      recentTransactions: recentTransactions.map((tx) => ({
        ...tx,
        tags: tx.tags
          .map((link) => link.category)
          .filter((cat) => cat !== null),
      })) as unknown as Transaction[],
      budgets: budgetsWithSpent as unknown as BudgetWithSpent[],
      goals: incompleteGoals as unknown as Goal[],
      subscriptions: subscriptions as unknown as Subscription[],
      activities: activities as unknown as Activity[],
    };
  },
};
