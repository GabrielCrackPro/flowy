import type { User } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma/client";
import type {
  UpdateProfileInput,
  UpdateThemeInput,
} from "@/lib/schemas/profile";
import { SpaceService } from "./spaces/space-service";
import { deleteAvatar, deleteReceipt } from "./storage";

function profileNameFromUser(user: User) {
  const metadata = user.user_metadata as { full_name?: string } | undefined;

  if (metadata?.full_name) {
    return metadata.full_name;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return null;
}

async function cleanupSpacesForAccountDeletion(userId: string) {
  const spaces = await prisma.space.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
        select: { userId: true },
      },
    },
  });

  for (const space of spaces) {
    const isOwner = space.ownerId === userId;
    const otherMembers = space.members.filter((m) => m.userId !== userId);

    if (isOwner) {
      if (space.isPersonal || otherMembers.length === 0) {
        await prisma.space.delete({ where: { id: space.id } });
      } else {
        await prisma.space.update({
          where: { id: space.id },
          data: { ownerId: otherMembers[0].userId },
        });
      }
    } else if (otherMembers.length === 0) {
      // Shared space whose only member is the deleted account: remove it so
      // it doesn't linger without members.
      await prisma.space.delete({ where: { id: space.id } });
    }
  }
}

export const ProfileService = {
  async getById(userId: string, id: string) {
    if (userId !== id) {
      throw new Error("Unauthorized");
    }

    try {
      return prisma.profile.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      throw error;
    }
  },

  async ensure(user: User) {
    try {
      const existing = await prisma.profile.findUnique({
        where: { id: user.id },
      });

      if (existing) {
        return { profile: existing, created: false };
      }

      const profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email ?? null,
          name: profileNameFromUser(user),
        },
      });

      const personalSpace = await SpaceService.ensurePersonalSpace(profile.id);
      await prisma.profile.update({
        where: { id: profile.id },
        data: { activeSpaceId: personalSpace.id },
      });

      return {
        profile: { ...profile, activeSpaceId: personalSpace.id },
        created: true,
      };
    } catch (error) {
      console.error("Profile creation error:", error);
      throw error;
    }
  },

  async update(
    userId: string,
    id: string,
    data: UpdateProfileInput | UpdateThemeInput,
  ) {
    if (userId !== id) {
      throw new Error("Unauthorized");
    }

    const profile = await prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new Error("Profile not found");
    }

    return prisma.profile.update({
      where: { id },
      data: {
        name: (data as UpdateProfileInput).name,
        avatarUrl: (data as UpdateProfileInput).avatarUrl,
        currency: (data as UpdateProfileInput).currency,
        locale: (data as UpdateProfileInput).locale,
        showLanguageSelector: (data as UpdateProfileInput).showLanguageSelector,
        dashboardCards:
          (data as UpdateProfileInput).dashboardCards === undefined
            ? undefined
            : (data as UpdateProfileInput).dashboardCards,
        primaryColor: (data as UpdateThemeInput).primaryColor,
        secondaryColor: (data as UpdateThemeInput).secondaryColor,
        accentColor: (data as UpdateThemeInput).accentColor,
      },
    });
  },

  async delete(userId: string, id: string) {
    if (userId !== id) {
      throw new Error("Unauthorized");
    }

    const profile = await prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new Error("Profile not found");
    }

    await cleanupSpacesForAccountDeletion(userId);

    await prisma.profile.delete({
      where: { id },
    });
  },

  async deleteAccount(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      return;
    }

    await cleanupSpacesForAccountDeletion(userId);

    const receipts = await prisma.transaction.findMany({
      where: { userId },
      select: { receiptUrl: true },
    });

    await prisma.profile.delete({
      where: { id: userId },
    });

    const cleanups: Promise<unknown>[] = [];

    if (profile.avatarUrl) {
      cleanups.push(deleteAvatar(profile.avatarUrl).catch(() => {}));
    }

    for (const transaction of receipts) {
      if (transaction.receiptUrl) {
        cleanups.push(deleteReceipt(transaction.receiptUrl).catch(() => {}));
      }
    }

    await Promise.all(cleanups);
  },
};
