"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="grid gap-4 sm:grid-cols-3"
    >
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Icon icon={Wallet} className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("budgets.totalBudget")}
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(
                budgets.reduce((sum, b) => sum + b.budgetLimit, 0),
                locale,
                currency,
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Icon icon={ArrowDownCircle} className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("budgets.totalIncome")}
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(
                budgets.reduce((sum, b) => sum + (b.income ?? 0), 0),
                locale,
                currency,
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <Icon icon={ArrowUpCircle} className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("budgets.totalExpenses")}
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(
                budgets.reduce((sum, b) => sum + (b.expenses ?? 0), 0),
                locale,
                currency,
              )}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
