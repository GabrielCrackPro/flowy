"use client";

import { resolveCategoryIcon } from "@components/categories/category-icons";
import { BackHeader } from "@components/dashboard";
import {
  ActionsColumn,
  type Column,
  ConfirmDialog,
  CustomColumn,
  EmptyState,
  EntityAudit,
  EntityListView,
  ErrorBoundary,
  GradientButton,
  Icon,
  NumberColumn,
  PageTransition,
  TextColumn,
  type ViewMode,
} from "@components/shared";
import { Button } from "@components/ui";
import { useBudgetApi } from "@hooks/api/useBudgetApi";
import { useCategoryApi } from "@hooks/api/useCategoryApi";
import { useProfile } from "@hooks/useProfile";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BudgetFormSheet } from "@/components/budgets/budget-form-dialog";
import { useEntityFormModal } from "@/hooks";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "@/lib/icons";
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/Budget";

export default function BudgetsPage() {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const { budgets, loading, create, update, remove, isCreating, isUpdating } =
    useBudgetApi();

  const { categories } = useCategoryApi();

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  const {
    formOpen,
    closeForm,
    editing,
    deleting,
    setDeleting,
    openCreate,
    openEdit,
    handleSubmit,
    handleDelete,
    isSubmitting,
  } = useEntityFormModal<Budget, CreateBudgetInput, UpdateBudgetInput>({
    create,
    update,
    remove,
    isCreating,
    isUpdating,
  });

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const visible = useMemo(() => {
    if (!searchQuery.trim()) return budgets;

    const query = searchQuery.toLowerCase();
    return budgets.filter((budget) => {
      if (budget.category?.name) {
        return budget.category.name.toLowerCase().includes(query);
      }
      return false;
    });
  }, [budgets, searchQuery]);

  const columns: Column<Budget>[] = useMemo(
    () => [
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
            onClick: () => openEdit(budget),
          },
          { separator: true },
          {
            label: t("budgets.delete"),
            icon: <Icon icon={Trash2} className="size-3.5" />,
            variant: "destructive",
            onClick: () => setDeleting(budget),
          },
        ],
      }),
    ],
    [t, locale, currency, openEdit, setDeleting],
  );

  return (
    <PageTransition>
      <ErrorBoundary>
        <div className="space-y-6">
          <BackHeader
            title={t("nav.budgets")}
            href="/dashboard"
            actions={
              <GradientButton onClick={openCreate}>
                <span className="hidden sm:inline">{t("budgets.new")}</span>
              </GradientButton>
            }
          />

          <p className="text-sm text-muted-foreground">
            {t("budgets.description")}
          </p>

          {budgets.length > 0 && (
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
          )}

          <EntityListView
            data={visible}
            columns={columns}
            loading={loading}
            keyExtractor={(budget) => budget.id}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchPlaceholder={t("budgets.searchPlaceholder")}
            view={view}
            onViewChange={setView}
            skeletonVariant="detail"
            emptyState={
              <EmptyState
                icon={<Icon icon={Wallet} className="size-5" />}
                title={t("budgets.emptyTitle")}
                description={t("budgets.emptyDesc")}
                action={
                  <GradientButton onClick={openCreate} size="sm">
                    {t("budgets.emptyAction")}
                  </GradientButton>
                }
              />
            }
            renderCard={(budget, index) => {
              const spent = budget.expenses ?? 0;
              const pct =
                budget.budgetLimit > 0
                  ? Math.min(
                      100,
                      Math.round((spent / budget.budgetLimit) * 100),
                    )
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
                      "relative rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5",
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
                              {budget.category?.name ??
                                t("budgets.noCategorySelected")}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {budget.month && budget.year
                                ? `${budget.month}/${budget.year}`
                                : t("budgets.recurring")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(budget)}
                          className="h-7 w-7"
                        >
                          <Icon icon={Pencil} className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleting(budget)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
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
                        <span className="text-muted-foreground">
                          {t("budgets.spent")}
                        </span>
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
                            (budget.remaining ?? budget.budgetLimit - spent) >=
                              0
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
            }}
          />
        </div>

        <BudgetFormSheet
          open={formOpen}
          onOpenChange={closeForm}
          budget={editing}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={categories}
        />

        <ConfirmDialog
          open={!!deleting}
          onOpenChange={() => setDeleting(null)}
          title={t("budgets.deleteTitle")}
          description={t("budgets.deleteDescription")}
          onConfirm={handleDelete}
        />
      </ErrorBoundary>
    </PageTransition>
  );
}
