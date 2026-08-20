import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export interface BudgetAggregate {
  budgetId: string;
  expenses: number;
  income: number;
  remaining: number;
}

export async function getBudgetAggregates(params: {
  spaceId: string | null;
  start: Date;
  end: Date;
  budgetIds: readonly string[];
}): Promise<Map<string, BudgetAggregate>> {
  if (params.budgetIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<
    Array<{
      budget_id: string;
      expenses: Prisma.Decimal;
      income: Prisma.Decimal;
    }>
  >`
    SELECT
      b.id AS budget_id,
      COALESCE(SUM(CASE
        WHEN t.type = 'EXPENSE' AND tc.category_id = b.category_id
        THEN t.amount ELSE 0 END), 0) AS expenses,
      COALESCE(SUM(CASE
        WHEN t.type = 'INCOME' AND t.budget_id = b.id
        THEN t.amount ELSE 0 END), 0) AS income
    FROM budgets b
    LEFT JOIN transactions t
      ON t.space_id::text IS NOT DISTINCT FROM ${params.spaceId}
      AND t.date >= ${params.start}
      AND t.date < ${params.end}
    LEFT JOIN transaction_categories tc ON tc.transaction_id = t.id
    WHERE b.space_id::text IS NOT DISTINCT FROM ${params.spaceId}
      AND b.id::text IN (${Prisma.join(params.budgetIds)})
    GROUP BY b.id
  `;

  return new Map(
    rows.map((row) => {
      const expenses = Number(row.expenses);
      const income = Number(row.income);
      return [
        row.budget_id,
        {
          budgetId: row.budget_id,
          expenses,
          income,
          remaining: income - expenses,
        },
      ];
    }),
  );
}
