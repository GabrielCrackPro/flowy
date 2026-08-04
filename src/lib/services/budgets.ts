import { prisma } from "@lib/prisma/client";
import type { Prisma } from "@prisma/client";
import type {
  BudgetFilters,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/Budget";
import { ActivityService } from "./activities";
import { SpaceService } from "./spaces/space-service";
import { ensureUserCategory } from "./validators";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const BudgetService = {
  async list(userId: string, filters?: BudgetFilters) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const activeSpace = await SpaceService.getCurrent(userId);
    const where: Prisma.BudgetWhereInput = {
      spaceId: activeSpace?.id ?? null,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.month) {
      where.month = filters.month;
    }

    if (filters?.year) {
      where.year = filters.year;
    }

    const now = new Date();
    const targetMonth = filters?.month ?? now.getMonth() + 1;
    const targetYear = filters?.year ?? now.getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const startOfNextMonth = new Date(targetYear, targetMonth, 1);

    const [data, total, expenseTransactions, incomeTransactions] =
      await Promise.all([
        prisma.budget.findMany({
          where,
          include: {
            category: true,
            user: {
              select: profileIdentity,
            },
            updatedByProfile: {
              select: profileIdentity,
            },
          },
          orderBy: [
            {
              year: "desc",
            },
            {
              month: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          skip,
          take: limit,
        }),
        prisma.budget.count({ where }),
        prisma.transaction.findMany({
          where: {
            spaceId: activeSpace?.id ?? null,
            date: {
              gte: startOfMonth,
              lt: startOfNextMonth,
            },
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
        prisma.transaction.findMany({
          where: {
            spaceId: activeSpace?.id ?? null,
            date: {
              gte: startOfMonth,
              lt: startOfNextMonth,
            },
            type: "INCOME",
          },
          select: {
            id: true,
            amount: true,
            budgetId: true,
          },
        }),
      ]);

    const budgetsWithCalculations = data.map((budget) => {
      // Calculate expenses: transactions with the budget's category
      let expenses = 0;
      for (const tx of expenseTransactions) {
        if (tx.tags.some((link) => link.categoryId === budget.categoryId)) {
          expenses += Number(tx.amount);
        }
      }

      // Calculate income: transactions assigned to this budget
      let income = 0;
      for (const tx of incomeTransactions) {
        if (tx.budgetId === budget.id) {
          income += Number(tx.amount);
        }
      }

      const remaining = income - expenses;

      return {
        ...budget,
        expenses,
        income,
        remaining,
      };
    });

    return {
      data: budgetsWithCalculations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async get(userId: string, id: string) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        spaceId: activeSpace?.id ?? null,
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
    });

    if (!budget) return null;

    const now = new Date();
    const targetMonth = budget.month ?? now.getMonth() + 1;
    const targetYear = budget.year ?? now.getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const startOfNextMonth = new Date(targetYear, targetMonth, 1);

    const [expenseTransactions, incomeTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
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
      prisma.transaction.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
          type: "INCOME",
        },
        select: {
          id: true,
          amount: true,
          budgetId: true,
        },
      }),
    ]);

    // Calculate expenses: transactions with the budget's category
    let expenses = 0;
    for (const tx of expenseTransactions) {
      if (tx.tags.some((link) => link.categoryId === budget.categoryId)) {
        expenses += Number(tx.amount);
      }
    }

    // Calculate income: transactions assigned to this budget
    let income = 0;
    for (const tx of incomeTransactions) {
      if (tx.budgetId === budget.id) {
        income += Number(tx.amount);
      }
    }

    const remaining = income - expenses;

    return {
      ...budget,
      expenses,
      income,
      remaining,
    };
  },

  async create(userId: string, data: CreateBudgetInput) {
    if (!data.categoryIds || data.categoryIds.length === 0) {
      throw new Error("Category is required");
    }

    const categoryId = data.categoryIds[0]; // Use first category (one-to-one relationship)
    await ensureUserCategory(userId, categoryId);

    const activeSpace = await SpaceService.getCurrent(userId);
    const budget = await prisma.budget.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId: activeSpace?.id ?? null,
        categoryId,
        budgetLimit: data.budgetLimit,
        month: data.month ?? null,
        year: data.year ?? null,
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
    });

    await ActivityService.record({
      userId,
      type: "budget.created",
      entityType: "budget",
      entityId: budget.id,
      metadata: {
        amount: Number(budget.budgetLimit),
        month: budget.month,
        year: budget.year,
        categoryId: budget.categoryId,
      },
    });

    const now = new Date();
    const targetMonth = budget.month ?? now.getMonth() + 1;
    const targetYear = budget.year ?? now.getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const startOfNextMonth = new Date(targetYear, targetMonth, 1);

    const [expenseTransactions, incomeTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
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
      prisma.transaction.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
          type: "INCOME",
        },
        select: {
          id: true,
          amount: true,
          budgetId: true,
        },
      }),
    ]);

    // Calculate expenses: transactions with the budget's category
    let expenses = 0;
    for (const tx of expenseTransactions) {
      if (tx.tags.some((link) => link.categoryId === budget.categoryId)) {
        expenses += Number(tx.amount);
      }
    }

    // Calculate income: transactions assigned to this budget
    let income = 0;
    for (const tx of incomeTransactions) {
      if (tx.budgetId === budget.id) {
        income += Number(tx.amount);
      }
    }

    const remaining = income - expenses;

    return {
      ...budget,
      expenses,
      income,
      remaining,
    };
  },

  async update(userId: string, id: string, data: UpdateBudgetInput) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const existing = await this.get(userId, id);

    if (!existing) {
      throw new Error("Presupuesto no encontrado");
    }

    const categoryId = data.categoryIds?.[0] || existing.categoryId;
    if (categoryId) {
      await ensureUserCategory(userId, categoryId);
    }

    const budget = await prisma.budget.update({
      where: {
        id,
      },
      data: {
        updatedBy: userId,
        categoryId:
          data.categoryIds !== undefined ? data.categoryIds[0] : undefined,
        budgetLimit: data.budgetLimit,
        month: data.month,
        year: data.year,
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
    });

    await ActivityService.record({
      userId,
      type: "budget.updated",
      entityType: "budget",
      entityId: budget.id,
      metadata: {
        amount: Number(budget.budgetLimit),
        month: budget.month,
        year: budget.year,
        categoryId: budget.categoryId,
      },
    });

    const now = new Date();
    const targetMonth = budget.month ?? now.getMonth() + 1;
    const targetYear = budget.year ?? now.getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const startOfNextMonth = new Date(targetYear, targetMonth, 1);

    const [expenseTransactions, incomeTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
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
      prisma.transaction.findMany({
        where: {
          spaceId: activeSpace?.id ?? null,
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
          type: "INCOME",
        },
        select: {
          id: true,
          amount: true,
          budgetId: true,
        },
      }),
    ]);

    // Calculate expenses: transactions with the budget's category
    let expenses = 0;
    for (const tx of expenseTransactions) {
      if (tx.tags.some((link) => link.categoryId === budget.categoryId)) {
        expenses += Number(tx.amount);
      }
    }

    // Calculate income: transactions assigned to this budget
    let income = 0;
    for (const tx of incomeTransactions) {
      if (tx.budgetId === budget.id) {
        income += Number(tx.amount);
      }
    }

    const remaining = income - expenses;

    return {
      ...budget,
      expenses,
      income,
      remaining,
    };
  },

  async delete(userId: string, id: string) {
    const budget = await this.get(userId, id);

    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    await prisma.budget.delete({
      where: {
        id,
      },
    });

    await ActivityService.replaceEntityHistoryWithDeletion({
      userId,
      type: "budget.deleted",
      entityType: "budget",
      entityId: budget.id,
      metadata: {
        amount: Number(budget.budgetLimit),
        month: budget.month,
        year: budget.year,
        categoryId: budget.categoryId,
      },
    });

    return {
      success: true,
    };
  },
};
