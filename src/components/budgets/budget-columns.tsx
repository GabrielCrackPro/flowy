"use client";

import { resolveCategoryIcon } from "@/components/categories/category-icons";
import {
  ActionsColumn,
  type Column,
  CustomColumn,
  Icon,
  NumberColumn,
  TextColumn,
} from "@/components/shared";
import { Pencil, Trash2 } from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { Budget } from "@/types/Budget";

export function buildBudgetColumns({
  t,
  locale,
  currency,
  onEdit,
  onDelete,
}: {
  t: (key: string) => string;
  locale: string;
  currency: string;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}): Column<Budget>[] {
  return [
    TextColumn({
      header: t("budgets.categoryLabel"),
      sortable: true,
      sortValue: (budget) => budget.category?.name ?? "",
      value: (budget) => budget.category?.name,
      emptyValue: t("budgets.noCategorySelected"),
      icon: (budget) => {
        const color = budget.category?.color || "#6366f1";
        const CategoryIcon = resolveCategoryIcon(budget.category?.icon);
        return (
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            }}
          >
            <Icon icon={CategoryIcon} className="size-4" />
          </div>
        );
      },
    }),

    TextColumn({
      header: t("budgets.periodLabel"),
      sortable: true,
      sortValue: (budget) =>
        budget.month && budget.year ? `${budget.year}-${budget.month}` : "",
      value: (budget) =>
        budget.month && budget.year
          ? `${budget.month}/${budget.year}`
          : t("budgets.recurring"),
    }),

    NumberColumn({
      header: t("budgets.amountLabel"),
      sortable: true,
      value: (budget) => budget.budgetLimit,
      formatter: (value) => formatCurrency(value, locale, currency),
    }),

    NumberColumn({
      header: t("budgets.income"),
      sortable: true,
      value: (budget) => budget.income ?? 0,
      formatter: (value) => formatCurrency(value, locale, currency),
      variant: "success",
    }),

    NumberColumn({
      header: t("budgets.expenses"),
      sortable: true,
      value: (budget) => budget.expenses ?? 0,
      formatter: (value) => formatCurrency(value, locale, currency),
      variant: "danger",
    }),

    NumberColumn({
      header: t("budgets.remaining"),
      sortable: true,
      value: (budget) =>
        budget.remaining ?? budget.budgetLimit - (budget.expenses ?? 0),
      formatter: (value) => formatCurrency(value, locale, currency),
      variant: (budget) =>
        (budget.remaining ?? budget.budgetLimit - (budget.expenses ?? 0)) >= 0
          ? "success"
          : "danger",
    }),

    CustomColumn({
      header: "%",
      className: "hidden md:table-cell",
      sortable: true,
      sortValue: (budget) =>
        budget.budgetLimit > 0
          ? (budget.expenses ?? 0) / budget.budgetLimit
          : 0,
      cell: (budget) => {
        const spent = budget.expenses ?? 0;
        const pct =
          budget.budgetLimit > 0
            ? Math.min(100, Math.round((spent / budget.budgetLimit) * 100))
            : 0;
        const overBudget = spent > budget.budgetLimit;
        const isNearLimit = pct >= 80 && !overBudget;

        return (
          <div className="flex items-center justify-end gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/50">
              <div
                className={cn(
                  "h-full rounded-full",
                  overBudget
                    ? "bg-red-500"
                    : isNearLimit
                      ? "bg-amber-500"
                      : "bg-emerald-500",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                overBudget
                  ? "text-red-600 dark:text-red-400"
                  : isNearLimit
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {pct}%
            </span>
          </div>
        );
      },
    }),

    ActionsColumn({
      actions: (budget) => [
        {
          label: t("budgets.edit"),
          icon: <Icon icon={Pencil} className="size-3.5" />,
          onClick: () => onEdit(budget),
        },
        { separator: true },
        {
          label: t("budgets.delete"),
          icon: <Icon icon={Trash2} className="size-3.5" />,
          variant: "destructive",
          onClick: () => onDelete(budget),
        },
      ],
    }),
  ];
}
