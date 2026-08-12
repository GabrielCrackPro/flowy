import { prisma } from "@lib/prisma/client";
import type { Prisma } from "@prisma/client";
import { toDateOnlyDatabaseValue } from "@/lib/date-only";
import { NotFoundError } from "@/lib/errors/error-types";
import type {
  CreateSubscriptionInput,
  SubscriptionFilters,
  UpdateSubscriptionInput,
} from "@/types/Subscription";
import { ActivityService } from "./activities";
import { SpaceService } from "./spaces/space-service";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const SubscriptionService = {
  async list(userId: string, filters?: SubscriptionFilters) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const activeSpace = await SpaceService.getCurrent(userId);
    const where: Prisma.SubscriptionWhereInput = {
      spaceId: activeSpace?.id ?? null,
    };

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.billingCycle) {
      where.billingCycle = filters.billingCycle;
    }

    const [data, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: profileIdentity,
          },
          updatedByProfile: {
            select: profileIdentity,
          },
        },
        orderBy: {
          nextPayment: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async get(userId: string, id: string) {
    const activeSpace = await SpaceService.getCurrent(userId);
    return prisma.subscription.findFirst({
      where: {
        id,
        spaceId: activeSpace?.id ?? null,
      },
      include: {
        user: {
          select: profileIdentity,
        },
        updatedByProfile: {
          select: profileIdentity,
        },
      },
    });
  },

  async create(userId: string, data: CreateSubscriptionInput) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId: activeSpace?.id ?? null,
        merchant: data.merchant,
        amount: data.amount,
        billingCycle: data.billingCycle,
        nextPayment: toDateOnlyDatabaseValue(data.nextPayment),
        active: data.active ?? true,
      },
      include: {
        user: {
          select: profileIdentity,
        },
        updatedByProfile: {
          select: profileIdentity,
        },
      },
    });

    await ActivityService.record({
      userId,
      type: "subscription.created",
      entityType: "subscription",
      entityId: subscription.id,
      metadata: {
        merchant: subscription.merchant,
        amount: Number(subscription.amount),
      },
    });

    return subscription;
  },

  async update(userId: string, id: string, data: UpdateSubscriptionInput) {
    const subscription = await this.get(userId, id);

    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    const updatedSubscription = await prisma.subscription.update({
      where: {
        id,
      },
      data: {
        updatedBy: userId,
        merchant: data.merchant,
        amount: data.amount,
        billingCycle: data.billingCycle,
        nextPayment: toDateOnlyDatabaseValue(data.nextPayment),
        active: data.active,
      },
      include: {
        user: {
          select: profileIdentity,
        },
        updatedByProfile: {
          select: profileIdentity,
        },
      },
    });

    await ActivityService.record({
      userId,
      type: "subscription.updated",
      entityType: "subscription",
      entityId: subscription.id,
      metadata: {
        merchant: updatedSubscription.merchant,
        amount: Number(updatedSubscription.amount),
      },
    });

    return updatedSubscription;
  },

  async delete(userId: string, id: string) {
    const subscription = await this.get(userId, id);

    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    await prisma.subscription.delete({
      where: {
        id,
      },
    });

    await ActivityService.replaceEntityHistoryWithDeletion({
      userId,
      type: "subscription.deleted",
      entityType: "subscription",
      entityId: subscription.id,
      metadata: {
        merchant: subscription.merchant,
        amount: Number(subscription.amount),
      },
    });

    return {
      success: true,
    };
  },
};
