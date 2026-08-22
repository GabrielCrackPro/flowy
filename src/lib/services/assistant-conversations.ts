import { prisma } from "@/lib/prisma/client";
import { SpaceService } from "@/lib/services/spaces/space-service";

async function getActiveSpace(userId: string) {
  const space = await SpaceService.getCurrent(userId);
  if (!space) throw new Error("Active space not found");
  return space;
}

const MAX_CONVERSATIONS = 30;
const MAX_MESSAGES = 100;

export const AssistantConversationService = {
  async list(userId: string) {
    const space = await getActiveSpace(userId);
    return prisma.assistantConversation.findMany({
      where: { userId, spaceId: space.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_CONVERSATIONS,
    });
  },

  async get(userId: string, conversationId: string) {
    const space = await getActiveSpace(userId);
    return prisma.assistantConversation.findFirst({
      where: { id: conversationId, userId, spaceId: space.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: MAX_MESSAGES,
        },
      },
    });
  },

  async create(userId: string, title = "New conversation", id?: string) {
    const space = await getActiveSpace(userId);
    return prisma.assistantConversation.create({
      data: {
        ...(id ? { id } : {}),
        userId,
        spaceId: space.id,
        title: title.trim().slice(0, 120) || "New conversation",
      },
    });
  },

  async addMessages(
    userId: string,
    conversationId: string,
    messages: Array<{ role: string; content: string }>,
  ) {
    const conversation = await this.get(userId, conversationId);
    if (!conversation) return null;

    const safeMessages = messages
      .filter((message) => ["user", "assistant"].includes(message.role))
      .filter((message) => message.content.trim())
      .slice(-MAX_MESSAGES);

    if (safeMessages.length === 0) return conversation;

    return prisma.$transaction(async (tx) => {
      await tx.assistantConversationMessage.createMany({
        data: safeMessages.map((message) => ({
          conversationId,
          role: message.role,
          content: message.content.slice(0, 20_000),
        })),
      });
      const title =
        conversation.title === "New conversation" &&
        safeMessages[0]?.role === "user"
          ? safeMessages[0].content.slice(0, 80)
          : conversation.title;
      await tx.assistantConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date(), title },
      });
      return tx.assistantConversation.findUnique({
        where: { id: conversationId },
      });
    });
  },

  async rename(userId: string, conversationId: string, title: string) {
    const space = await getActiveSpace(userId);
    const trimmed = title.trim().slice(0, 120);
    if (!trimmed) return null;
    return prisma.assistantConversation.updateMany({
      where: { id: conversationId, userId, spaceId: space.id },
      data: { title: trimmed },
    });
  },

  async remove(userId: string, conversationId: string) {
    const space = await getActiveSpace(userId);
    return prisma.assistantConversation.deleteMany({
      where: { id: conversationId, userId, spaceId: space.id },
    });
  },

  async clearAll(userId: string) {
    const space = await getActiveSpace(userId);
    return prisma.assistantConversation.deleteMany({
      where: { userId, spaceId: space.id },
    });
  },
};
