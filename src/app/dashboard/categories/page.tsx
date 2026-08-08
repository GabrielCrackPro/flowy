"use client";

import { CategoryIconBadge } from "@components/categories/category-icon";
import { BackHeader } from "@components/dashboard";
import {
  ActionsColumn,
  type Column,
  ConfirmDialog,
  CustomColumn,
  EmptyState,
  EntityListView,
  ErrorBoundary,
  GradientButton,
  Icon,
  NumberColumn,
  PageTransition,
  TextColumn,
  type ViewMode,
} from "@components/shared";
import { Badge, Button } from "@components/ui";
import { useCategoryApi } from "@hooks/api/useCategoryApi";
import { useTransactionApi } from "@hooks/api/useTransactionApi";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CategoryCard,
  CategoryCardSkeleton,
  CategoryFormSheet,
} from "@/components";
import { useEntityFormModal } from "@/hooks";
import { Pencil, Tags, Trash2, X } from "@/lib/icons";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/Category";

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

const FILTER_TABS: {
  value: TypeFilter;
  labelKey: string;
  countKey: "all" | "income" | "expense";
}[] = [
  { value: "ALL", labelKey: "categories.all", countKey: "all" },
  { value: "EXPENSE", labelKey: "transactions.expenses", countKey: "expense" },
  { value: "INCOME", labelKey: "transactions.income", countKey: "income" },
];

export default function CategoriesPage() {
  const { t } = useTranslation();

  const {
    categories,
    loading,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
  } = useCategoryApi();

  const { transactions: allTransactions } = useTransactionApi();

  const [filter, setFilter] = useState<TypeFilter>("ALL");
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
  } = useEntityFormModal<Category, CreateCategoryInput, UpdateCategoryInput>({
    create,
    update,
    remove,
    isCreating,
    isUpdating,
  });

  const counts = useMemo(
    () => ({
      all: categories.length,
      income: categories.filter((category) => category.type === "INCOME")
        .length,
      expense: categories.filter((category) => category.type === "EXPENSE")
        .length,
    }),
    [categories],
  );

  const categoryTransactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTransactions.forEach((transaction) => {
      transaction.tags?.forEach((tag) => {
        counts[tag.id] = (counts[tag.id] || 0) + 1;
      });
    });
    return counts;
  }, [allTransactions]);

  const visible = useMemo(() => {
    let filtered =
      filter === "ALL"
        ? categories
        : categories.filter((category) => category.type === filter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((category) =>
        category.name.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [categories, filter, searchQuery]);

  const columns: Column<Category>[] = useMemo(
    () => [
      TextColumn({
        header: t("categories.nameLabel"),
        sortable: true,
        sortValue: (category) => category.name,
        value: (category) => category.name,
        icon: (category) => (
          <CategoryIconBadge icon={category.icon} color={category.color} />
        ),
      }),

      CustomColumn({
        header: t("categories.typeLabel"),
        className: "hidden sm:table-cell",
        sortable: true,
        sortValue: (category) => category.type ?? "",
        cell: (category) =>
          category.type ? (
            <Badge
              variant={category.type === "INCOME" ? "default" : "outline"}
              className={cn(
                category.type === "INCOME" &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {t(
                category.type === "INCOME"
                  ? "transactions.income"
                  : "transactions.expenses",
              )}
            </Badge>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          ),
      }),

      NumberColumn({
        header: t("transactions.title"),
        sortable: true,
        sortValue: (category) => categoryTransactionCounts[category.id] || 0,
        value: (category) => categoryTransactionCounts[category.id] || 0,
      }),

      ActionsColumn({
        actions: (category) => [
          {
            label: t("categories.edit"),
            icon: <Icon icon={Pencil} className="size-3.5" />,
            onClick: () => openEdit(category),
          },
          { separator: true },
          {
            label: t("categories.delete"),
            icon: <Icon icon={Trash2} className="size-3.5" />,
            variant: "destructive",
            onClick: () => setDeleting(category),
          },
        ],
      }),
    ],
    [t, categoryTransactionCounts, openEdit, setDeleting],
  );

  return (
    <PageTransition>
      <ErrorBoundary>
        <div className="space-y-6">
          <BackHeader
            title={t("categories.title")}
            href="/dashboard"
            actions={
              <GradientButton onClick={openCreate}>
                <span className="hidden sm:inline">{t("categories.new")}</span>
              </GradientButton>
            }
          />

          <p className="text-sm text-muted-foreground">
            {t("categories.description")}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-card p-1">
              {FILTER_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={filter === tab.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(tab.value)}
                  className={cn(
                    "gap-1.5",
                    filter === tab.value
                      ? "shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(tab.labelKey)}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      filter === tab.value
                        ? "bg-primary-foreground/20"
                        : "bg-muted/70",
                    )}
                  >
                    {counts[tab.countKey]}
                  </span>
                </Button>
              ))}
            </div>
          </motion.div>

          <EntityListView
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchPlaceholder={t("categories.searchPlaceholder")}
            view={view}
            onViewChange={setView}
            loading={loading}
            columns={columns}
            data={visible}
            keyExtractor={(category) => category.id}
            gridClassName="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            emptyState={
              <EmptyState
                icon={
                  filter === "ALL" ? (
                    <Icon icon={Tags} className="size-5" />
                  ) : (
                    <Icon icon={X} className="size-5" />
                  )
                }
                title={
                  filter === "ALL"
                    ? t("categories.emptyTitle")
                    : t("categories.emptyFilterTitle")
                }
                description={
                  filter === "ALL"
                    ? t("categories.emptyDesc")
                    : t("categories.emptyFilterDesc")
                }
                action={
                  filter === "ALL" ? (
                    <GradientButton onClick={openCreate} size="sm">
                      {t("categories.emptyAction")}
                    </GradientButton>
                  ) : undefined
                }
              />
            }
            renderCard={(category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <CategoryCard
                  category={category}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                  transactionCount={categoryTransactionCounts[category.id] || 0}
                />
              </motion.div>
            )}
            renderSkeletonCard={(index) => (
              <CategoryCardSkeleton index={index} />
            )}
          />

          <CategoryFormSheet
            open={formOpen}
            onOpenChange={closeForm}
            category={editing}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          <ConfirmDialog
            open={!!deleting}
            onOpenChange={(open) => {
              if (!open) setDeleting(null);
            }}
            title={t("categories.delete")}
            description={t("categories.deleteConfirm")}
            confirmLabel={t("categories.delete")}
            cancelLabel={t("transaction.cancel")}
            onConfirm={handleDelete}
          />
        </div>
      </ErrorBoundary>
    </PageTransition>
  );
}
