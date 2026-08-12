import { prisma } from "@lib/prisma/client";
import type { Prisma } from "@prisma/client";
import { toDateOnlyDatabaseValue } from "@/lib/date-only";
import { NotFoundError } from "@/lib/errors/error-types";
import type {
  CreateTransactionInput,
  TransactionFilters,
  UpdateTransactionInput,
} from "@/types/Transaction";
import { ActivityService } from "./activities";
import { SpaceService } from "./spaces/space-service";
import { ensureUserCategory } from "./validators";

type JoinTags<T> = T extends Array<{ category: infer C }> ? C : never;

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

function withTags<
  T extends { tags: Array<{ category: unknown }>; budgetId?: string | null },
>(row: T): Omit<T, "tags"> & { tags: Array<NonNullable<JoinTags<T["tags"]>>> } {
  return {
    ...row,
    tags: row.tags
      .map((link) => link.category)
      .filter((category) => category !== null) as Array<
      NonNullable<JoinTags<T["tags"]>>
    >,
  };
}

export const TransactionService = {
  async list(userId: string, filters?: TransactionFilters) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const where: Prisma.TransactionWhereInput = {
      spaceId: activeSpace?.id ?? null,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.categoryId) {
      const categoryIds = filters.categoryId.split(",").filter(Boolean);

      if (categoryIds.length > 0) {
        where.tags = {
          some: {
            categoryId: {
              in: categoryIds,
            },
          },
        };
      }
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.isRecurring !== undefined) {
      where.isRecurring = filters.isRecurring;
    }

    if (filters?.from || filters?.to) {
      where.date = {};

      if (filters.from) {
        const fromDate = toDateOnlyDatabaseValue(filters.from);
        if (fromDate) {
          where.date.gte = fromDate;
        }
      }

      if (filters.to) {
        const toDate = toDateOnlyDatabaseValue(filters.to);
        if (toDate) {
          where.date.lte = toDate;
        }
      }
    }

    if (filters?.search) {
      where.OR = [
        {
          description: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          notes: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    // Build orderBy based on sortBy and sortOrder
    const sortBy = filters?.sortBy ?? "date";
    const sortOrder = filters?.sortOrder ?? "desc";

    const orderBy: Prisma.TransactionOrderByWithRelationInput[] = [];

    if (sortBy === "date") {
      orderBy.push({ date: sortOrder });
      orderBy.push({ createdAt: "desc" });
    } else if (sortBy === "amount") {
      orderBy.push({ amount: sortOrder });
    } else if (sortBy === "description") {
      orderBy.push({ description: sortOrder });
    } else if (sortBy === "type") {
      orderBy.push({ type: sortOrder });
    } else {
      orderBy.push({ date: sortOrder });
      orderBy.push({ createdAt: "desc" });
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          tags: {
            include: {
              category: true,
            },
          },
          budget: {
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: data.map((transaction) => ({
        ...withTags(transaction),
        budgetId: transaction.budgetId,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async get(userId: string, id: string) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        spaceId: activeSpace?.id ?? null,
      },
      include: {
        tags: {
          include: {
            category: true,
          },
        },
        budget: {
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
    });

    return transaction
      ? { ...withTags(transaction), budgetId: transaction.budgetId }
      : null;
  },

  async create(userId: string, data: CreateTransactionInput) {
    if (data.categoryIds?.length) {
      for (const categoryId of data.categoryIds) {
        await ensureUserCategory(userId, categoryId);
      }
    }

    const activeSpace = await SpaceService.getCurrent(userId);
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId: activeSpace?.id ?? null,
        type: data.type,
        amount: data.amount,
        description: data.description,
        tags: data.categoryIds?.length
          ? {
              create: data.categoryIds.map((categoryId) => ({ categoryId })),
            }
          : undefined,
        paymentMethod: data.paymentMethod,
        date: toDateOnlyDatabaseValue(data.date) ?? null,
        notes: data.notes,
        receiptUrl: data.receiptUrl,
        isRecurring: data.isRecurring ?? false,
        budgetId: data.budgetId || null,
      },
      include: {
        tags: {
          include: {
            category: true,
          },
        },
        budget: {
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
    });

    await ActivityService.record({
      userId,
      type: "transaction.created",
      entityType: "transaction",
      entityId: transaction.id,
      metadata: {
        description: transaction.description,
        amount: Number(transaction.amount),
        type: transaction.type,
      },
    });

    return { ...withTags(transaction), budgetId: transaction.budgetId };
  },

  async update(userId: string, id: string, data: UpdateTransactionInput) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const existing = await this.get(userId, id);

    if (!existing) {
      throw new NotFoundError("Transaction not found");
    }

    if (data.categoryIds?.length) {
      for (const categoryId of data.categoryIds) {
        await ensureUserCategory(userId, categoryId);
      }
    }

    const transaction = await prisma.transaction.update({
      where: {
        id,
      },
      data: {
        updatedBy: userId,
        spaceId: activeSpace?.id ?? null,
        type: data.type,
        amount: data.amount,
        description: data.description,
        tags:
          data.categoryIds !== undefined
            ? {
                deleteMany: {},
                create: data.categoryIds.map((categoryId) => ({ categoryId })),
              }
            : undefined,
        paymentMethod: data.paymentMethod,
        date:
          data.date !== undefined
            ? (toDateOnlyDatabaseValue(data.date) ?? null)
            : undefined,

        notes: data.notes,
        receiptUrl: data.receiptUrl,
        isRecurring: data.isRecurring,
        budgetId: data.budgetId || null,
      },
      include: {
        tags: {
          include: {
            category: true,
          },
        },
        budget: {
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
    });

    await ActivityService.record({
      userId,
      type: "transaction.updated",
      entityType: "transaction",
      entityId: transaction.id,
      metadata: {
        description: transaction.description,
        amount: Number(transaction.amount),
        type: transaction.type,
      },
    });

    return { ...withTags(transaction), budgetId: transaction.budgetId };
  },

  async delete(userId: string, id: string) {
    const transaction = await this.get(userId, id);

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    await prisma.transaction.delete({
      where: {
        id,
      },
    });

    await ActivityService.replaceEntityHistoryWithDeletion({
      userId,
      type: "transaction.deleted",
      entityType: "transaction",
      entityId: transaction.id,
      metadata: {
        description: transaction.description,
        amount: Number(transaction.amount),
        type: transaction.type,
      },
    });

    return {
      success: true,
    };
  },

  async bulkDelete(userId: string, ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new Error("No se proporcionaron IDs para eliminar");
    }

    // Verify all transactions belong to the user
    const activeSpace = await SpaceService.getCurrent(userId);
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: ids },
        spaceId: activeSpace?.id ?? null,
      },
    });

    if (transactions.length !== ids.length) {
      throw new Error("Algunas transacciones no pertenecen al usuario");
    }

    // Delete all transactions
    await prisma.transaction.deleteMany({
      where: {
        id: { in: ids },
        spaceId: activeSpace?.id ?? null,
      },
    });

    // Record activity for each deleted transaction
    for (const transaction of transactions) {
      await ActivityService.replaceEntityHistoryWithDeletion({
        userId,
        type: "transaction.deleted",
        entityType: "transaction",
        entityId: transaction.id,
        metadata: {
          description: transaction.description,
          amount: Number(transaction.amount),
          type: transaction.type,
        },
      });
    }

    return {
      success: true,
      deletedCount: ids.length,
    };
  },
};
