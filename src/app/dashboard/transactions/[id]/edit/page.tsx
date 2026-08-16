"use client";

import { EmptyState, Skeleton, TransactionForm } from "@components/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
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
import { cn } from "@/lib/utils";

export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;
  const { t } = useTranslation();
  const { update } = useTransactionApi(undefined, { enabled: false });

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
        <BackHeader title={t("transaction.editTransaction")} />
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

const editSkeletonContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const editSkeletonVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

function EditTransactionSkeleton() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={editSkeletonContainer}
      className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4"
    >
      <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <motion.div variants={editSkeletonVariants} className="space-y-6">
          {/* Amount card skeleton */}
          <div className="relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/30 bg-gradient-to-br from-muted/20 to-muted/5 p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-background/80 p-1 shadow-inner">
              <Skeleton className="h-8 rounded-xl" />
              <Skeleton className="h-8 rounded-xl" />
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-12 w-48 sm:w-64" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((chip) => (
                <Skeleton
                  key={chip}
                  variant="rounded"
                  className="h-7 w-14 rounded-full"
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/30 pt-3">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Description input skeleton */}
          <div className="rounded-2xl border border-border/30 bg-card p-5 sm:p-6">
            <Skeleton className="mb-2 h-3.5 w-24" />
            <Skeleton variant="rounded" className="h-12 w-full" />
          </div>

          {/* Notes textarea skeleton */}
          <div className="rounded-2xl border border-border/30 bg-card p-5 sm:p-6">
            <Skeleton className="mb-2 h-3.5 w-16" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </motion.div>

        <motion.div
          variants={editSkeletonVariants}
          className="space-y-6 lg:sticky lg:top-4"
        >
          {/* Sidebar rows skeleton */}
          <div className="divide-y divide-border/30 rounded-2xl border border-border/30 bg-card py-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            {[1, 2, 3, 4, 5].map((row, index) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton variant="rounded" className="size-8" />
                  <Skeleton
                    className={cn("h-3.5", index % 2 === 0 ? "w-24" : "w-20")}
                  />
                </div>
                <Skeleton
                  className={cn("h-3.5", index === 3 ? "w-8" : "w-16")}
                />
              </div>
            ))}
          </div>

          {/* Action buttons skeleton */}
          <div className="flex flex-col gap-2">
            <Skeleton variant="rounded" className="h-12 w-full" />
            <Skeleton variant="rounded" className="h-10 w-full" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
