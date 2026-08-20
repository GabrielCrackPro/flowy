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
import type { RequestContext } from "./request-context";
import { SpaceService } from "./spaces/space-service";
import { deleteReceiptIfUnreferenced } from "./storage";
import { TransactionRepository } from "./transactions/transaction-repository";
import { ensureUserCategory } from "./validators";

type JoinTags<T> = T extends Array<{ category: infer C }> ? C : never;

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

async function cleanupReceipt(url: string | null | undefined) {
  if (!url) return;

  try {
    await deleteReceiptIfUnreferenced(url);
  } catch (error) {
    // The database mutation has already succeeded; retain the URL cleanup
    // failure in logs rather than turning a successful transaction action into
    // a misleading error response.
    console.error("Failed to clean up transaction receipt:", error);
  }
}

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
  async list(
    userId: string,
    filters?: TransactionFilters,
    context?: RequestContext,
  ) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const where: Prisma.TransactionWhereInput = { spaceId };

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
      const paymentMethods = Array.isArray(filters.paymentMethod)
        ? filters.paymentMethod
        : [filters.paymentMethod];

      where.paymentMethod =
        paymentMethods.length > 1 ? { in: paymentMethods } : paymentMethods[0];
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

    let cursorDate: Date | undefined;
    let cursorCreatedAt: Date | undefined;
    let cursorId: string | undefined;
    if (filters?.cursor) {
      const [encodedDate, encodedCreatedAt, encodedId] =
        filters.cursor.split("|");
      const parsedDate = new Date(encodedDate);
      const parsedCreatedAt = new Date(encodedCreatedAt);
      if (
        !Number.isNaN(parsedDate.getTime()) &&
        !Number.isNaN(parsedCreatedAt.getTime()) &&
        encodedId
      ) {
        cursorDate = parsedDate;
        cursorCreatedAt = parsedCreatedAt;
        cursorId = encodedId;
        where.AND = [
          {
            OR: [
              { date: { lt: parsedDate } },
              { date: parsedDate, createdAt: { lt: parsedCreatedAt } },
              {
                date: parsedDate,
                createdAt: parsedCreatedAt,
                id: { lt: encodedId },
              },
            ],
          },
        ];
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
    if (cursorDate && cursorCreatedAt && cursorId) {
      orderBy.push({ date: "desc" }, { createdAt: "desc" }, { id: "desc" });
    }

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
      ...(data.length > 0
        ? {
            nextCursor: `${data[data.length - 1].date?.toISOString() ?? ""}|${data[data.length - 1].createdAt.toISOString()}|${data[data.length - 1].id}`,
          }
        : {}),
    };
  },

  async get(userId: string, id: string, context?: RequestContext) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const transaction = await prisma.transaction.findFirst({
      where: { id, spaceId },
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

  async create(
    userId: string,
    data: CreateTransactionInput,
    context?: RequestContext,
  ) {
    if (data.categoryIds?.length) {
      for (const categoryId of data.categoryIds) {
        await ensureUserCategory(userId, categoryId);
      }
    }

    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId,
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

  async update(
    userId: string,
    id: string,
    data: UpdateTransactionInput,
    context?: RequestContext,
  ) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const existing = await this.get(userId, id, context);

    if (!existing) {
      throw new NotFoundError("Transaction not found");
    }

    if (data.categoryIds?.length) {
      for (const categoryId of data.categoryIds) {
        await ensureUserCategory(userId, categoryId);
      }
    }

    const previousReceiptUrl = existing.receiptUrl;
    const transaction = await TransactionRepository.updateInSpace(id, spaceId, {
      data: {
        updatedBy: userId,
        spaceId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        tags:
          data.categoryIds !== undefined
            ? {
                deleteMany: {},
                create: data.categoryIds.map((categoryId) => ({
                  categoryId,
                })),
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

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    if (
      previousReceiptUrl &&
      data.receiptUrl !== undefined &&
      data.receiptUrl !== previousReceiptUrl
    ) {
      await cleanupReceipt(previousReceiptUrl);
    }

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

  async delete(userId: string, id: string, context?: RequestContext) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const transaction = await this.get(userId, id, context);

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    const deleted = await TransactionRepository.deleteInSpace(id, spaceId);
    if (!deleted) {
      throw new NotFoundError("Transaction not found");
    }

    await cleanupReceipt(transaction.receiptUrl);

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

  async bulkDelete(userId: string, ids: string[], context?: RequestContext) {
    if (!ids || ids.length === 0) {
      throw new Error("No se proporcionaron IDs para eliminar");
    }

    // Verify all transactions belong to the user
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const transactions = await prisma.transaction.findMany({
      where: { id: { in: ids }, spaceId },
    });

    if (transactions.length !== ids.length) {
      throw new Error("Algunas transacciones no pertenecen al usuario");
    }

    // Delete all transactions
    const deletedCount = await TransactionRepository.deleteManyInSpace(
      ids,
      spaceId,
    );
    if (deletedCount !== ids.length) {
      throw new Error("Some transactions are outside the active space");
    }

    const receiptUrls = [
      ...new Set(
        transactions.flatMap((transaction) =>
          transaction.receiptUrl ? [transaction.receiptUrl] : [],
        ),
      ),
    ];
    await Promise.all(receiptUrls.map((url) => cleanupReceipt(url)));

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
