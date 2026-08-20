"use client";

import { BackHeader } from "@components/dashboard";
import {
  ActionsColumn,
  type Column,
  ConfirmDialog,
  CustomColumn,
  DataTable,
  EmptyState,
  FinancePageShell,
  Icon,
  IconColumn,
  NumberColumn,
  PaymentMethodIcon,
  PendingSyncBadge,
  SelectColumn,
  TagsColumn,
  TextColumn,
  TransactionDetailModal,
} from "@components/shared";
import { Card } from "@components/ui";
import { useTransactionsPage } from "@hooks/useTransactionsPage";
import { cn, formatCurrency } from "@lib/utils";
import { PAYMENT_METHOD_KEY } from "@utils/constants";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  TransactionBulkActions,
  TransactionFilterToolbar,
  TransactionReceipts,
  TransactionSummaryCards,
} from "@/components";
import { CardSkeleton } from "@/components/shared";
import { parseDateOnly } from "@/lib/date-only";
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  ArrowUpDown,
  Calendar,
  Eye,
  Pencil,
  Repeat2,
  Trash2,
} from "@/lib/icons";
import { isPendingSync } from "@/lib/offline";

export default function TransactionsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    detailTx,
    deleteTx,
    bulkDeleteTx,
    bulkDeleting,
    selectedIds,
    lastRefreshedAt,
    filters,
    filterOpen,
    locale,
    currency,
    sorted,
    totals,
    loadingDone,
    allSelected,
    filterFields,
    setDetailTx,
    setDeleteTx,
    setBulkDeleteTx,
    setFilterOpen,
    handleFilterChange,
    handleClearFilters,
    handleRefresh,
    handleSelect,
    handleSelectAll,
    handleBulkDelete,
    formatFilterValue,
    handleRemoveChip,
    loading,
    update,
    remove,
    isDeleting,
  } = useTransactionsPage();

  const columns: Column<(typeof sorted)[number]>[] = useMemo(
    () => [
      SelectColumn({
        selectedIds,
        allSelected,
        onSelect: handleSelect,
        onSelectAll: () => handleSelectAll(sorted.map((tx) => tx.id)),
        getId: (tx) => tx.id,
        getLabel: (tx) => tx.description ?? t("common.transaction"),
        selectAllLabel: t("common.selectAll"),
      }),

      IconColumn({
        sortable: true,
        sortLabel: t("transactions.type"),
        sortValue: (tx) => tx.type,
        icon: (tx) =>
          tx.type === "INCOME" ? (
            <Icon icon={ArrowUpCircle} className="size-4.5" />
          ) : (
            <Icon icon={ArrowDownCircle} className="size-4.5" />
          ),
        className: (tx) =>
          cn(
            "flex size-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
            tx.type === "INCOME"
              ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400 shadow-sm shadow-emerald-500/20"
              : "bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400 shadow-sm shadow-rose-500/20",
          ),
      }),

      TextColumn({
        header: t("transactions.descriptionCol"),
        sortable: true,
        sortValue: (tx) => tx.description ?? "",
        value: (tx) => tx.description,
        emptyValue: t("transaction.noDescription"),
        className: "min-w-0",
        secondaryText: (tx) =>
          tx.date
            ? new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "short",
              }).format(parseDateOnly(tx.date) ?? new Date(tx.date))
            : "",
        secondaryClassName: "md:hidden",
      }),

      CustomColumn({
        header: null,
        cell: (tx) => (isPendingSync(tx) ? <PendingSyncBadge /> : null),
      }),

      CustomColumn({
        header: null,
        className: "w-10",
        cell: (tx) =>
          tx.isRecurring ? (
            <span className="flex items-center justify-center">
              <Icon
                icon={Repeat2}
                className="size-3.5 text-blue-500/70 dark:text-blue-400/60"
              />
            </span>
          ) : null,
      }),

      TagsColumn({
        header: t("transactions.category"),
        className: "hidden md:table-cell",
        sortable: true,
        sortValue: (tx) => tx.tags?.map((tag) => tag.name).join(", ") ?? "",
        getTags: (tx) => tx.tags,
      }),

      NumberColumn({
        header: t("transactions.amount"),
        className: "text-right tabular-nums",
        sortable: true,
        sortValue: (tx) =>
          typeof tx.amount === "number" ? tx.amount : Number(tx.amount) || 0,
        value: (tx) =>
          typeof tx.amount === "number" ? tx.amount : Number(tx.amount) || 0,
        formatter: (amount, tx) =>
          `${tx.type === "INCOME" ? "+" : "-"}${formatCurrency(
            amount,
            locale,
            currency,
          )}`,
        variant: (tx) => (tx.type === "INCOME" ? "success" : "danger"),
        secondary: (tx) =>
          tx.type === "INCOME"
            ? t("transactions.income")
            : t("transactions.expenses"),
      }),

      TextColumn({
        header: t("transactions.paymentMethod"),
        className: "hidden md:table-cell",
        sortable: true,
        sortValue: (tx) =>
          tx.paymentMethod
            ? t(PAYMENT_METHOD_KEY[tx.paymentMethod] ?? tx.paymentMethod)
            : "",
        value: (tx) =>
          tx.paymentMethod
            ? t(PAYMENT_METHOD_KEY[tx.paymentMethod] ?? tx.paymentMethod)
            : undefined,
        icon: (tx) =>
          tx.paymentMethod ? (
            <PaymentMethodIcon method={tx.paymentMethod} className="size-4" />
          ) : undefined,
        muted: true,
      }),

      TextColumn({
        header: t("transactions.date"),
        className: "hidden md:table-cell",
        sortable: true,
        sortValue: (tx) =>
          (parseDateOnly(tx.date) ?? new Date(tx.createdAt)).getTime(),
        value: (tx) =>
          tx.date
            ? new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(parseDateOnly(tx.date) ?? new Date(tx.date))
            : undefined,
        icon: (tx) =>
          tx.date ? <Icon icon={Calendar} className="size-4" /> : undefined,
        muted: true,
      }),

      ActionsColumn({
        ariaLabel: t("profile.actions"),
        actions: (tx) => [
          {
            label: t("transactions.viewDetails"),
            icon: <Icon icon={Eye} className="size-3.5" />,
            onClick: () => setDetailTx(tx),
          },
          {
            label: t("transactions.edit"),
            icon: <Icon icon={Pencil} className="size-3.5" />,
            onClick: () => router.push(`/dashboard/transactions/${tx.id}/edit`),
          },
          {
            separator: true,
          },
          {
            label: t("transactions.delete"),
            icon: <Icon icon={Trash2} className="size-3.5" />,
            variant: "destructive",
            onClick: () => setDeleteTx(tx),
          },
        ],
      }),
    ],
    [
      t,
      locale,
      currency,
      router,
      selectedIds,
      allSelected,
      handleSelect,
      handleSelectAll,
      setDetailTx,
      setDeleteTx,
      sorted,
    ],
  );

  return (
    <FinancePageShell>
      <BackHeader title={t("transactions.title")} href="/dashboard" />

      <TransactionSummaryCards
        expenses={totals.expenses}
        income={totals.income}
        balance={totals.balance}
        loadingDone={loadingDone}
        locale={locale}
        currency={currency}
        t={t}
        formatCurrency={formatCurrency}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {loading && !loadingDone ? (
          <CardSkeleton />
        ) : (
          <Card className="overflow-hidden">
            <div className="p-3 sm:p-4">
              <TransactionFilterToolbar
                filters={filters}
                filterOpen={filterOpen}
                filterFields={filterFields}
                t={t}
                transactionCount={sorted.length}
                transactions={sorted}
                loading={loading}
                lastRefreshedAt={lastRefreshedAt}
                locale={locale}
                currency={currency}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                onFilterOpenChange={setFilterOpen}
                onRefresh={handleRefresh}
                formatFilterValue={formatFilterValue}
                onRemoveChip={handleRemoveChip}
              />
            </div>

            <TransactionBulkActions
              selectedCount={selectedIds.size}
              deleting={bulkDeleting}
              onDelete={() => setBulkDeleteTx(true)}
              t={t}
            />

            <DataTable
              columns={columns}
              data={sorted}
              keyExtractor={(tx) => tx.id}
              loading={loading}
              pageSize={20}
              onRowClick={(tx) => setDetailTx(tx)}
              bare
              emptyState={
                <EmptyState
                  icon={<Icon icon={ArrowUpDown} size="lg" />}
                  title={t("transactions.empty")}
                  description={t("dashboard.noTransactionsDesc")}
                  iconClassName="from-blue-500/20 to-blue-500/10 text-blue-600 ring-blue-500/10 dark:from-blue-500/30 dark:to-blue-500/20 dark:text-blue-400"
                  action={
                    <Link
                      href="/dashboard/transactions/add"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {t("nav.newTransaction")}
                      <Icon icon={ArrowRight} className="size-3.5" />
                    </Link>
                  }
                />
              }
            />
          </Card>
        )}
      </motion.div>

      {loadingDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <TransactionReceipts
            transactions={sorted}
            locale={locale}
            currency={currency}
            t={t}
          />
        </motion.div>
      )}

      <TransactionDetailModal
        transaction={detailTx}
        tags={detailTx?.tags}
        locale={locale}
        currency={currency}
        onClose={() => setDetailTx(null)}
        onUpdate={update}
      />

      <ConfirmDialog
        open={!!deleteTx}
        onOpenChange={(open) => {
          if (!open) setDeleteTx(null);
        }}
        title={t("transactions.delete")}
        description={t("transactions.deleteConfirm")}
        confirmLabel={t("transactions.delete")}
        cancelLabel={t("transaction.cancel")}
        loading={isDeleting}
        closeOnConfirm={false}
        onConfirm={() => {
          if (deleteTx) {
            void remove(deleteTx.id).then(() => setDeleteTx(null));
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteTx}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteTx(false);
        }}
        title={`${t("transactions.delete")} (${selectedIds.size})`}
        description={t("transactions.deleteConfirmBulk", {
          count: selectedIds.size,
        })}
        confirmLabel={t("transactions.delete")}
        cancelLabel={t("transaction.cancel")}
        loading={bulkDeleting}
        closeOnConfirm={false}
        onConfirm={handleBulkDelete}
      />
    </FinancePageShell>
  );
}
