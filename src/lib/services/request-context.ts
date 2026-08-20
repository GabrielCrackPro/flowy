import { AuthorizationError, NotFoundError } from "@/lib/errors/error-types";
import { prisma } from "@/lib/prisma/client";
import { SpaceService } from "./spaces/space-service";

export interface RequestContext {
  userId: string;
  spaceId: string;
  spaceRole: string;
}

/** Resolve tenant membership once and pass this context through a use case. */
export async function createRequestContext(
  userId: string,
): Promise<RequestContext> {
  const space = await SpaceService.getCurrent(userId);
  if (!space) {
    throw new NotFoundError("Active space not found");
  }

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId: space.id, userId } },
    select: { role: true },
  });

  if (!membership && space.ownerId !== userId) {
    throw new AuthorizationError("You are not a member of the active space");
  }

  return {
    userId,
    spaceId: space.id,
    spaceRole: membership?.role ?? "owner",
  };
}
