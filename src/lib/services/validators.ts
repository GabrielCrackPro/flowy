import { DomainError } from "@/lib/errors/error-types";
import { prisma } from "@/lib/prisma/client";
import { SpaceService } from "./spaces/space-service";

export async function ensureUserCategory(userId: string, categoryId: string) {
  const activeSpace = await SpaceService.getCurrent(userId);
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      spaceId: activeSpace?.id ?? null,
    },
  });

  if (!category) {
    throw new DomainError(
      "category.outside_active_space",
      "The category does not belong to the active space",
      400,
    );
  }

  return category;
}
