import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const categoryInclude = {
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.CategoryInclude;

type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: typeof categoryInclude;
}>;

export const CategoryRepository = {
  async updateInSpace(
    id: string,
    spaceId: string | null,
    args: Omit<Prisma.CategoryUpdateArgs, "where">,
  ): Promise<CategoryWithRelations | null> {
    const existing = await prisma.category.findFirst({
      where: { id, spaceId },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.category.update({
      ...args,
      include: categoryInclude,
      where: { id },
    });
  },

  async deleteInSpace(id: string, spaceId: string | null): Promise<boolean> {
    const result = await prisma.category.deleteMany({ where: { id, spaceId } });
    return result.count === 1;
  },
};
