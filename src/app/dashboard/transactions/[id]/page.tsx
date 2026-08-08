"use client";

import { ConfirmDialog, EmptyState, Icon } from "@components/shared";
import { Button } from "@components/ui";
import { useTransactionApi } from "@hooks/api";
import { useProfile } from "@hooks/useProfile";
import { getTransaction } from "@lib/api/transaction";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHeader } from "@/components/dashboard";
import { CommentsSection } from "@/components/shared/comments";
import {
  AmountCard,
  AuditCard,
  NotesCard,
  ReceiptCard,
  TransactionDetailSkeleton,
  TransactionInfoCard,
} from "@/components/transactions/detail";
import { parseDateOnly } from "@/lib/date-only";
import { Pencil, Share2, Trash2, Wallet } from "@/lib/icons";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const locale = profile?.locale ?? "es-ES";
  const activeSpaceId = profile?.activeSpaceId ?? null;
  const { update, remove } = useTransactionApi();

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [localType, setLocalType] = useState<"INCOME" | "EXPENSE" | null>(null);

  useEffect(() => {
    document.title = `${t("transaction.detailTitle")} | Flowy`;
  }, [t]);

  const isIncome = (localType ?? transaction?.type) === "INCOME";

  const handleToggleType = useCallback(async () => {
    if (!transaction || updating) return;
    const newType = isIncome ? "EXPENSE" : "INCOME";
    setLocalType(newType);
    setUpdating(true);
    try {
      await update(transaction.id, { type: newType } as Record<
        string,
        unknown
      >);
      refetch();
    } catch {
      setLocalType(null);
    } finally {
      setUpdating(false);
    }
  }, [transaction, updating, isIncome, update, refetch]);

  const handleDelete = useCallback(async () => {
    if (!transaction) return;
    await remove(transaction.id);
    router.push("/dashboard/transactions");
  }, [transaction, remove, router]);

  const handleShare = useCallback(async () => {
    if (!transaction) return;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: t("transaction.detailTitle"), url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [transaction, t]);

  const handleReceiptChange = useCallback(
    async (url: string | null) => {
      if (!transaction) return;
      await update(transaction.id, {
        receiptUrl: url ?? null,
      } as Record<string, unknown>);
      refetch();
    },
    [transaction, update, refetch],
  );

  const dateTimeStr = useMemo(() => {
    if (!transaction?.date) return null;
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parseDateOnly(transaction.date) ?? new Date(transaction.date));
  }, [transaction?.date, locale]);

  if (isLoading && !transaction) {
    return (
      <div className="pb-10">
        <BackHeader
          title={t("transaction.detailTitle")}
          href="/dashboard/transactions"
        />
        <TransactionDetailSkeleton />
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="pb-10">
        <BackHeader
          title={t("transaction.detailTitle")}
          href="/dashboard/transactions"
        />
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : String(error)}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("errors.retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="pb-10">
        <BackHeader
          title={t("transaction.detailTitle")}
          href="/dashboard/transactions"
        />
        <EmptyState
          icon={<Icon icon={Wallet} className="size-5" />}
          description={t("transaction.notFound")}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="pb-16"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6">
        <div className="mb-6">
          <BackHeader
            title={t("transaction.detailTitle")}
            href="/dashboard/transactions"
            actions={
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("transaction.editTransaction")}
                  className="text-muted-foreground/50 hover:text-foreground hover:bg-linear-to-br hover:from-muted/50 hover:to-muted/30"
                  onClick={() =>
                    router.push(
                      `/dashboard/transactions/${transaction.id}/edit`,
                    )
                  }
                >
                  <Icon icon={Pencil} className="size-4" />
                </Button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("transaction.shareDetail")}
                    className="text-muted-foreground/50 hover:text-foreground hover:bg-linear-to-br hover:from-muted/50 hover:to-muted/30"
                    onClick={handleShare}
                  >
                    <Icon icon={Share2} className="size-4" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("transaction.deletePermanently")}
                    className="text-muted-foreground/50 hover:text-destructive hover:bg-linear-to-br hover:from-destructive/50 hover:to-destructive/30"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Icon icon={Trash2} className="size-4" />
                  </Button>
                </motion.div>
              </>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <AmountCard
              transaction={transaction}
              isIncome={isIncome}
              updating={updating}
              onToggleType={handleToggleType}
            />
            <TransactionInfoCard
              transaction={transaction}
              dateTimeStr={dateTimeStr}
            />
          </div>

          <div className="space-y-6">
            <ReceiptCard
              transaction={transaction}
              onReceiptChange={handleReceiptChange}
            />
            <NotesCard notes={transaction.notes} />
            <AuditCard transaction={transaction} locale={locale} />
          </div>
        </div>

        <CommentsSection entityType="transaction" entityId={transaction.id} />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("transactions.delete")}
        description={t("transactions.deleteConfirm")}
        confirmLabel={t("transactions.delete")}
        cancelLabel={t("transaction.cancel")}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
