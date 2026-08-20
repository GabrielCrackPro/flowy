import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const transactionInclude = {
  tags: { include: { category: true } },
  budget: { include: { category: true } },
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.TransactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export const TransactionRepository = {
  async updateInSpace(
    id: string,
    spaceId: string | null,
    args: Omit<Prisma.TransactionUpdateArgs, "where">,
  ): Promise<TransactionWithRelations | null> {
    const existing = await prisma.transaction.findFirst({
      where: { id, spaceId },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.transaction.update({
      ...args,
      include: transactionInclude,
      where: { id },
    });
  },

  async existsInSpace(id: string, spaceId: string | null): Promise<boolean> {
    const row = await prisma.transaction.findFirst({
      where: { id, spaceId },
      select: { id: true },
    });
    return Boolean(row);
  },

  async deleteInSpace(id: string, spaceId: string | null): Promise<boolean> {
    const result = await prisma.transaction.deleteMany({
      where: { id, spaceId },
    });
    return result.count === 1;
  },

  async deleteManyInSpace(
    ids: string[],
    spaceId: string | null,
  ): Promise<number> {
    const result = await prisma.transaction.deleteMany({
      where: { id: { in: ids }, spaceId },
    });
    return result.count;
  },
};
