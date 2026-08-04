"use client";

import { EmptyState, Skeleton, TransactionForm } from "@components/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BackHeader } from "@/components/dashboard";
import { Button } from "@/components/ui";
import { useTransactionApi } from "@/hooks/api";
import { useProfile } from "@/hooks/useProfile";
import { getTransaction } from "@/lib/api/transaction";
import { parseDateOnly } from "@/lib/date-only";
import type { CreateTransactionSchema } from "@/lib/schemas";

export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;
  const { t } = useTranslation();
  const { update } = useTransactionApi();

  const {
    data: transaction,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transaction", activeSpaceId, id],
    queryFn: () => getTransaction(id),
    enabled: !!id,
  });

  const initialValues = useMemo<CreateTransactionSchema>(() => {
    if (!transaction) {
      return { type: "EXPENSE", amount: 0, date: new Date() };
    }
    return {
      type: transaction.type,
      amount: Number(transaction.amount),
      date: parseDateOnly(transaction.date) ?? new Date(),
      description: transaction.description ?? undefined,
      categoryIds: transaction.tags?.map((tag) => tag.id) ?? undefined,
      paymentMethod: transaction.paymentMethod ?? undefined,
      notes: transaction.notes ?? undefined,
      receiptUrl: transaction.receiptUrl ?? undefined,
      isRecurring: transaction.isRecurring ?? false,
      budgetId: transaction.budgetId ?? undefined,
    };
  }, [transaction]);

  const detailHref = `/dashboard/transactions/${id as string}`;

  const renderState = () => {
    if (isLoading && !transaction) {
      return <EditTransactionSkeleton />;
    }
    if (error && !transaction) {
      return (
        <EmptyState
          icon={<span className="text-xl leading-none">⚠</span>}
          description={error instanceof Error ? error.message : String(error)}
          action={
            <Button variant="outline" onClick={() => refetch()}>
              {t("errors.retry")}
            </Button>
          }
        />
      );
    }
    if (!transaction) {
      return (
        <EmptyState
          icon={<span className="text-xl leading-none">⚠</span>}
          description={t("transaction.notFound")}
        />
      );
    }
    return null;
  };

  const stateNode = renderState();

  if (stateNode) {
    return (
      <div className="pb-10">
        <BackHeader title="Editar transacción" />
        {stateNode}
      </div>
    );
  }

  return (
    <TransactionForm
      key={id}
      mode="edit"
      initialValues={initialValues}
      onSubmit={async (values) => {
        await update(id as string, values);
        // Invalidate the specific transaction query to ensure detail page shows updated data
        await queryClient.invalidateQueries({
          queryKey: ["transaction", activeSpaceId, id],
        });
        router.push(detailHref);
      }}
    />
  );
}

function EditTransactionSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4">
      <div className="h-10 w-40">
        <Skeleton />
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/30 bg-gradient-to-br from-muted/20 to-muted/5 p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-background/60 p-1">
              <div className="h-8 rounded-lg">
                <Skeleton />
              </div>
              <div className="h-8 rounded-lg">
                <Skeleton />
              </div>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <div className="h-12 w-48 sm:w-64">
                <Skeleton />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((chip) => (
                <div key={chip} className="h-7 w-14">
                  <Skeleton variant="rounded" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/30 pt-3">
              <div className="h-3.5 w-32">
                <Skeleton />
              </div>
              <div className="h-4 w-24">
                <Skeleton />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/30 bg-card p-5 sm:p-6">
            <div className="mb-2 h-3.5 w-24">
              <Skeleton />
            </div>
            <div className="h-12 w-full">
              <Skeleton variant="rounded" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/30 bg-card p-5 sm:p-6">
            <div className="mb-2 h-3.5 w-16">
              <Skeleton />
            </div>
            <div className="h-24 w-full">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-4">
          <div className="space-y-4 rounded-2xl border border-border/30 bg-card p-5 sm:p-6">
            <div className="h-3.5 w-24">
              <Skeleton />
            </div>
            <div className="h-10 w-full">
              <Skeleton variant="rounded" />
            </div>
            <div className="h-3.5 w-32">
              <Skeleton />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="size-8">
                    <Skeleton variant="rounded" />
                  </div>
                  <div className="h-3.5 w-32">
                    <Skeleton />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-12 w-full">
              <Skeleton variant="rounded" />
            </div>
            <div className="h-10 w-full">
              <Skeleton variant="rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
