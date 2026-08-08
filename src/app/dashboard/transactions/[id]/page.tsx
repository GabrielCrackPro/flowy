"use client";

import {
  AnimatedGradient,
  ConfirmDialog,
  EmptyState,
  FileUpload,
  Icon,
  PaymentMethodIcon,
  Skeleton,
  TagBadge,
  UserAvatar,
} from "@components/shared";
import { Button } from "@components/ui";
import { useTransactionApi } from "@hooks/api";
import { useComments } from "@hooks/useComments";
import { useProfile } from "@hooks/useProfile";
import { getTransaction } from "@lib/api/transaction";
import { cn, formatCurrency } from "@lib/utils";
import { useQuery } from "@tanstack/react-query";
import { PAYMENT_METHOD_KEY } from "@utils/constants";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { BackHeader } from "@/components/dashboard";
import { parseDateOnly } from "@/lib/date-only";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Clock,
  CornerDownRight,
  ExternalLink,
  MessageSquare,
  Pencil,
  Repeat2,
  Send,
  Share2,
  Tag,
  Trash2,
  User,
  Wallet,
  X,
} from "@/lib/icons";
import type { Comment } from "@/types/Comment";
import type { Profile } from "@/types/Profile";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";
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

  const newLocal =
    "bg-linear-to-br from-emerald-500 to-emerald-600 text-white dark:from-emerald-600 dark:to-emerald-700";
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
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-lg"
            >
              <AnimatedGradient
                active={isIncome}
                className="absolute inset-0"
                classNameA="bg-linear-to-br from-emerald-500/15 via-emerald-500/8 to-emerald-500/5 dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-emerald-500/5"
                classNameB="bg-linear-to-br from-rose-500/15 via-rose-500/8 to-rose-500/5 dark:from-rose-500/20 dark:via-rose-500/10 dark:to-rose-500/5"
              />

              <AnimatedGradient
                active={isIncome}
                className="absolute inset-x-0 top-0 h-px"
                classNameA="bg-linear-to-r from-emerald-500 via-emerald-400 to-emerald-500"
                classNameB="bg-linear-to-r from-rose-500 via-rose-400 to-rose-500"
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50 mb-1">
                    {t("transaction.amount")}
                  </p>
                  <motion.h2
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight leading-none",
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {isIncome ? "+" : "–"}
                    {formatCurrency(transaction.amount, locale, currency)}
                  </motion.h2>
                  {transaction.description && (
                    <p className="mt-2 text-sm text-muted-foreground/80 font-medium">
                      {transaction.description}
                    </p>
                  )}
                </div>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-md",
                    isIncome
                      ? newLocal
                      : "bg-linear-to-br from-rose-500 to-rose-600 text-white dark:from-rose-600 dark:to-rose-700",
                  )}
                >
                  {isIncome ? (
                    <Icon icon={ArrowUpCircle} className="size-6" />
                  ) : (
                    <Icon icon={ArrowDownCircle} className="size-6" />
                  )}
                </motion.div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="grid flex-1 grid-cols-2 gap-1 rounded-xl bg-white/60 p-1 ring-1 ring-black/5 dark:bg-black/20">
                  {(["EXPENSE", "INCOME"] as const).map((type) => {
                    const active = isIncome === (type === "INCOME");
                    const isExpenseType = type === "EXPENSE";
                    const IconComponent = isExpenseType
                      ? ArrowDownCircle
                      : ArrowUpCircle;
                    return (
                      <motion.button
                        key={type}
                        type="button"
                        disabled={updating}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleToggleType}
                        className={cn(
                          "relative flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition",
                          active
                            ? isExpenseType
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground/50 hover:text-foreground",
                        )}
                      >
                        {active ? (
                          <motion.span
                            layoutId="detail-type-bg"
                            className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border/20"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 32,
                            }}
                          />
                        ) : null}
                        <Icon
                          icon={IconComponent}
                          className="relative size-3.5"
                        />
                        <span className="relative">
                          {isExpenseType
                            ? t("transaction.expense")
                            : t("transaction.income")}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {updating && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="size-3 shrink-0"
                  >
                    <span className="block size-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            <DetailCard
              delay={0.05}
              className="divide-y divide-border/30 border border-border/30 bg-linear-to-br from-card to-card/50 shadow-md"
            >
              <DetailRow
                icon={<Icon icon={Calendar} className="size-4" />}
                label={t("transaction.dateTime")}
                value={dateTimeStr}
              />
              <DetailRow
                icon={<Icon icon={Repeat2} className="size-4" />}
                label={t("transaction.recurring")}
                value={
                  transaction.isRecurring ? (
                    "Si"
                  ) : (
                    <span className="text-muted-foreground/50">No</span>
                  )
                }
              />
              <DetailRow
                icon={<Icon icon={Tag} className="size-4" />}
                label={t("transaction.category")}
                value={
                  transaction.tags && transaction.tags.length > 0 ? (
                    <div className="flex flex-wrap justify-end gap-1">
                      {transaction.tags.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )
                }
              />
              <DetailRow
                icon={
                  <PaymentMethodIcon
                    method={transaction.paymentMethod}
                    className="size-4"
                  />
                }
                label={t("transaction.paymentMethod")}
                value={
                  transaction.paymentMethod ? (
                    <div className="flex items-center gap-2">
                      <PaymentMethodIcon
                        method={transaction.paymentMethod}
                        className="size-4"
                      />
                      <span>
                        {t(
                          PAYMENT_METHOD_KEY[transaction.paymentMethod] ??
                            transaction.paymentMethod,
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )
                }
              />
            </DetailCard>
          </div>

          <div className="space-y-6">
            <DetailCard
              delay={0.1}
              className="p-6 border border-border/30 bg-linear-to-br from-card to-card/50 shadow-md"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary dark:from-primary/30 dark:to-primary/20 dark:text-primary-foreground">
                  <Icon icon={ExternalLink} className="size-3.5" />
                </div>
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
                  {t("transaction.receipt")}
                </span>
              </div>

              <FileUpload
                value={transaction.receiptUrl}
                onChange={(url) => handleReceiptChange(url)}
                labels={{
                  uploadLabel: t("transaction.uploadReceipt"),
                  dragHint: t("transaction.dragDropHint"),
                  fileTypesHint: t("transaction.fileTypesHint"),
                  changeLabel: t("transaction.changeFile"),
                  removeLabel: t("transaction.removeFile"),
                  uploadingLabel: t("transaction.uploadProgress"),
                  errorLabel: t("transaction.uploadError"),
                  retryLabel: t("transaction.retry"),
                }}
              />
            </DetailCard>

            <DetailCard
              delay={0.1}
              className="p-6 border border-border/30 bg-linear-to-br from-card to-card/50 shadow-md"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40 mb-3">
                {t("transaction.notes")}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground/80">
                {transaction.notes ?? (
                  <span className="text-muted-foreground/30">—</span>
                )}
              </p>
            </DetailCard>

            <DetailCard
              delay={0.15}
              className="divide-y divide-border/30 border border-border/30 bg-linear-to-br from-card to-card/50 shadow-md"
            >
              <DetailRow
                icon={<Icon icon={User} className="size-4" />}
                label={t("transaction.createdBy")}
                value={
                  <div className="flex items-center gap-2">
                    {transaction.user && (
                      <>
                        <UserAvatar
                          profile={transaction.user}
                          className="size-5"
                        />
                        <span className="text-sm font-medium">
                          {transaction.user.name}
                        </span>
                      </>
                    )}
                    {transaction.createdAt && (
                      <span className="text-xs text-muted-foreground/50">
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(transaction.createdAt))}
                      </span>
                    )}
                  </div>
                }
              />
              {transaction.updatedByProfile && (
                <DetailRow
                  icon={<Icon icon={Clock} className="size-4" />}
                  label={t("transaction.updatedBy")}
                  value={
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        profile={transaction.updatedByProfile}
                        className="size-5"
                      />
                      <span className="text-sm font-medium">
                        {transaction.updatedByProfile.name}
                      </span>
                      {transaction.updatedAt && (
                        <span className="text-xs text-muted-foreground/50">
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(transaction.updatedAt))}
                        </span>
                      )}
                    </div>
                  }
                />
              )}
            </DetailCard>
          </div>
        </div>

        <CommentsSection transactionId={transaction.id} />
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

const detailSkeletonContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const detailSkeletonVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

function TransactionDetailSkeleton() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={detailSkeletonContainer}
      className="mx-auto max-w-4xl px-4 sm:px-6 pt-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <motion.div variants={detailSkeletonVariants} className="space-y-6">
          {/* Amount card skeleton */}
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 p-6 sm:p-7 shadow-lg">
            <Skeleton className="mb-2 h-3 w-24" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Skeleton className="h-11 w-64 sm:w-72" />
                <Skeleton className="mt-3 h-4 w-40" />
              </div>
              <Skeleton variant="rounded" className="size-12 rounded-2xl" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-background/60 p-1 shadow-inner">
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
            </div>
          </div>

          {/* Detail rows skeleton */}
          <div className="divide-y divide-border/30 rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 shadow-md">
            {[1, 2, 3, 4].map((row, index) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton variant="rounded" className="size-8" />
                  <Skeleton
                    className={cn("h-3.5", index % 2 === 0 ? "w-24" : "w-20")}
                  />
                </div>
                <Skeleton className="h-3.5 w-32" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={detailSkeletonVariants} className="space-y-6">
          {/* Receipt card skeleton */}
          <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton variant="rounded" className="size-8" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/40 bg-muted/10">
              <Skeleton variant="rounded" className="size-8" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>

          {/* Notes card skeleton */}
          <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-md">
            <Skeleton className="mb-3 h-3.5 w-16" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="mt-2 h-3.5 w-1/2" />
          </div>

          {/* Created/updated rows skeleton */}
          <div className="divide-y divide-border/30 rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 shadow-md">
            {[1, 2].map((row, index) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton variant="rounded" className="size-8" />
                  <Skeleton
                    className={cn("h-3.5", index % 2 === 0 ? "w-24" : "w-20")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="size-5" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Comments skeleton */}
      <motion.div
        variants={detailSkeletonVariants}
        className="mt-8 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/5"
      >
        <div className="mb-5 flex items-center gap-2.5">
          <Skeleton variant="rounded" className="size-8" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-4 w-5 rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((row, index) => (
            <div key={row} className="flex items-start gap-3">
              <Skeleton variant="circular" className="size-8 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton
                  className={cn("h-3.5", index % 2 === 0 ? "w-40" : "w-32")}
                />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3">
          <Skeleton variant="circular" className="size-8 shrink-0" />
          <Skeleton variant="rounded" className="h-11 flex-1" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={cn(
        "rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-muted/50 to-muted/30 text-muted-foreground/60">
          <span
            className={cn("shrink-0", iconClass ?? "text-muted-foreground/60")}
          >
            {icon}
          </span>
        </div>
        <span className="text-xs text-muted-foreground/70 truncate font-medium">
          {label}
        </span>
      </div>
      <span className="text-sm font-medium text-foreground/90 text-right shrink-0">
        {value}
      </span>
    </div>
  );
}

function formatRelativeTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const seconds = Math.round(diffMs / 1000);
  if (Math.abs(seconds) < 45) return rtf.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return rtf.format(days, "day");

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function CommentsSection({ transactionId }: { transactionId: string }) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const locale = profile?.locale ?? "es-ES";
  const {
    comments,
    busy: commentsBusy,
    addComment,
    editComment,
    removeComment,
  } = useComments("transaction", transactionId);

  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const { roots, childrenOf } = useMemo(() => {
    const byParent = new Map<string | null, Comment[]>();
    for (const comment of comments) {
      const key = comment.parentId;
      const list = byParent.get(key) ?? [];
      list.push(comment);
      byParent.set(key, list);
    }
    const sortLevel = (list: Comment[]) =>
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const childrenOf = new Map<string, Comment[]>();
    for (const [key, list] of byParent) {
      if (key !== null) childrenOf.set(key, sortLevel(list));
    }
    return { roots: sortLevel(byParent.get(null) ?? []), childrenOf };
  }, [comments]);

  const handleAddComment = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const text = commentText.trim();
      if (!text) return;
      await addComment(text);
      setCommentText("");
    },
    [commentText, addComment],
  );

  const handleAddReply = useCallback(
    async (parentId: string) => {
      const text = replyText.trim();
      if (!text) return;
      await addComment(text, parentId);
      setReplyText("");
      setReplyingToId(null);
    },
    [replyText, addComment],
  );

  const handleSaveEdit = useCallback(
    async (commentId: string) => {
      const text = editText.trim();
      if (!text) return;
      await editComment(commentId, text);
      setEditingId(null);
      setEditText("");
    },
    [editText, editComment],
  );

  const commentAvatar = profile ? (
    <UserAvatar profile={profile} size="sm" className="size-8 text-[10px]" />
  ) : (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted" />
  );

  return (
    <DetailCard delay={0.2} className="mt-8">
      <div className="p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            <Icon icon={MessageSquare} className="size-3.5" />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
            {t("transaction.comments")}
          </span>
          {comments.length > 0 && (
            <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground/60">
              {comments.length}
            </span>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {roots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon={<Icon icon={MessageSquare} className="size-5" />}
                description={t("transaction.commentsEmpty")}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              <AnimatePresence initial={false}>
                {roots.map((comment) => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    childrenOf={childrenOf}
                    profile={profile}
                    t={t}
                    locale={locale}
                    commentsBusy={commentsBusy}
                    editingId={editingId}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onStartEdit={(target) => {
                      setEditingId(target.id);
                      setEditText(target.content);
                    }}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                    onSaveEdit={handleSaveEdit}
                    onRequestDelete={setDeleteCommentId}
                    replyTargetId={replyingToId}
                    replyText={replyText}
                    onReplyTextChange={setReplyText}
                    onToggleReply={(target) => {
                      setReplyingToId((current) =>
                        current === target.id ? null : target.id,
                      );
                      setReplyText("");
                    }}
                    onCancelReply={() => {
                      setReplyingToId(null);
                      setReplyText("");
                    }}
                    onSendReply={handleAddReply}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleAddComment}
          className="mt-5 flex items-start gap-3"
        >
          {commentAvatar}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/60 bg-muted/20 py-1.5 pl-3.5 pr-1.5 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t("transaction.commentPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || commentsBusy}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-20"
            >
              {commentsBusy ? (
                <span className="size-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
              ) : (
                <Icon icon={Send} className="size-3.5" />
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={!!deleteCommentId}
        onOpenChange={(open) => {
          if (!open) setDeleteCommentId(null);
        }}
        title={t("transaction.comments")}
        description={t("transaction.commentDeleteConfirm")}
        confirmLabel={t("transactions.delete")}
        cancelLabel={t("transaction.cancel")}
        onConfirm={() => {
          if (deleteCommentId) {
            removeComment(deleteCommentId);
            setDeleteCommentId(null);
          }
        }}
      />
    </DetailCard>
  );
}

interface CommentRowProps {
  comment: Comment;
  childrenOf: Map<string, Comment[]>;
  depth?: number;
  profile: Profile | null;
  t: (key: string) => string;
  locale: string;
  commentsBusy: boolean;
  editingId: string | null;
  editText: string;
  onEditTextChange: (value: string) => void;
  onStartEdit: (comment: Comment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (commentId: string) => void;
  onRequestDelete: (commentId: string) => void;
  replyTargetId: string | null;
  replyText: string;
  onReplyTextChange: (value: string) => void;
  onToggleReply: (comment: Comment) => void;
  onCancelReply: () => void;
  onSendReply: (commentId: string) => void;
}

function CommentRow({
  comment,
  childrenOf,
  depth = 0,
  profile,
  t,
  locale,
  commentsBusy,
  editingId,
  editText,
  onEditTextChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
  replyTargetId,
  replyText,
  onReplyTextChange,
  onToggleReply,
  onCancelReply,
  onSendReply,
}: CommentRowProps) {
  const compact = depth > 0;
  const replies = childrenOf.get(comment.id) ?? [];
  const editing = editingId === comment.id;
  const replying = replyTargetId === comment.id;
  const avatar = profile ? (
    <UserAvatar
      profile={profile}
      size="sm"
      className={cn(
        "shrink-0",
        compact ? "size-6 text-[9px]" : "size-8 text-[10px]",
      )}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted",
        compact ? "size-6" : "size-8",
      )}
    />
  );

  const rowClass = cn(
    "group flex items-start gap-3 transition-colors hover:bg-muted/30",
    compact ? "-mx-2 rounded-xl px-2 py-2" : "-mx-3 rounded-2xl px-3 py-3",
  );

  if (editing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className={cn(rowClass, "hover:bg-transparent")}
      >
        {avatar}
        <div className="min-w-0 flex-1 space-y-2.5">
          <textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm shadow-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            rows={2}
          />
          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
            >
              {t("transaction.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!editText.trim() || commentsBusy}
              onClick={() => onSaveEdit(comment.id)}
            >
              {t("transaction.save")}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
    >
      <div className={rowClass}>
        {avatar}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "font-semibold text-foreground",
                compact ? "text-[11px]" : "text-xs",
              )}
            >
              {profile?.name ?? t("profile.user")}
            </span>
            <span className="text-[11px] text-muted-foreground/40">
              {formatRelativeTime(comment.createdAt, locale)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-[11px] text-muted-foreground/30">
                {t("transaction.modified")}
              </span>
            )}
          </div>
          <p
            className={cn(
              "mt-1 leading-relaxed text-foreground/85",
              compact ? "text-[13px]" : "text-sm",
            )}
          >
            {comment.content}
          </p>
        </div>

        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            aria-label={t("transaction.reply")}
            onClick={() => onToggleReply(comment)}
            className={cn(
              "flex items-center justify-center rounded-lg text-muted-foreground/30 transition-colors hover:bg-muted hover:text-foreground",
              compact ? "size-6" : "size-7",
            )}
          >
            <Icon
              icon={CornerDownRight}
              className={compact ? "size-3" : "size-3.5"}
            />
          </button>
          <button
            type="button"
            onClick={() => onStartEdit(comment)}
            className={cn(
              "flex items-center justify-center rounded-lg text-muted-foreground/30 transition-colors hover:bg-muted hover:text-foreground",
              compact ? "size-6" : "size-7",
            )}
          >
            <Icon icon={Pencil} className={compact ? "size-3" : "size-3"} />
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(comment.id)}
            className={cn(
              "flex items-center justify-center rounded-lg text-muted-foreground/30 transition-colors hover:bg-destructive/5 hover:text-destructive",
              compact ? "size-6" : "size-7",
            )}
          >
            <Icon icon={Trash2} className={compact ? "size-3" : "size-3"} />
          </button>
        </div>
      </div>

      {replying && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendReply(comment.id);
          }}
          className="mt-2 ml-11 flex items-center gap-2"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/60 bg-muted/20 py-1.5 pl-3.5 pr-1.5 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
            <input
              type="text"
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder={t("transaction.replyPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || commentsBusy}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-20"
            >
              {commentsBusy ? (
                <span className="size-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
              ) : (
                <Icon icon={CornerDownRight} className="size-3.5" />
              )}
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("transaction.cancelReply")}
            onClick={onCancelReply}
          >
            <Icon icon={X} className="size-3.5" />
          </Button>
        </form>
      )}

      {replies.length > 0 && (
        <div className="ml-11 mt-1 space-y-0.5 border-l border-border/60 pl-4">
          <AnimatePresence initial={false}>
            {replies.map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                childrenOf={childrenOf}
                depth={depth + 1}
                profile={profile}
                t={t}
                locale={locale}
                commentsBusy={commentsBusy}
                editingId={editingId}
                editText={editText}
                onEditTextChange={onEditTextChange}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onRequestDelete={onRequestDelete}
                replyTargetId={replyTargetId}
                replyText={replyText}
                onReplyTextChange={onReplyTextChange}
                onToggleReply={onToggleReply}
                onCancelReply={onCancelReply}
                onSendReply={onSendReply}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
