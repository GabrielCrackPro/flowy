import { prisma } from "@/lib/prisma/client";
import type { SearchResponse, SearchResultItem } from "@/types/SearchResult";
import { SpaceService } from "./spaces/space-service";

export const SearchService = {
  async search(
    userId: string,
    query: string,
    cursor?: string,
  ): Promise<SearchResponse> {
    if (query.length < 2) {
      return { query, results: [], total: 0 };
    }

    const activeSpace = await SpaceService.getCurrent(userId);
    const spaceId = activeSpace?.id ?? null;
    const cursorDate = cursor ? new Date(cursor) : undefined;
    const cursorFilter =
      cursorDate && !Number.isNaN(cursorDate.getTime())
        ? { createdAt: { lt: cursorDate } }
        : {};

    const results: SearchResultItem[] = [];

    const [transactions, categories, budgets, goals, subscriptions] =
      await Promise.all([
        prisma.transaction.findMany({
          where: {
            spaceId,
            ...cursorFilter,
            OR: [
              { description: { contains: query, mode: "insensitive" } },
              { notes: { contains: query, mode: "insensitive" } },
              { paymentMethod: { contains: query, mode: "insensitive" } },
              {
                tags: {
                  some: {
                    category: {
                      name: { contains: query, mode: "insensitive" },
                    },
                  },
                },
              },
            ],
          },
          include: {
            tags: {
              include: {
                category: true,
              },
            },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        prisma.category.findMany({
          where: {
            spaceId,
            ...cursorFilter,
            name: { contains: query, mode: "insensitive" },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        prisma.budget.findMany({
          where: {
            spaceId,
            ...cursorFilter,
            category: {
              name: { contains: query, mode: "insensitive" },
            },
          },
          include: {
            category: true,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        prisma.goal.findMany({
          where: {
            spaceId,
            ...cursorFilter,
            title: { contains: query, mode: "insensitive" },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        prisma.subscription.findMany({
          where: {
            spaceId,
            ...cursorFilter,
            OR: [
              { merchant: { contains: query, mode: "insensitive" } },
              { billingCycle: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const resultDates = [
      ...transactions.map((item) => item.createdAt),
      ...categories.map((item) => item.createdAt),
      ...budgets.map((item) => item.createdAt),
      ...goals.map((item) => item.createdAt),
      ...subscriptions.map((item) => item.createdAt),
    ];
    const nextCursor = resultDates.length
      ? resultDates
          .reduce((min, date) => (date < min ? date : min))
          .toISOString()
      : undefined;

    results.push(
      ...transactions.map((t) => ({
        id: t.id,
        type: "transaction" as const,
        title: t.description || "Sin descripción",
        subtitle:
          t.tags
            .map((link) => link.category?.name)
            .filter(Boolean)
            .join(", ") || null,
        url: `/dashboard/transaction/detail/${t.id}`,
        amount: Number(t.amount),
      })),
      ...categories.map((c) => ({
        id: c.id,
        type: "category" as const,
        title: c.name,
        subtitle: c.type ?? null,
        url: `/dashboard/category/detail/${c.id}`,
      })),
      ...budgets.map((b) => ({
        id: b.id,
        type: "budget" as const,
        title: b.category?.name || "Sin categoría",
        subtitle: null,
        url: `/dashboard/budget/detail/${b.id}`,
        amount: Number(b.budgetLimit),
      })),
      ...goals.map((g) => ({
        id: g.id,
        type: "goal" as const,
        title: g.title,
        subtitle: null,
        url: `/dashboard/goal/detail/${g.id}`,
        amount: Number(g.targetAmount),
      })),
      ...subscriptions.map((s) => ({
        id: s.id,
        type: "subscription" as const,
        title: s.merchant || "Sin comercio",
        subtitle: s.billingCycle ?? null,
        url: `/dashboard/subscription/detail/${s.id}`,
        amount: s.amount ? Number(s.amount) : undefined,
      })),
    );

    return {
      query,
      results,
      total: results.length,
      ...(nextCursor ? { nextCursor } : {}),
    };
  },
};
