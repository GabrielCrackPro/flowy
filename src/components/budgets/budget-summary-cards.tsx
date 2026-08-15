"use client";

import { useTranslation } from "react-i18next";
import { SummaryMetricCard, SummaryMetricGrid } from "@/components/shared";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "@/lib/icons";
import { formatCurrency } from "@/lib/utils";
import type { Budget } from "@/types/Budget";

export function BudgetSummaryCards({
  budgets,
  locale,
  currency,
}: {
  budgets: Budget[];
  locale: string;
  currency: string;
}) {
  const { t } = useTranslation();
  const totals = budgets.reduce(
    (summary, budget) => ({
      budget: summary.budget + budget.budgetLimit,
      income: summary.income + (budget.income ?? 0),
      expenses: summary.expenses + (budget.expenses ?? 0),
    }),
    { budget: 0, income: 0, expenses: 0 },
  );

  return (
    <SummaryMetricGrid>
      <SummaryMetricCard
        label={t("budgets.totalBudget")}
        value={formatCurrency(totals.budget, locale, currency)}
        icon={Wallet}
        tone="info"
      />
      <SummaryMetricCard
        label={t("budgets.totalIncome")}
        value={formatCurrency(totals.income, locale, currency)}
        icon={ArrowDownCircle}
        tone="positive"
      />
      <SummaryMetricCard
        label={t("budgets.totalExpenses")}
        value={formatCurrency(totals.expenses, locale, currency)}
        icon={ArrowUpCircle}
        tone="negative"
      />
    </SummaryMetricGrid>
  );
}
