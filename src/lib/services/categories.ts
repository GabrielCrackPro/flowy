import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/Category";
import { ActivityService } from "./activities";
import { SpaceService } from "./spaces/space-service";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

async function ensureCategory(userId: string, id: string) {
  const activeSpace = await SpaceService.getCurrent(userId);
  const category = await prisma.category.findFirst({
    where: {
      id,
      spaceId: activeSpace?.id ?? null,
    },
  });

  if (!category) {
    throw new Error("Categoría no encontrada");
  }

  return category;
}

export const CategoryService = {
  async list(userId: string) {
    const activeSpace = await SpaceService.getCurrent(userId);
    return prisma.category.findMany({
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
        name: "asc",
      },
    });
  },

  async getById(userId: string, id: string) {
    const activeSpace = await SpaceService.getCurrent(userId);
    return prisma.category.findFirst({
      where: {
        id,
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
    });
  },

  async create(userId: string, data: CreateCategoryInput) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const exists = await prisma.category.findFirst({
      where: {
        spaceId: activeSpace?.id ?? null,
        name: data.name,
      },
    });

    if (exists) {
      throw new Error("Ya existe una categoría con ese nombre.");
    }

    const category = await prisma.category.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId: activeSpace?.id ?? null,
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
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

  async update(userId: string, id: string, data: UpdateCategoryInput) {
    await ensureCategory(userId, id);

    if (data.name) {
      const duplicated = await prisma.category.findFirst({
        where: {
          spaceId: (await SpaceService.getCurrent(userId))?.id ?? null,
          name: data.name,
          NOT: {
            id,
          },
        },
      });

      if (duplicated) {
        throw new Error("Ya existe una categoría con ese nombre.");
      }
    }

    const category = await prisma.category.update({
      where: {
        id,
      },
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

  async delete(userId: string, id: string) {
    const category = await ensureCategory(userId, id);

    await prisma.category.delete({
      where: {
        id,
      },
    });

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
