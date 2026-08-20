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
import type { RequestContext } from "./request-context";
import { profileIdentity, subscriptionInclude } from "./selects";
import { SpaceService } from "./spaces/space-service";
import { SubscriptionRepository } from "./subscriptions/subscription-repository";

export const SubscriptionService = {
  async list(
    userId: string,
    filters?: SubscriptionFilters,
    context?: RequestContext,
  ) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const where: Prisma.SubscriptionWhereInput = { spaceId };

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.billingCycle) {
      where.billingCycle = filters.billingCycle;
    }

    const [data, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: subscriptionInclude,
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

  async get(userId: string, id: string, context?: RequestContext) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    return prisma.subscription.findFirst({
      where: { id, spaceId },
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

  async create(
    userId: string,
    data: CreateSubscriptionInput,
    context?: RequestContext,
  ) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId,
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

  async update(
    userId: string,
    id: string,
    data: UpdateSubscriptionInput,
    context?: RequestContext,
  ) {
    const subscription = await this.get(userId, id, context);

    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const updatedSubscription = await SubscriptionRepository.updateInSpace(
      id,
      spaceId,
      {
        data: {
          updatedBy: userId,
          merchant: data.merchant,
          amount: data.amount,
          billingCycle: data.billingCycle,
          nextPayment: toDateOnlyDatabaseValue(data.nextPayment),
          active: data.active,
        },
        include: subscriptionInclude,
      },
    );

    if (!updatedSubscription) {
      throw new NotFoundError("Subscription not found");
    }

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

  async delete(userId: string, id: string, context?: RequestContext) {
    const subscription = await this.get(userId, id, context);

    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const deleted = await SubscriptionRepository.deleteInSpace(id, spaceId);
    if (!deleted) {
      throw new NotFoundError("Subscription not found");
    }

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
