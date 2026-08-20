import { NotFoundError } from "@/lib/errors/error-types";
import { prisma } from "@/lib/prisma/client";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/Category";
import { ActivityService } from "./activities";
import { CategoryRepository } from "./categories/category-repository";
import type { RequestContext } from "./request-context";
import { categoryInclude, profileIdentity } from "./selects";
import { SpaceService } from "./spaces/space-service";

/**
 * Default categories seeded on first signup so new users don't land on
 * empty states everywhere. Names are localized to the user's profile
 * locale; icons/colors reuse the same option sets as the category form
 * (src/components/categories/category-icons.ts / category-colors.ts).
 */
const DEFAULT_CATEGORIES: Record<
  "es" | "en",
  Array<{
    name: string;
    icon: string;
    color: string;
    type: "INCOME" | "EXPENSE";
  }>
> = {
  es: [
    {
      name: "Supermercado",
      icon: "groceries",
      color: "#22c55e",
      type: "EXPENSE",
    },
    {
      name: "Restaurantes",
      icon: "restaurant",
      color: "#f97316",
      type: "EXPENSE",
    },
    {
      name: "Transporte",
      icon: "transport",
      color: "#3b82f6",
      type: "EXPENSE",
    },
    { name: "Combustible", icon: "fuel", color: "#f59e0b", type: "EXPENSE" },
    { name: "Vivienda", icon: "housing", color: "#8b5cf6", type: "EXPENSE" },
    { name: "Servicios", icon: "utilities", color: "#06b6d4", type: "EXPENSE" },
    { name: "Salud", icon: "health", color: "#ef4444", type: "EXPENSE" },
    { name: "Ocio", icon: "entertainment", color: "#d946ef", type: "EXPENSE" },
    { name: "Compras", icon: "shopping", color: "#ec4899", type: "EXPENSE" },
    { name: "Otros gastos", icon: "other", color: "#64748b", type: "EXPENSE" },
    { name: "Nómina", icon: "salary", color: "#22c55e", type: "INCOME" },
    { name: "Freelance", icon: "freelance", color: "#3b82f6", type: "INCOME" },
    {
      name: "Inversiones",
      icon: "investments",
      color: "#8b5cf6",
      type: "INCOME",
    },
    { name: "Otros ingresos", icon: "other", color: "#64748b", type: "INCOME" },
  ],
  en: [
    { name: "Groceries", icon: "groceries", color: "#22c55e", type: "EXPENSE" },
    {
      name: "Restaurants",
      icon: "restaurant",
      color: "#f97316",
      type: "EXPENSE",
    },
    { name: "Transport", icon: "transport", color: "#3b82f6", type: "EXPENSE" },
    { name: "Fuel", icon: "fuel", color: "#f59e0b", type: "EXPENSE" },
    { name: "Housing", icon: "housing", color: "#8b5cf6", type: "EXPENSE" },
    { name: "Utilities", icon: "utilities", color: "#06b6d4", type: "EXPENSE" },
    { name: "Health", icon: "health", color: "#ef4444", type: "EXPENSE" },
    {
      name: "Entertainment",
      icon: "entertainment",
      color: "#d946ef",
      type: "EXPENSE",
    },
    { name: "Shopping", icon: "shopping", color: "#ec4899", type: "EXPENSE" },
    {
      name: "Other expenses",
      icon: "other",
      color: "#64748b",
      type: "EXPENSE",
    },
    { name: "Salary", icon: "salary", color: "#22c55e", type: "INCOME" },
    { name: "Freelance", icon: "freelance", color: "#3b82f6", type: "INCOME" },
    {
      name: "Investments",
      icon: "investments",
      color: "#8b5cf6",
      type: "INCOME",
    },
    { name: "Other income", icon: "other", color: "#64748b", type: "INCOME" },
  ],
};

async function ensureCategory(id: string, spaceId: string | null) {
  const category = await prisma.category.findFirst({
    where: { id, spaceId },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  return category;
}

export const CategoryService = {
  /**
   * Seed the default categories for a brand-new user (personal space).
   * Guarded by the profile's `categoriesSeeded` latch: it runs at most
   * once per account — deleting all categories later does NOT re-seed.
   * Safe to call on every profile ensure; it is a no-op after the first
   * successful seed.
   */
  async seedDefaults(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, locale: true, categoriesSeeded: true },
    });

    if (!profile || profile.categoriesSeeded) {
      return { seeded: false };
    }

    const activeSpace = await SpaceService.getCurrent(userId);
    const locale = profile.locale === "es" ? "es" : "en";
    const defaults = DEFAULT_CATEGORIES[locale];

    await prisma.$transaction([
      prisma.category.createMany({
        data: defaults.map((category) => ({
          userId,
          updatedBy: userId,
          spaceId: activeSpace?.id ?? null,
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type,
        })),
      }),
      prisma.profile.update({
        where: { id: userId },
        data: { categoriesSeeded: true },
      }),
    ]);

    return { seeded: true, count: defaults.length };
  },

  async list(userId: string, context?: RequestContext) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    return prisma.category.findMany({
      where: { spaceId },
      include: {
        ...categoryInclude,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  async getById(userId: string, id: string, context?: RequestContext) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    return prisma.category.findFirst({
      where: { id, spaceId },
      include: {
        ...categoryInclude,
      },
    });
  },

  async create(
    userId: string,
    data: CreateCategoryInput,
    context?: RequestContext,
  ) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const exists = await prisma.category.findFirst({
      where: { spaceId, name: data.name },
    });

    if (exists) {
      throw new Error("Ya existe una categoría con ese nombre.");
    }

    const category = await prisma.category.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
      },
      include: {
        ...categoryInclude,
      },
    });

    await ActivityService.record({
      userId,
      type: "category.created",
      entityType: "category",
      entityId: category.id,
      metadata: {
        name: category.name,
        type: category.type,
      },
    });

    return category;
  },

  async update(
    userId: string,
    id: string,
    data: UpdateCategoryInput,
    context?: RequestContext,
  ) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    await ensureCategory(id, spaceId);

    if (data.name) {
      const duplicated = await prisma.category.findFirst({
        where: { spaceId, name: data.name, NOT: { id } },
      });

      if (duplicated) {
        throw new Error("Ya existe una categoría con ese nombre.");
      }
    }

    const category = await CategoryRepository.updateInSpace(id, spaceId, {
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        user: {
          select: profileIdentity,
        },
        updatedByProfile: {
          select: profileIdentity,
        },
      },
    });

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    await ActivityService.record({
      userId,
      type: "category.updated",
      entityType: "category",
      entityId: category.id,
      metadata: {
        name: category.name,
        type: category.type,
      },
    });

    return category;
  },

  async delete(userId: string, id: string, context?: RequestContext) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const category = await ensureCategory(id, spaceId);

    const deleted = await CategoryRepository.deleteInSpace(id, spaceId);
    if (!deleted) {
      throw new NotFoundError("Category not found");
    }

    await ActivityService.replaceEntityHistoryWithDeletion({
      userId,
      type: "category.deleted",
      entityType: "category",
      entityId: category.id,
      metadata: {
        name: category.name,
        type: category.type,
      },
    });

    return {
      success: true,
    };
  },
};
