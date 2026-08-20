import type { Prisma } from "@prisma/client";

export const profileIdentity = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.ProfileSelect;

export const transactionInclude = {
  tags: { include: { category: true } },
  budget: { include: { category: true } },
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.TransactionInclude;

export const budgetInclude = {
  category: true,
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.BudgetInclude;

export const goalInclude = {
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.GoalInclude;

export const subscriptionInclude = {
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.SubscriptionInclude;

export const categoryInclude = {
  user: { select: profileIdentity },
  updatedByProfile: { select: profileIdentity },
} satisfies Prisma.CategoryInclude;
