import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const goalInclude = {
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.GoalInclude;

type GoalWithRelations = Prisma.GoalGetPayload<{ include: typeof goalInclude }>;

export const GoalRepository = {
  async updateInSpace(
    id: string,
    spaceId: string | null,
    args: Omit<Prisma.GoalUpdateArgs, "where">,
  ): Promise<GoalWithRelations | null> {
    const existing = await prisma.goal.findFirst({
      where: { id, spaceId },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.goal.update({
      ...args,
      include: goalInclude,
      where: { id },
    });
  },

  async deleteInSpace(id: string, spaceId: string | null): Promise<boolean> {
    const result = await prisma.goal.deleteMany({ where: { id, spaceId } });
    return result.count === 1;
  },
};
