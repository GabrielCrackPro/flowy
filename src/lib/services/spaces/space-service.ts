import { prisma } from "@/lib/prisma/client";
import { ActivityService } from "../activities";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function buildJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const SpaceService = {
  async ensurePersonalSpace(userId: string) {
    const existing = await prisma.space.findFirst({
      where: {
        ownerId: userId,
        isPersonal: true,
      },
      include: { members: true },
    });

    if (existing) {
      if (!existing.members.some((member) => member.userId === userId)) {
        await prisma.spaceMember.create({
          data: {
            spaceId: existing.id,
            userId,
            role: "owner",
          },
        });
      }
      return existing;
    }

    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    const baseName = profile?.name?.trim() || "Mi espacio";

    const space = await prisma.space.create({
      data: {
        name: `${baseName}'s space`,
        slug: `${slugify(baseName)}-${Date.now()}`,
        joinCode: buildJoinCode(),
        ownerId: userId,
        isPersonal: true,
      },
    });

    await prisma.spaceMember.create({
      data: {
        spaceId: space.id,
        userId,
        role: "owner",
      },
    });

    return space;
  },

  async listForUser(userId: string) {
    return prisma.space.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ isPersonal: "asc" }, { createdAt: "asc" }],
    });
  },

  async create(userId: string, name: string, isPersonal = false) {
    const trimmedName = name?.trim() || "Nuevo espacio";

    const space = await prisma.space.create({
      data: {
        name: trimmedName,
        slug: `${slugify(trimmedName)}-${Date.now()}`,
        joinCode: buildJoinCode(),
        ownerId: userId,
        isPersonal,
      },
    });

    await prisma.spaceMember.create({
      data: {
        spaceId: space.id,
        userId,
        role: "owner",
      },
    });

    await prisma.profile.update({
      where: { id: userId },
      data: { activeSpaceId: space.id },
    });

    return space;
  },

  async join(userId: string, joinCode: string) {
    const normalizedCode = (joinCode ?? "").trim().toUpperCase();
    const space = await prisma.space.findFirst({
      where: { joinCode: normalizedCode },
    });

    if (!space) {
      throw new Error("Código de invitación no válido");
    }

    const membership = await prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId: space.id, userId } },
    });

    if (membership) {
      await prisma.profile.update({
        where: { id: userId },
        data: { activeSpaceId: space.id },
      });
      return space;
    }

    await prisma.spaceMember.create({
      data: {
        spaceId: space.id,
        userId,
        role: "member",
      },
    });

    await prisma.profile.update({
      where: { id: userId },
      data: { activeSpaceId: space.id },
    });

    return space;
  },

  async setActive(userId: string, spaceId: string) {
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId },
    });

    const isOwner = await prisma.space.findFirst({
      where: { id: spaceId, ownerId: userId },
    });

    if (!membership && !isOwner) {
      throw new Error("No tienes acceso a ese espacio");
    }

    const profile = await prisma.profile.update({
      where: { id: userId },
      data: { activeSpaceId: spaceId },
    });

    return profile.activeSpaceId;
  },

  async update(
    userId: string,
    spaceId: string,
    name: string,
    isPersonal?: boolean,
  ) {
    const trimmedName = name?.trim();

    if (!trimmedName) {
      throw new Error("El nombre del espacio no puede estar vacío");
    }

    const space = await prisma.space.findUnique({ where: { id: spaceId } });

    if (!space) {
      throw new Error("Espacio no encontrado");
    }

    if (space.ownerId !== userId) {
      throw new Error("No puedes editar este espacio");
    }

    // Check if changing from shared to personal with members
    if (isPersonal === true && !space.isPersonal) {
      const memberCount = await prisma.spaceMember.count({
        where: { spaceId, userId: { not: userId } },
      });

      if (memberCount > 0) {
        throw new Error(
          "No puedes convertir un espacio con miembros en personal. Elimina los miembros primero.",
        );
      }
    }

    return prisma.space.update({
      where: { id: spaceId },
      data: {
        name: trimmedName,
        ...(isPersonal !== undefined && { isPersonal }),
      },
    });
  },

  async leave(userId: string, spaceId: string) {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });

    if (!space) {
      throw new Error("Espacio no encontrado");
    }

    const membership = await prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId } },
    });

    if (!membership) {
      throw new Error("No perteneces a ese espacio");
    }

    const isOwner = space.ownerId === userId;

    if (isOwner) {
      const otherMembers = await prisma.spaceMember.count({
        where: { spaceId, userId: { not: userId } },
      });

      if (otherMembers > 0) {
        throw new Error(
          "No puedes salir de un espacio con más miembros. Transfiere la propiedad antes de salir.",
        );
      }
    }

    const remainingSpaces = await prisma.space.count({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (remainingSpaces <= 1) {
      throw new Error("Debes conservar al menos un espacio");
    }

    if (isOwner) {
      await prisma.space.delete({ where: { id: spaceId } });
    } else {
      await prisma.spaceMember.delete({ where: { id: membership.id } });
    }

    if (
      space.id ===
      (
        await prisma.profile.findUnique({
          where: { id: userId },
          select: { activeSpaceId: true },
        })
      )?.activeSpaceId
    ) {
      const fallbackSpace = await prisma.space.findFirst({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          id: { not: space.id },
        },
        orderBy: [{ isPersonal: "asc" }, { createdAt: "asc" }],
      });

      if (fallbackSpace) {
        await prisma.profile.update({
          where: { id: userId },
          data: { activeSpaceId: fallbackSpace.id },
        });
      }
    }

    return { success: true };
  },

  async delete(userId: string, spaceId: string) {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });

    if (!space) {
      throw new Error("Espacio no encontrado");
    }

    if (space.ownerId !== userId) {
      throw new Error("No autorizado");
    }

    const otherMembers = await prisma.spaceMember.count({
      where: { spaceId, userId: { not: userId } },
    });

    if (otherMembers > 0) {
      throw new Error("No puedes eliminar un espacio con más miembros");
    }

    const remainingSpaces = await prisma.space.count({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (remainingSpaces <= 1) {
      throw new Error("Debes conservar al menos un espacio");
    }

    await prisma.space.delete({ where: { id: spaceId } });

    return { success: true };
  },

  async removeMember(userId: string, spaceId: string, memberUserId: string) {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });

    if (!space) {
      throw new Error("Espacio no encontrado");
    }

    if (space.ownerId !== userId) {
      throw new Error("Solo el propietario puede eliminar miembros");
    }

    if (memberUserId === userId) {
      throw new Error("No puedes eliminarte a ti mismo");
    }

    const membership = await prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId: memberUserId } },
    });

    if (!membership) {
      throw new Error("El usuario no es miembro de este espacio");
    }

    await prisma.spaceMember.delete({ where: { id: membership.id } });

    // Create activity notification for the removed member
    const removerProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await ActivityService.record({
      userId: memberUserId,
      actorId: userId,
      type: "space.memberRemoved",
      entityType: "space",
      entityId: spaceId,
      metadata: {
        spaceName: space.name,
        actorName: removerProfile?.name ?? "Usuario",
      },
      skipSpaceFilter: true,
    });

    // Switch their active space if it was the removed space
    const memberProfile = await prisma.profile.findUnique({
      where: { id: memberUserId },
      select: { activeSpaceId: true },
    });

    if (memberProfile?.activeSpaceId === spaceId) {
      const fallbackSpace = await prisma.space.findFirst({
        where: {
          OR: [
            { ownerId: memberUserId },
            { members: { some: { userId: memberUserId } } },
          ],
          id: { not: spaceId },
        },
        orderBy: [{ isPersonal: "asc" }, { createdAt: "asc" }],
      });

      if (fallbackSpace) {
        await prisma.profile.update({
          where: { id: memberUserId },
          data: { activeSpaceId: fallbackSpace.id },
        });
      }
    }

    return { success: true };
  },

  async getCurrent(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        activeSpace: {
          include: {
            members: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    });

    const activeSpace = profile?.activeSpace;
    const isMember = activeSpace
      ? activeSpace.members.length > 0 || activeSpace.ownerId === userId
      : false;

    if (isMember) {
      return activeSpace;
    }

    const personalSpace = await SpaceService.ensurePersonalSpace(userId);

    if (!profile?.activeSpaceId || profile.activeSpaceId !== personalSpace.id) {
      await prisma.profile.update({
        where: { id: userId },
        data: { activeSpaceId: personalSpace.id },
      });
    }

    return personalSpace;
  },
};
