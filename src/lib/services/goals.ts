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
import { GoalRepository } from "./goals/goal-repository";
import type { RequestContext } from "./request-context";
import { goalInclude } from "./selects";
import { SpaceService } from "./spaces/space-service";

type GoalResult = Prisma.GoalGetPayload<{ include: typeof goalInclude }>;

/**
 * Prisma Decimal fields (savedAmount/targetAmount) serialize to strings in
 * JSON, but the client contract says number. Normalize so arithmetic on the
 * client (e.g. quick-add savings) never string-concatenates.
 */
function serializeGoal(goal: GoalResult) {
  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    savedAmount: Number(goal.savedAmount),
  };
}

export const GoalService = {
  async list(userId: string, filters?: GoalFilters, context?: RequestContext) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = filters?.completed === undefined ? (page - 1) * limit : 0;

    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const where: Prisma.GoalWhereInput = { spaceId };

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        include: goalInclude,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: filters?.completed === undefined ? limit : undefined,
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

    const filteredTotal =
      filters?.completed === undefined ? total : filteredGoals.length;
    const pagedGoals =
      filters?.completed === undefined
        ? filteredGoals
        : filteredGoals.slice((page - 1) * limit, page * limit);

    return {
      data: pagedGoals.map(serializeGoal),
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.ceil(filteredTotal / limit),
    };
  },

  async get(userId: string, id: string, context?: RequestContext) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const goal = await prisma.goal.findFirst({
      where: { id, spaceId },
      include: goalInclude,
    });
    return goal ? serializeGoal(goal) : null;
  },

  async create(
    userId: string,
    data: CreateGoalInput,
    context?: RequestContext,
  ) {
    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const goal = await prisma.goal.create({
      data: {
        userId,
        updatedBy: userId,
        spaceId,
        title: data.title,
        targetAmount: data.targetAmount,
        savedAmount: data.savedAmount ?? 0,
        deadline: toDateOnlyDatabaseValue(data.deadline) ?? null,
      },
      include: goalInclude,
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

    return serializeGoal(goal);
  },

  async update(
    userId: string,
    id: string,
    data: UpdateGoalInput,
    context?: RequestContext,
  ) {
    const goal = await this.get(userId, id, context);

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

    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const updatedGoal = await GoalRepository.updateInSpace(id, spaceId, {
      data: updateData,
      include: goalInclude,
    });

    if (!updatedGoal) {
      throw new NotFoundError("Goal not found");
    }

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

    return serializeGoal(updatedGoal);
  },

  async delete(userId: string, id: string, context?: RequestContext) {
    const goal = await this.get(userId, id, context);

    if (!goal) {
      throw new NotFoundError("Goal not found");
    }

    const spaceId =
      context?.spaceId ?? (await SpaceService.getCurrent(userId))?.id ?? null;
    const deleted = await GoalRepository.deleteInSpace(id, spaceId);
    if (!deleted) {
      throw new NotFoundError("Goal not found");
    }

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
