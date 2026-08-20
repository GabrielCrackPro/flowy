"use client";

import {
  SummaryMetricCard,
  SummaryMetricGrid,
} from "@/components/shared/summary-metric-card";
import { ArrowDownRight, ArrowUpRight, Wallet } from "@/lib/icons";

interface TransactionSummaryCardsProps {
  expenses: number;
  income: number;
  balance: number;
  loadingDone: boolean;
  locale: string;
  currency: string;
  t: (key: string) => string;
  formatCurrency: (amount: number, locale: string, currency: string) => string;
}

/**
 * Income / expenses / balance summary for the transactions page, built on the
 * shared `SummaryMetricCard` so all finance pages render the same metric cards.
 */
export function TransactionSummaryCards({
  expenses,
  income,
  balance,
  loadingDone,
  locale,
  currency,
  t,
  formatCurrency,
}: TransactionSummaryCardsProps) {
  const format = (value: number) =>
    loadingDone ? formatCurrency(value, locale, currency) : "-";

  return (
    <SummaryMetricGrid>
      <SummaryMetricCard
        label={t("transactions.expenses")}
        value={format(expenses)}
        icon={ArrowDownRight}
        tone="negative"
      />
      <SummaryMetricCard
        label={t("transactions.income")}
        value={format(income)}
        icon={ArrowUpRight}
        tone="positive"
      />
      <SummaryMetricCard
        label={t("transactions.balance")}
        value={format(balance)}
        icon={Wallet}
        tone={balance >= 0 ? "positive" : "negative"}
      />
    </SummaryMetricGrid>
  );
}
