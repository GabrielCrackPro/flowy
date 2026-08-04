import type { Comment } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

import type { CreateCommentInput, UpdateCommentInput } from "@/types/Comment";
import { ActivityService } from "./activities";
import { SpaceService } from "./spaces/space-service";

export const CommentService = {
  async list(userId: string, entityType: string, entityId: string) {
    const activeSpace = await SpaceService.getCurrent(userId);
    return prisma.comment.findMany({
      where: { spaceId: activeSpace?.id ?? null, entityType, entityId },
      orderBy: { createdAt: "asc" },
    });
  },

  async get(userId: string, id: string) {
    const activeSpace = await SpaceService.getCurrent(userId);
    return prisma.comment.findFirst({
      where: { id, spaceId: activeSpace?.id ?? null },
    });
  },

  async create(userId: string, data: CreateCommentInput) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const parentId: string | null = data.parentId ?? null;
    let parent: Comment | null = null;

    if (parentId) {
      parent = await prisma.comment.findFirst({
        where: { id: parentId, spaceId: activeSpace?.id ?? null },
      });
      if (!parent) throw new Error("Comentario padre no encontrado");
      if (
        parent.entityType !== data.entityType ||
        parent.entityId !== data.entityId
      ) {
        throw new Error("Comentario padre no encontrado");
      }
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        spaceId: activeSpace?.id ?? null,
        entityType: data.entityType,
        entityId: data.entityId,
        content: data.content,
        parentId,
      },
    });

    await ActivityService.record({
      userId,
      type: "comment.created",
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: {
        commentId: comment.id,
        snippet: comment.content.slice(0, 120),
      },
    });

    if (parent && parent.userId !== userId) {
      await ActivityService.record({
        userId: parent.userId,
        actorId: userId,
        type: "comment.replied",
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: {
          commentId: comment.id,
          snippet: comment.content.slice(0, 120),
        },
      });
    }

    return comment;
  },

  async update(userId: string, id: string, data: UpdateCommentInput) {
    const comment = await this.get(userId, id);
    if (!comment) throw new Error("Comentario no encontrado");

    const updated = await prisma.comment.update({
      where: { id },
      data: { content: data.content },
    });

    await ActivityService.record({
      userId,
      type: "comment.updated",
      entityType: comment.entityType,
      entityId: comment.entityId,
      metadata: {
        commentId: updated.id,
        snippet: updated.content.slice(0, 120),
      },
    });

    return updated;
  },

  async delete(userId: string, id: string) {
    const comment = await this.get(userId, id);
    if (!comment) throw new Error("Comentario no encontrado");

    await prisma.comment.delete({ where: { id } });

    await ActivityService.record({
      userId,
      type: "comment.deleted",
      entityType: comment.entityType,
      entityId: comment.entityId,
      metadata: {
        commentId: comment.id,
        snippet: comment.content.slice(0, 120),
      },
    });

    return { success: true };
  },
};
