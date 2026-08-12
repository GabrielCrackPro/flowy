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
  type Column,
  ConfirmDialog,
  EmptyState,
  EntityListView,
  ErrorBoundary,
  GradientButton,
  Icon,
  PageTransition,
  type ViewMode,
} from "@components/shared";
import { useBudgetApi } from "@hooks/api/useBudgetApi";
import { useCategoryApi } from "@hooks/api/useCategoryApi";
import { useProfile } from "@hooks/useProfile";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEntityFormModal } from "@/hooks";
import { Wallet } from "@/lib/icons";
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

  return (
    <PageTransition>
      <ErrorBoundary>
        <div className="space-y-6">
          <BackHeader
            title={t("nav.budgets")}
            href="/dashboard"
            actions={
              <GradientButton onClick={openCreate} fullWidth={false}>
                <span className="hidden sm:inline">{t("budgets.new")}</span>
              </GradientButton>
            }
          />

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
