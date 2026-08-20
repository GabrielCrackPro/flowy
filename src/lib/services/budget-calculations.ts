interface ExpenseTransaction {
  amount: unknown;
  tags: Array<{ categoryId: string }>;
}

interface IncomeTransaction {
  amount: unknown;
  budgetId: string | null;
}

export function calculateBudgetTotals(
  categoryId: string,
  budgetId: string,
  expenses: readonly ExpenseTransaction[],
  income: readonly IncomeTransaction[],
) {
  const expenseTotal = expenses.reduce(
    (total, transaction) =>
      transaction.tags.some((tag) => tag.categoryId === categoryId)
        ? total + Number(transaction.amount)
        : total,
    0,
  );
  const incomeTotal = income.reduce(
    (total, transaction) =>
      transaction.budgetId === budgetId
        ? total + Number(transaction.amount)
        : total,
    0,
  );

  return {
    expenses: expenseTotal,
    income: incomeTotal,
    remaining: incomeTotal - expenseTotal,
  };
}
