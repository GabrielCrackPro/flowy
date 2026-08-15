"use client";

import { CategoryIconBadge } from "@components/categories/category-icon";
import { BackHeader } from "@components/dashboard";
import {
  ActionsColumn,
  buildFinanceListActionBar,
  type Column,
  ConfirmDialog,
  CustomColumn,
  DataExportMenu,
  EmptyState,
  EntityListView,
  FinancePageShell,
  GradientButton,
  Icon,
  NumberColumn,
  TextColumn,
  type ViewMode,
} from "@components/shared";
import { Badge, Button } from "@components/ui";
import { useCategoryApi } from "@hooks/api/useCategoryApi";
import { useTransactionApi } from "@hooks/api/useTransactionApi";
import { useProfile } from "@hooks/useProfile";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CategoryCard,
  CategoryCardSkeleton,
  CategoryFormSheet,
} from "@/components";
import { useCreateEntityFromQuery, useEntityFormModal } from "@/hooks";
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
  const { profile } = useProfile();
  const locale = profile?.locale ?? "es-ES";

  const {
    categories,
    loading,
    create,
    update,
    remove,
    refresh,
    isCreating,
    isUpdating,
  } = useCategoryApi();

  const { transactions: allTransactions } = useTransactionApi();

  const [filter, setFilter] = useState<TypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  // Keep the URL in sync so the list view is deep-linkable and survives
  // refreshes. Search writes are debounced to match the transactions page.
  const router = useRouter();
  const pathname = usePathname();
  const urlSyncInitialized = useRef(false);

  // Seed tab/search/view from the URL once, after mount, so the initial
  // render matches the server HTML (no hydration mismatch on deep links).
  const seededFromUrl = useRef(false);
  useEffect(() => {
    if (seededFromUrl.current) return;
    seededFromUrl.current = true;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlFilter = params.get("filter");
    if (urlFilter === "INCOME" || urlFilter === "EXPENSE") {
      setFilter(urlFilter);
    }
    const urlSearch = params.get("search");
    if (urlSearch) setSearchQuery(urlSearch);
    if (params.get("view") === "table") setView("table");
  }, []);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!urlSyncInitialized.current) {
      urlSyncInitialized.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("filter", filter);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (view !== "grid") params.set("view", view);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filter, debouncedSearch, view, pathname, router]);

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

  useCreateEntityFromQuery(openCreate);

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

  const exportTotals = useMemo(() => {
    const income = visible.filter(
      (category) => category.type === "INCOME",
    ).length;
    const expense = visible.filter(
      (category) => category.type === "EXPENSE",
    ).length;

    return [
      {
        label: t("categories.all"),
        value: new Intl.NumberFormat(locale).format(visible.length),
      },
      {
        label: t("transactions.income"),
        value: new Intl.NumberFormat(locale).format(income),
      },
      {
        label: t("transactions.expenses"),
        value: new Intl.NumberFormat(locale).format(expense),
      },
    ];
  }, [locale, t, visible]);

  const exportColumns = useMemo(
    () => [
      {
        key: "name",
        header: t("categories.nameLabel"),
        render: (category: Category) => category.name,
      },
      {
        key: "type",
        header: t("categories.typeLabel"),
        render: (category: Category) =>
          category.type === "INCOME"
            ? t("transactions.income")
            : t("transactions.expenses"),
      },
      {
        key: "color",
        header: t("categories.colorLabel"),
        render: (category: Category) => category.color ?? "—",
      },
    ],
    [t],
  );

  const filterAction = (
    <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-fit">
      <div className="inline-flex min-w-max items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(tab.value)}
            aria-pressed={filter === tab.value}
            className={cn(
              "min-h-10 gap-1.5 rounded-lg px-3",

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
    </div>
  );

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
        className: "hidden md:table-cell",
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
        ariaLabel: t("profile.actions"),
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
    <FinancePageShell>
      <BackHeader title={t("categories.title")} href="/dashboard" />

      <p className="text-sm text-muted-foreground">
        {t("categories.description")}
      </p>

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
        actionBar={buildFinanceListActionBar({
          filterAction,
          create: { label: t("categories.new"), onClick: openCreate },
          exportAction:
            visible.length > 0 ? (
              <DataExportMenu
                data={visible}
                columns={exportColumns}
                totals={exportTotals}
                summaryLabel={t("dashboard.financialSummary")}
                title={t("categories.title")}
                subtitle={t("categories.description")}
                filenamePrefix="categories"
                locale={locale}
              />
            ) : undefined,
          refresh: {
            onRefresh: refresh,
            refreshing: loading,
            label: t("dashboard.refresh"),
          },
        })}
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
        renderSkeletonCard={(index) => <CategoryCardSkeleton index={index} />}
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
    </FinancePageShell>
  );
}
