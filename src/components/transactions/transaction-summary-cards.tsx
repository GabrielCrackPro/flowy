"use client";

import { motion } from "framer-motion";
import { TransactionCard } from "@/components";

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
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  const transactionCards = [
    {
      type: "negative" as const,
      label: t("transactions.expenses"),
      value: loadingDone ? formatCurrency(expenses, locale, currency) : "-",
    },
    {
      type: "positive" as const,
      label: t("transactions.income"),
      value: loadingDone ? formatCurrency(income, locale, currency) : "-",
    },
    {
      type: balance >= 0 ? ("positive" as const) : ("negative" as const),
      label: t("transactions.balance"),
      value: loadingDone ? formatCurrency(balance, locale, currency) : "-",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {transactionCards.map((card) => (
        <motion.div key={card.label} variants={cardVariants}>
          <TransactionCard
            type={card.type}
            label={card.label}
            value={card.value}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
