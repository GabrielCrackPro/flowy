import { prisma } from "@lib/prisma/client";
import type { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors/error-types";
import type {
  BudgetFilters,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/Budget";
import { ActivityService } from "./activities";
import { getBudgetAggregates } from "./budget-aggregates";
import { BudgetRepository } from "./budgets/budget-repository";
import type { RequestContext } from "./request-context";
import { budgetInclude } from "./selects";
import { SpaceService } from "./spaces/space-service";
import { ensureUserCategory } from "./validators";

async function withBudgetTotals(
  budget: Prisma.BudgetGetPayload<{ include: typeof budgetInclude }>,
  spaceId: string | null,
) {
  const month = budget.month ?? new Date().getMonth() + 1;
  const year = budget.year ?? new Date().getFullYear();
  const aggregates = await getBudgetAggregates({
    spaceId,
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
    budgetIds: [budget.id],
  });
  return {
    ...budget,
    ...(aggregates.get(budget.id) ?? {
      expenses: 0,
      income: 0,
      remaining: 0,
    }),
  };
}

export const BudgetService = {
  async list(
    userId: string,
    filters?: BudgetFilters,
    context?: RequestContext,
  ) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const where: Prisma.BudgetWhereInput = { spaceId };

    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.month) where.month = filters.month;
    if (filters?.year) where.year = filters.year;

    const now = new Date();
    const month = filters?.month ?? now.getMonth() + 1;
    const year = filters?.year ?? now.getFullYear();
    const [data, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: budgetInclude,
        orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.budget.count({ where }),
    ]);
    const aggregates = await getBudgetAggregates({
      spaceId,
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 1),
      budgetIds: data.map((budget) => budget.id),
    });

    return {
      data: data.map((budget) => ({
        ...budget,
        ...(aggregates.get(budget.id) ?? {
          expenses: 0,
          income: 0,
          remaining: 0,
        }),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async get(userId: string, id: string, context?: RequestContext) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const budget = await prisma.budget.findFirst({
      where: { id, spaceId },
      include: budgetInclude,
    });
    return budget ? withBudgetTotals(budget, spaceId) : null;
  },

  async create(
    userId: string,
    data: CreateBudgetInput,
    context?: RequestContext,
  ) {
    if (!data.categoryIds?.length) {
      throw new ValidationError("Category is required");
    }
    const categoryId = data.categoryIds[0];
    await ensureUserCategory(userId, categoryId);
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const budget = await prisma.budget.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId,
        categoryId,
        budgetLimit: data.budgetLimit,
        month: data.month ?? null,
        year: data.year ?? null,
      },
      include: budgetInclude,
    });
    await ActivityService.record({
      userId,
      type: "budget.created",
      entityType: "budget",
      entityId: budget.id,
      metadata: { amount: Number(budget.budgetLimit), categoryId },
    });
    return withBudgetTotals(budget, spaceId);
  },

  async update(
    userId: string,
    id: string,
    data: UpdateBudgetInput,
    context?: RequestContext,
  ) {
    const existing = await this.get(userId, id);
    if (!existing) throw new NotFoundError("Budget not found");
    if (data.categoryIds?.[0]) {
      await ensureUserCategory(userId, data.categoryIds[0]);
    }
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const budget = await BudgetRepository.updateInSpace(id, spaceId, {
      data: {
        updatedBy: userId,
        categoryId: data.categoryIds?.[0],
        budgetLimit: data.budgetLimit,
        month: data.month,
        year: data.year,
      },
    });
    if (!budget) throw new NotFoundError("Budget not found");
    await ActivityService.record({
      userId,
      type: "budget.updated",
      entityType: "budget",
      entityId: id,
      metadata: {
        amount: Number(budget.budgetLimit),
        categoryId: budget.categoryId,
      },
    });
    return withBudgetTotals(budget, spaceId);
  },

  async delete(userId: string, id: string, context?: RequestContext) {
    const budget = await this.get(userId, id, context);
    if (!budget) throw new NotFoundError("Budget not found");
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    if (!(await BudgetRepository.deleteInSpace(id, spaceId))) {
      throw new NotFoundError("Budget not found");
    }
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
    return { success: true };
  },
};
