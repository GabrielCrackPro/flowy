import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export interface ActivityRecord {
  userId: string;
  spaceId: string | null;
  actorId?: string | null;
  type: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export const ActivityRepository = {
  async create(params: ActivityRecord) {
    return prisma.activity.create({
      data: {
        userId: params.userId,
        spaceId: params.spaceId,
        actorId: params.actorId ?? null,
        type: params.type,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  },

  async replaceHistoryWithDeletion(params: ActivityRecord) {
    return prisma.$transaction(async (tx) => {
      await tx.activity.deleteMany({
        where: {
          entityType: params.entityType ?? "",
          entityId: params.entityId ?? "",
        },
      });
      return tx.activity.create({
        data: {
          userId: params.userId,
          spaceId: params.spaceId,
          actorId: params.actorId ?? null,
          type: params.type,
          entityType: params.entityType ?? null,
          entityId: params.entityId ?? null,
          metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    });
  },

  async clearAll(userId: string) {
    return prisma.activity.deleteMany({ where: { userId } });
  },
};
