"use client";

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
  SummaryMetricCard,
  SummaryMetricGrid,
  TextColumn,
  type ViewMode,
} from "@components/shared";
import { Badge } from "@components/ui";
import { useSubscriptionApi } from "@hooks/api/useSubscriptionApi";
import { useProfile } from "@hooks/useProfile";
import { cn, formatCurrency } from "@lib/utils";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SubscriptionCard,
  SubscriptionCardSkeleton,
} from "@/components/subscriptions/subscription-card";
import { SubscriptionFormSheet } from "@/components/subscriptions/subscription-form-dialog";
import { useCreateEntityFromQuery, useEntityFormModal } from "@/hooks";
import { parseDateOnly } from "@/lib/date-only";
import {
  Calendar,
  CreditCard,
  Pencil,
  Repeat2,
  Trash2,
  Wallet,
} from "@/lib/icons";
import type {
  CreateSubscriptionInput,
  Subscription,
  UpdateSubscriptionInput,
} from "@/types/Subscription";
import {
  subscriptionAmount,
  subscriptionMonthlyEquivalent,
} from "@/utils/subscriptions";

export default function SubscriptionsPage() {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const {
    subscriptions,
    loading,
    create,
    update,
    remove,
    refresh,
    isCreating,
    isUpdating,
  } = useSubscriptionApi();

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [quickAddSubscription, setQuickAddSubscription] =
    useState<Subscription | null>(null);

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
  } = useEntityFormModal<
    Subscription,
    CreateSubscriptionInput,
    UpdateSubscriptionInput
  >({
    create,
    update,
    remove,
    isCreating,
    isUpdating,
  });

  useCreateEntityFromQuery(openCreate);

  const handleQuickPayment = async () => {
    if (!quickAddSubscription) return;

    try {
      // For subscriptions, quick payment advances the next payment date
      const nextPayment = quickAddSubscription.nextPayment
        ? new Date(quickAddSubscription.nextPayment)
        : new Date();

      // Advance to next payment based on billing cycle
      const nextDate = new Date(nextPayment);
      switch (quickAddSubscription.billingCycle) {
        case "DAILY":
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case "WEEKLY":
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "MONTHLY":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "QUARTERLY":
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case "YEARLY":
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          nextDate.setMonth(nextDate.getMonth() + 1);
      }

      await update(quickAddSubscription.id, {
        nextPayment: nextDate,
      });
      setQuickAddSubscription(null);
    } catch (error) {
      console.error("Failed to record payment:", error);
    }
  };

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const visible = useMemo(() => {
    if (!searchQuery.trim()) return subscriptions;
    const query = searchQuery.toLowerCase();
    return subscriptions.filter((subscription) =>
      (subscription.merchant ?? "").toLowerCase().includes(query),
    );
  }, [subscriptions, searchQuery]);

  const stats = useMemo(() => {
    const active = subscriptions.filter((subscription) => subscription.active);
    const monthlyTotal = active.reduce(
      (sum, subscription) => sum + subscriptionMonthlyEquivalent(subscription),
      0,
    );
    return {
      active: active.length,
      monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
    };
  }, [subscriptions]);

  const exportTotals = useMemo(() => {
    const active = visible.filter((subscription) => subscription.active);
    const monthlyTotal = active.reduce(
      (sum, subscription) => sum + subscriptionMonthlyEquivalent(subscription),
      0,
    );

    return [
      {
        label: t("subscriptions.active"),
        value: new Intl.NumberFormat(locale).format(active.length),
      },
      {
        label: t("subscriptions.monthlyTotal"),
        value: formatCurrency(monthlyTotal, locale, currency),
      },
      {
        label: t("subscriptions.yearlyTotal"),
        value: formatCurrency(monthlyTotal * 12, locale, currency),
      },
    ];
  }, [currency, locale, t, visible]);

  const exportColumns = useMemo(
    () => [
      {
        key: "merchant",
        header: t("subscriptions.merchantLabel"),
        render: (subscription: Subscription) =>
          subscription.merchant ?? t("profile.noMerchant"),
      },
      {
        key: "amount",
        header: t("subscriptions.amountLabel"),
        render: (subscription: Subscription) =>
          formatCurrency(subscriptionAmount(subscription), locale, currency),
      },
      {
        key: "billingCycle",
        header: t("subscriptions.billingCycleLabel"),
        render: (subscription: Subscription) =>
          subscription.billingCycle
            ? t(`subscriptions.cycles.${subscription.billingCycle}`)
            : "—",
      },
      {
        key: "nextPayment",
        header: t("subscriptions.nextPayment"),
        render: (subscription: Subscription) =>
          subscription.nextPayment
            ? new Intl.DateTimeFormat(locale).format(
                parseDateOnly(subscription.nextPayment) ??
                  new Date(subscription.nextPayment),
              )
            : t("subscriptions.noNextPayment"),
      },
      {
        key: "status",
        header: t("common.status"),
        render: (subscription: Subscription) =>
          subscription.active ? t("profile.active") : t("profile.inactive"),
      },
    ],
    [currency, locale, t],
  );

  const columns: Column<Subscription>[] = useMemo(
    () => [
      TextColumn({
        header: t("subscriptions.merchantLabel"),
        sortable: true,
        sortValue: (subscription) => subscription.merchant ?? "",
        value: (subscription) => subscription.merchant,
        emptyValue: t("profile.noMerchant"),
        icon: (subscription) => (
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              subscription.active
                ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon icon={CreditCard} className="size-4" />
          </div>
        ),
      }),
      TextColumn({
        header: t("subscriptions.billingCycleLabel"),
        className: "hidden md:table-cell",
        sortable: true,
        sortValue: (subscription) => subscription.billingCycle ?? "",
        value: (subscription) =>
          subscription.billingCycle
            ? t(`subscriptions.cycles.${subscription.billingCycle}`)
            : undefined,
        muted: true,
      }),
      NumberColumn({
        header: t("subscriptions.amountLabel"),
        sortable: true,
        value: (subscription) => subscriptionAmount(subscription),
        formatter: (value) => formatCurrency(value, locale, currency),
      }),
      NumberColumn({
        header: t("subscriptions.totalMonthly"),
        className: "hidden lg:table-cell",
        sortable: true,
        value: (subscription) => subscriptionMonthlyEquivalent(subscription),
        formatter: (value) => formatCurrency(value, locale, currency),
      }),
      TextColumn({
        header: t("subscriptions.nextPayment"),
        className: "hidden md:table-cell",
        sortable: true,
        sortValue: (subscription) =>
          subscription.nextPayment
            ? (
                parseDateOnly(subscription.nextPayment) ??
                new Date(subscription.nextPayment)
              ).getTime()
            : 0,
        value: (subscription) =>
          subscription.nextPayment
            ? new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(
                parseDateOnly(subscription.nextPayment) ??
                  new Date(subscription.nextPayment),
              )
            : undefined,
        emptyValue: t("subscriptions.noNextPayment"),
        icon: (subscription) =>
          subscription.nextPayment ? (
            <Icon icon={Calendar} className="size-3.5 text-muted-foreground" />
          ) : undefined,
        muted: true,
      }),
      CustomColumn({
        header: t("common.status"),
        className: "hidden md:table-cell",
        sortable: true,
        sortValue: (subscription) => (subscription.active ? 1 : 0),
        cell: (subscription) => (
          <Badge
            variant={subscription.active ? "default" : "secondary"}
            className={cn(
              subscription.active &&
                "border-0 bg-gradient-to-r from-violet-500 to-violet-600 text-white",
            )}
          >
            {subscription.active ? t("profile.active") : t("profile.inactive")}
          </Badge>
        ),
      }),
      ActionsColumn({
        ariaLabel: t("profile.actions"),
        actions: (subscription) => [
          {
            label: t("subscriptions.quickPayment"),
            icon: <Icon icon={CreditCard} className="size-3.5" />,
            onClick: () => setQuickAddSubscription(subscription),
            showWhen: subscription.active,
          },
          {
            label: t("subscriptions.edit"),
            icon: <Icon icon={Pencil} className="size-3.5" />,
            onClick: () => openEdit(subscription),
          },
          { separator: true },
          {
            label: t("common.delete"),
            icon: <Icon icon={Trash2} className="size-3.5" />,
            variant: "destructive",
            onClick: () => setDeleting(subscription),
          },
        ],
      }),
    ],
    [t, locale, currency, openEdit, setDeleting],
  );

  return (
    <FinancePageShell>
      <BackHeader title={t("nav.subscriptions")} href="/dashboard" />

      <p className="text-sm text-muted-foreground">
        {t("subscriptions.pageDescription")}
      </p>

      {subscriptions.length > 0 && (
        <SummaryMetricGrid>
          <SummaryMetricCard
            label={t("subscriptions.active")}
            value={stats.active}
            icon={Repeat2}
            tone="info"
          />
          <SummaryMetricCard
            label={t("subscriptions.monthlyTotal")}
            value={formatCurrency(stats.monthlyTotal, locale, currency)}
            icon={Wallet}
            tone="positive"
          />
          <SummaryMetricCard
            label={t("subscriptions.yearlyTotal")}
            value={formatCurrency(stats.yearlyTotal, locale, currency)}
            icon={Wallet}
            tone="warning"
          />
        </SummaryMetricGrid>
      )}

      <EntityListView
        data={visible}
        columns={columns}
        loading={loading}
        keyExtractor={(subscription) => subscription.id}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchPlaceholder={t("subscriptions.searchPlaceholder")}
        view={view}
        onViewChange={setView}
        skeletonVariant="detail"
        emptyState={
          <EmptyState
            icon={<Icon icon={Repeat2} className="size-5" />}
            title={t("subscriptions.emptyTitle")}
            description={
              searchQuery
                ? t("common.noResults")
                : t("subscriptions.emptyDescription")
            }
            action={
              <GradientButton onClick={openCreate} size="sm">
                {t("subscriptions.emptyAction")}
              </GradientButton>
            }
          />
        }
        actionBar={buildFinanceListActionBar({
          create: { label: t("subscriptions.new"), onClick: openCreate },
          exportAction:
            visible.length > 0 ? (
              <DataExportMenu
                data={visible}
                columns={exportColumns}
                totals={exportTotals}
                summaryLabel={t("dashboard.financialSummary")}
                title={t("nav.subscriptions")}
                filenamePrefix="subscriptions"
                locale={locale}
              />
            ) : undefined,
          refresh: {
            onRefresh: refresh,
            refreshing: loading,
            label: t("dashboard.refresh"),
          },
        })}
        renderCard={(subscription, _index) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            onEdit={() => openEdit(subscription)}
            onDelete={() => setDeleting(subscription)}
            onQuickPayment={() => setQuickAddSubscription(subscription)}
          />
        )}
        renderSkeletonCard={(index) => (
          <SubscriptionCardSkeleton index={index} />
        )}
      />

      <SubscriptionFormSheet
        open={formOpen}
        onOpenChange={closeForm}
        subscription={editing}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title={t("subscriptions.deleteTitle")}
        description={t("subscriptions.deleteDescription")}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!quickAddSubscription}
        onOpenChange={() => setQuickAddSubscription(null)}
        title={t("subscriptions.recordPayment")}
        description={
          quickAddSubscription
            ? t("subscriptions.recordPaymentDesc", {
                merchant: quickAddSubscription.merchant ?? "",
              })
            : ""
        }
        confirmLabel={t("subscriptions.confirmPayment")}
        cancelLabel={t("common.cancel")}
        variant="default"
        icon={<Icon icon={CreditCard} className="size-5" />}
        onConfirm={handleQuickPayment}
      />
    </FinancePageShell>
  );
}
