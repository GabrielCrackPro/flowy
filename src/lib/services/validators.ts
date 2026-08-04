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
    throw new Error("La categoría no pertenece a este espacio");
  }

  return category;
}
