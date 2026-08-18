import { Prisma } from "@prisma/client";
import type { User } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma/client";
import type {
  UpdateProfileInput,
  UpdateThemeInput,
} from "@/lib/schemas/profile";
import { CategoryService } from "./categories";
import { SpaceService } from "./spaces/space-service";

function nullableJson(value: string[] | null | undefined) {
  if (value === undefined) return undefined;
  return value === null ? Prisma.DbNull : value;
}

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

  const deletedSpaceAvatarUrls: string[] = [];

  for (const space of spaces) {
    const isOwner = space.ownerId === userId;
    const otherMembers = space.members.filter((m) => m.userId !== userId);

    if (isOwner && !space.isPersonal && otherMembers.length > 0) {
      // Transfer shared spaces before auth.admin.deleteUser cascades the
      // deleted profile. Personal or empty spaces are intentionally left for
      // the database cascade after the auth deletion succeeds.
      await prisma.space.update({
        where: { id: space.id },
        data: { ownerId: otherMembers[0].userId },
      });
    } else if (space.avatarUrl) {
      // The space (personal, or shared with no other members) will be
      // cascade-deleted with the profile. Capture its avatar now so the
      // route can remove the storage file after the DB deletion succeeds.
      deletedSpaceAvatarUrls.push(space.avatarUrl);
    }
  }

  return deletedSpaceAvatarUrls;
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
        // Seed defaults for accounts created by the auth trigger (the
        // common path — `created` stays false here). The latch makes this
        // a no-op after the first successful seed.
        await CategoryService.seedDefaults(existing.id);

        // Every user must own a personal space that is active. The signup
        // trigger (migration 031) creates it atomically for new accounts;
        // this backfills accounts that predate it or where it failed.
        const personalSpace = await SpaceService.ensurePersonalSpace(
          existing.id,
        );
        const profile = existing.activeSpaceId
          ? existing
          : await prisma.profile.update({
              where: { id: existing.id },
              data: { activeSpaceId: personalSpace.id },
            });

        return { profile, created: false };
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

      await CategoryService.seedDefaults(profile.id);

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
        dashboardCards: nullableJson(
          (data as UpdateProfileInput).dashboardCards,
        ),
        dashboardOrder: nullableJson(
          (data as UpdateProfileInput).dashboardOrder,
        ),
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
      return { avatarUrl: null, receiptUrls: [], spaceAvatarUrls: [] };
    }

    const spaceAvatarUrls = await cleanupSpacesForAccountDeletion(userId);

    const receipts = await prisma.transaction.findMany({
      where: { userId },
      select: { receiptUrl: true },
    });

    // Keep all application rows until auth.admin.deleteUser succeeds. The
    // auth.users/profile foreign keys cascade the application data, while
    // retaining the profile makes a failed auth deletion fully retryable.
    return {
      avatarUrl: profile.avatarUrl,
      receiptUrls: receipts.flatMap((transaction) =>
        transaction.receiptUrl ? [transaction.receiptUrl] : [],
      ),
      spaceAvatarUrls,
    };
  },
};
