"use client";

import {
  BudgetCard,
  BudgetCardSkeleton,
  BudgetFormSheet,
  BudgetSummaryCards,
  buildBudgetColumns,
} from "@components/budgets";
import { BackHeader } from "@components/dashboard";
import {
  buildFinanceListActionBar,
  type Column,
  ConfirmDialog,
  DataExportMenu,
  EmptyState,
  EntityListView,
  FinancePageShell,
  GradientButton,
  Icon,
  type ViewMode,
} from "@components/shared";
import { useBudgetApi } from "@hooks/api/useBudgetApi";
import { useCategoryApi } from "@hooks/api/useCategoryApi";
import { useProfile } from "@hooks/useProfile";
import { formatCurrency } from "@lib/utils";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateEntityFromQuery, useEntityFormModal } from "@/hooks";
import { Wallet } from "@/lib/icons";
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/Budget";

export default function BudgetsPage() {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const {
    budgets,
    loading,
    create,
    update,
    remove,
    refresh,
    isCreating,
    isUpdating,
  } = useBudgetApi();

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

  useCreateEntityFromQuery(openCreate);

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
    () =>
      buildBudgetColumns({
        t,
        locale,
        currency,
        onEdit: openEdit,
        onDelete: setDeleting,
      }),
    [t, locale, currency, openEdit, setDeleting],
  );

  const exportTotals = useMemo(() => {
    const budgeted = visible.reduce(
      (sum, budget) => sum + budget.budgetLimit,
      0,
    );
    const spent = visible.reduce(
      (sum, budget) => sum + (budget.expenses ?? 0),
      0,
    );
    const remaining = visible.reduce(
      (sum, budget) =>
        sum + (budget.remaining ?? budget.budgetLimit - (budget.expenses ?? 0)),
      0,
    );

    return [
      {
        label: t("budgets.amountLabel"),
        value: formatCurrency(budgeted, locale, currency),
      },
      {
        label: t("budgets.spent"),
        value: formatCurrency(spent, locale, currency),
      },
      {
        label: t("budgets.remaining"),
        value: formatCurrency(remaining, locale, currency),
      },
    ];
  }, [currency, locale, t, visible]);

  const exportColumns = useMemo(
    () => [
      {
        key: "category",
        header: t("budgets.categoryLabel"),
        render: (budget: Budget) =>
          budget.category?.name ?? t("budgets.noCategorySelected"),
      },
      {
        key: "limit",
        header: t("budgets.amountLabel"),
        render: (budget: Budget) =>
          formatCurrency(budget.budgetLimit, locale, currency),
      },
      {
        key: "spent",
        header: t("budgets.spent"),
        render: (budget: Budget) =>
          formatCurrency(budget.expenses ?? 0, locale, currency),
      },
      {
        key: "remaining",
        header: t("budgets.remaining"),
        render: (budget: Budget) =>
          formatCurrency(
            budget.remaining ?? budget.budgetLimit - (budget.expenses ?? 0),
            locale,
            currency,
          ),
      },
    ],
    [currency, locale, t],
  );

  return (
    <FinancePageShell>
      <BackHeader title={t("nav.budgets")} href="/dashboard" />

      <p className="text-sm text-muted-foreground">
        {t("budgets.description")}
      </p>

      {budgets.length > 0 && (
        <BudgetSummaryCards
          budgets={budgets}
          locale={locale}
          currency={currency}
        />
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
        actionBar={buildFinanceListActionBar({
          create: { label: t("budgets.new"), onClick: openCreate },
          exportAction:
            visible.length > 0 ? (
              <DataExportMenu
                data={visible}
                columns={exportColumns}
                totals={exportTotals}
                summaryLabel={t("dashboard.financialSummary")}
                title={t("nav.budgets")}
                subtitle={t("budgets.description")}
                filenamePrefix="budgets"
                locale={locale}
              />
            ) : undefined,
          refresh: {
            onRefresh: refresh,
            refreshing: loading,
            label: t("dashboard.refresh"),
          },
        })}
        renderSkeletonCard={(index) => <BudgetCardSkeleton index={index} />}
        renderCard={(budget, index) => (
          <BudgetCard
            budget={budget}
            index={index}
            locale={locale}
            currency={currency}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}
      />

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
    </FinancePageShell>
  );
}
