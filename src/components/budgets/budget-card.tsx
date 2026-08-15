"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { resolveCategoryIcon } from "@/components/categories/category-icons";
import { Icon, PendingSyncBadge } from "@/components/shared";
import { Button } from "@/components/ui";
import { Pencil, Trash2 } from "@/lib/icons";
import { isPendingSync } from "@/lib/offline";
import { cn, formatCurrency } from "@/lib/utils";
import type { Budget } from "@/types/Budget";

export function BudgetCard({
  budget,
  index,
  locale,
  currency,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  index: number;
  locale: string;
  currency: string;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}) {
  const { t } = useTranslation();

  const spent = budget.expenses ?? 0;
  const pct =
    budget.budgetLimit > 0
      ? Math.min(100, Math.round((spent / budget.budgetLimit) * 100))
      : 0;
  const overBudget = spent > budget.budgetLimit;
  const isNearLimit = pct >= 80 && !overBudget;
  const categoryColor = budget.category?.color || "#6366f1";

  return (
    <motion.div
      key={budget.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <div
        className={cn(
          "relative rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-0.5",
          overBudget
            ? "border-red-500/30 from-red-500/5 to-red-500/0"
            : isNearLimit
              ? "border-amber-500/30 from-amber-500/5 to-amber-500/0"
              : "border-border/40 from-card to-card/50",
        )}
        style={{
          ...(overBudget || isNearLimit
            ? {}
            : {
                background: `linear-gradient(135deg, ${categoryColor}08 0%, ${categoryColor}02 100%)`,
              }),
        }}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex size-9 items-center justify-center rounded-xl text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`,
                }}
              >
                <Icon
                  icon={resolveCategoryIcon(budget.category?.icon)}
                  className="size-4"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">
                  {budget.category?.name ?? t("budgets.noCategorySelected")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {budget.month && budget.year
                    ? `${budget.month}/${budget.year}`
                    : t("budgets.recurring")}
                </p>
                {isPendingSync(budget) && (
                  <PendingSyncBadge className="mt-1.5" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(budget)}
              aria-label={t("common.edit")}
              title={t("common.edit")}
              className="size-7"
            >
              <Icon icon={Pencil} className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(budget)}
              aria-label={t("common.delete")}
              title={t("common.delete")}
              className="size-7 text-destructive hover:text-destructive"
            >
              <Icon icon={Trash2} className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("budgets.amountLabel")}
            </span>
            <span className="font-semibold">
              {formatCurrency(budget.budgetLimit, locale, currency)}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={cn(
                "h-full rounded-full",
                overBudget
                  ? "bg-red-500"
                  : isNearLimit
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("budgets.spent")}</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                overBudget
                  ? "text-red-600 dark:text-red-400"
                  : isNearLimit
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {formatCurrency(spent, locale, currency)} ({pct}%)
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("budgets.remaining")}
            </span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                (budget.remaining ?? budget.budgetLimit - spent) >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {formatCurrency(
                budget.remaining ?? budget.budgetLimit - spent,
                locale,
                currency,
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
