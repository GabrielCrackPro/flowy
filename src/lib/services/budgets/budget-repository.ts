import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const budgetInclude = {
  category: true,
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.BudgetInclude;

type BudgetWithRelations = Prisma.BudgetGetPayload<{
  include: typeof budgetInclude;
}>;

export const BudgetRepository = {
  async updateInSpace(
    id: string,
    spaceId: string | null,
    args: Omit<Prisma.BudgetUpdateArgs, "where">,
  ): Promise<BudgetWithRelations | null> {
    const existing = await prisma.budget.findFirst({
      where: { id, spaceId },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.budget.update({
      ...args,
      include: budgetInclude,
      where: { id },
    });
  },

  async deleteInSpace(id: string, spaceId: string | null): Promise<boolean> {
    const result = await prisma.budget.deleteMany({
      where: { id, spaceId },
    });
    return result.count === 1;
  },
};
