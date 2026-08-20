import { prisma } from "@/lib/prisma/client";
import type { ActivityFilters } from "@/types/Activity";
import { ActivityRepository } from "./activities/activity-repository";
import type { RequestContext } from "./request-context";
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
    context?: RequestContext;
  }) {
    const spaceId =
      params.context?.spaceId ??
      (await SpaceService.getCurrent(params.userId))?.id ??
      null;
    return ActivityRepository.create({
      userId: params.userId,
      spaceId: params.skipSpaceFilter ? null : spaceId,
      actorId: params.actorId,
      type: params.type,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    });
  },

  async list(
    userId: string,
    filters?: ActivityFilters,
    context?: RequestContext,
  ) {
    const limit = Number.isFinite(filters?.limit)
      ? Math.min(Math.max(filters?.limit ?? 15, 1), 50)
      : 15;
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const cursorDate = filters?.cursor ? new Date(filters.cursor) : undefined;

    return prisma.activity.findMany({
      where: {
        userId,
        OR: [{ spaceId }, { spaceId: null }],
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
        ...(cursorDate && !Number.isNaN(cursorDate.getTime())
          ? { createdAt: { lt: cursorDate } }
          : {}),
      },
      select: {
        id: true,
        userId: true,
        actorId: true,
        type: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async clearAll(userId: string) {
    const result = await ActivityRepository.clearAll(userId);
    return { deletedCount: result.count };
  },

  async replaceEntityHistoryWithDeletion(params: {
    userId: string;
    actorId?: string | null;
    type: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown> | null;
    skipSpaceFilter?: boolean;
    context?: RequestContext;
  }) {
    const spaceId =
      params.context?.spaceId ??
      (await SpaceService.getCurrent(params.userId))?.id ??
      null;
    return ActivityRepository.replaceHistoryWithDeletion({
      userId: params.userId,
      spaceId: params.skipSpaceFilter ? null : spaceId,
      actorId: params.actorId,
      type: params.type,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    });
  },
};
