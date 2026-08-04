import { prisma } from "@/lib/prisma/client";
import type { SearchResponse, SearchResultItem } from "@/types/SearchResult";
import { SpaceService } from "./spaces/space-service";

export const SearchService = {
  async search(userId: string, query: string): Promise<SearchResponse> {
    if (query.length < 2) {
      return { query, results: [], total: 0 };
    }

    const activeSpace = await SpaceService.getCurrent(userId);

    const results: SearchResultItem[] = [];

    const [transactions, categories, budgets, goals, subscriptions] =
      await Promise.all([
        prisma.transaction.findMany({
          where: {
            spaceId: activeSpace?.id ?? null,
            OR: [
              { description: { contains: query, mode: "insensitive" } },
              { notes: { contains: query, mode: "insensitive" } },
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
          orderBy: { date: "desc" },
        }),
        prisma.category.findMany({
          where: {
            spaceId: activeSpace?.id ?? null,
            name: { contains: query, mode: "insensitive" },
          },
          take: 5,
          orderBy: { name: "asc" },
        }),
        prisma.budget.findMany({
          where: {
            spaceId: activeSpace?.id ?? null,
            category: {
              name: { contains: query, mode: "insensitive" },
            },
          },
          include: {
            category: true,
          },
          take: 5,
        }),
        prisma.goal.findMany({
          where: {
            spaceId: activeSpace?.id ?? null,
            title: { contains: query, mode: "insensitive" },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        prisma.subscription.findMany({
          where: {
            spaceId: activeSpace?.id ?? null,
            merchant: { contains: query, mode: "insensitive" },
          },
          take: 5,
          orderBy: { nextPayment: "asc" },
        }),
      ]);

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

    return { query, results, total: results.length };
  },
};
