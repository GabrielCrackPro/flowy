import type { Prisma } from "@prisma/client";
import { toDateOnlyDatabaseValue } from "@/lib/date-only";
import { NotFoundError } from "@/lib/errors/error-types";
import { prisma } from "@/lib/prisma/client";
import type {
  CreateGoalInput,
  GoalFilters,
  UpdateGoalInput,
} from "@/types/Goal";
import { ActivityService } from "./activities";
import { SpaceService } from "./spaces/space-service";

const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const GoalService = {
  async list(userId: string, filters?: GoalFilters) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const activeSpace = await SpaceService.getCurrent(userId);
    const where: Prisma.GoalWhereInput = {
      spaceId: activeSpace?.id ?? null,
    };

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
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
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.goal.count({ where }),
    ]);

    let filteredGoals = goals;

    if (filters?.completed !== undefined) {
      const isCompleted = (goal: (typeof goals)[number]) =>
        Number(goal.savedAmount) >= Number(goal.targetAmount);

      if (filters.completed) {
        filteredGoals = goals.filter(isCompleted);
      } else {
        filteredGoals = goals.filter((goal) => !isCompleted(goal));
      }
    }

    return {
      data: filteredGoals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async get(userId: string, id: string) {
    const activeSpace = await SpaceService.getCurrent(userId);
    return prisma.goal.findFirst({
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

  async create(userId: string, data: CreateGoalInput) {
    const activeSpace = await SpaceService.getCurrent(userId);
    const goal = await prisma.goal.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId: activeSpace?.id ?? null,
        title: data.title,
        targetAmount: data.targetAmount,
        savedAmount: data.savedAmount ?? 0,
        deadline: toDateOnlyDatabaseValue(data.deadline) ?? null,
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
      type: "goal.created",
      entityType: "goal",
      entityId: goal.id,
      metadata: {
        title: goal.title,
        targetAmount: Number(goal.targetAmount),
      },
    });

    return goal;
  },

  async update(userId: string, id: string, data: UpdateGoalInput) {
    const goal = await this.get(userId, id);

    if (!goal) {
      throw new NotFoundError("Goal not found");
    }

    const updateData: Prisma.GoalUpdateInput = {
      updatedBy: userId,
    } as Prisma.GoalUpdateInput;

    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.targetAmount !== undefined) {
      updateData.targetAmount = data.targetAmount;
    }
    if (data.savedAmount !== undefined) {
      updateData.savedAmount = data.savedAmount;
    }
    if (data.deadline !== undefined) {
      updateData.deadline = toDateOnlyDatabaseValue(data.deadline);
    }

    const updatedGoal = await prisma.goal.update({
      where: {
        id,
      },
      data: updateData,
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
      type: "goal.updated",
      entityType: "goal",
      entityId: goal.id,
      metadata: {
        title: updatedGoal.title,
        targetAmount: Number(updatedGoal.targetAmount),
      },
    });

    return updatedGoal;
  },

  async delete(userId: string, id: string) {
    const goal = await this.get(userId, id);

    if (!goal) {
      throw new NotFoundError("Goal not found");
    }

    await prisma.goal.delete({
      where: {
        id,
      },
    });

    await ActivityService.replaceEntityHistoryWithDeletion({
      userId,
      type: "goal.deleted",
      entityType: "goal",
      entityId: goal.id,
      metadata: {
        title: goal.title,
        targetAmount: Number(goal.targetAmount),
      },
    });

    return {
      success: true,
    };
  },
};
