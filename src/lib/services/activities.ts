import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import type { ActivityFilters } from "@/types/Activity";
import { SpaceService } from "./spaces/space-service";

export const ActivityService = {
  async record(params: {
    userId: string;
    actorId?: string | null;
    type: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
    skipSpaceFilter?: boolean;
  }) {
    const activeSpace = await SpaceService.getCurrent(params.userId);
    return prisma.activity.create({
      data: {
        userId: params.userId,
        spaceId: params.skipSpaceFilter ? null : (activeSpace?.id ?? null),
        actorId: params.actorId ?? null,
        type: params.type,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  },

  async list(userId: string, filters?: ActivityFilters) {
    const limit = Number.isFinite(filters?.limit)
      ? Math.min(Math.max(filters?.limit ?? 15, 1), 50)
      : 15;
    const activeSpace = await SpaceService.getCurrent(userId);

    return prisma.activity.findMany({
      where: {
        userId,
        OR: [{ spaceId: activeSpace?.id ?? null }, { spaceId: null }],
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async clearAll(userId: string) {
    const result = await prisma.activity.deleteMany({
      where: {
        userId,
      },
    });

    return {
      deletedCount: result.count,
    };
  },

  async replaceEntityHistoryWithDeletion(params: {
    userId: string;
    actorId?: string | null;
    type: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown> | null;
    skipSpaceFilter?: boolean;
  }) {
    const activeSpace = await SpaceService.getCurrent(params.userId);
    return prisma.$transaction(async (tx) => {
      await tx.activity.deleteMany({
        where: {
          entityType: params.entityType,
          entityId: params.entityId,
        },
      });

      return tx.activity.create({
        data: {
          userId: params.userId,
          spaceId: params.skipSpaceFilter ? null : (activeSpace?.id ?? null),
          actorId: params.actorId ?? null,
          type: params.type,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    });
  },
};
