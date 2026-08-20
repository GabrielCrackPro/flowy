import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const subscriptionInclude = {
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.SubscriptionInclude;

type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;

export const SubscriptionRepository = {
  async updateInSpace(
    id: string,
    spaceId: string | null,
    args: Omit<Prisma.SubscriptionUpdateArgs, "where">,
  ): Promise<SubscriptionWithRelations | null> {
    const existing = await prisma.subscription.findFirst({
      where: { id, spaceId },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.subscription.update({
      ...args,
      include: subscriptionInclude,
      where: { id },
    });
  },

  async deleteInSpace(id: string, spaceId: string | null): Promise<boolean> {
    const result = await prisma.subscription.deleteMany({
      where: { id, spaceId },
    });
    return result.count === 1;
  },
};
