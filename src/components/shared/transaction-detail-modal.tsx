"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@components/ui";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  ExternalLink,
  Repeat2,
  Tag,
  Wallet,
  X,
} from "@/lib/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseDateOnly } from "@/lib/date-only";
import type { Category } from "@/types/Category";
import type { Transaction, TransactionType } from "@/types/Transaction";
import { PAYMENT_METHOD_KEY } from "@/utils/constants";
import { EntityAudit } from "./entity-audit";
import { TagBadge } from "./tag-badge";
import { CategoryIcon, Icon } from "./icon";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  tags?: Category[];
  locale: string;
  currency: string;
  onClose: () => void;
  onUpdate?: (id: string, data: { type: TransactionType }) => Promise<unknown>;
}

// Helper function to safely convert amount to number
function getAmount(amount: number | unknown): number {
  return typeof amount === "number" ? amount : Number(amount) || 0;
}

export function TransactionDetailModal({
  transaction,
  tags,
  locale,
  currency,
  onClose,
  onUpdate,
}: TransactionDetailModalProps) {
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);
  const [localType, setLocalType] = useState<TransactionType | null>(null);

  useEffect(() => {
    if (transaction) {
      setLocalType(null);
    }
  }, [transaction]);

  if (!transaction) return null;

  const effectiveType = localType ?? transaction.type;
  const isIncome = effectiveType === "INCOME";

  const handleToggleType = async () => {
    if (!onUpdate || updating) return;
    const newType = isIncome ? "EXPENSE" : "INCOME";
    setLocalType(newType);
    setUpdating(true);
    try {
      await onUpdate(transaction.id, { type: newType });
    } catch {
      setLocalType(transaction.type);
    } finally {
      setUpdating(false);
    }
  };

  const detailRows = [
    {
      label: t("transactions.date"),
      icon: Calendar,
      value: transaction.date ? (
        new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(parseDateOnly(transaction.date) ?? new Date(transaction.date))
      ) : (
        <span className="text-muted-foreground/30">—</span>
      ),
    },
    {
      label: t("transactions.category"),
      icon: CategoryIcon,
      value:
        tags && tags.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1">
            {tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground/30">—</span>
        ),
    },
    {
      label: t("transactions.paymentMethod"),
      icon: Wallet,
      value: transaction.paymentMethod ? (
        t(
          PAYMENT_METHOD_KEY[transaction.paymentMethod] ??
            transaction.paymentMethod,
        )
      ) : (
        <span className="text-muted-foreground/30">—</span>
      ),
    },
    {
      label: t("transaction.recurring"),
      icon: Repeat2,
      value: transaction.isRecurring ? (
        "Si"
      ) : (
        <span className="text-muted-foreground/50">No</span>
      ),
    },
  ];

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-105 p-0 flex flex-col"
      >
        <SheetHeader className="border-b border-border/50 px-6 py-5 text-left bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl text-white shadow-sm",
                  isIncome
                    ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400"
                    : "bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400",
                )}
              >
                {isIncome ? (
                  <Icon icon={ArrowUpCircle} className="size-5" />
                ) : (
                  <Icon icon={ArrowDownCircle} className="size-5" />
                )}
              </div>
              <SheetTitle className="text-lg truncate">
                {t("transaction.detailTitle")}
              </SheetTitle>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={`/dashboard/transactions/${transaction.id}`}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/40 transition-all duration-200 hover:bg-gradient-to-br hover:from-muted/50 hover:to-muted/30 hover:text-foreground"
                  onClick={onClose}
                >
                  <Icon icon={ExternalLink} className="size-4" />
                  <span className="sr-only">
                    {t("transactions.viewDetails")}
                  </span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SheetClose className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/40 transition-all duration-200 hover:bg-gradient-to-br hover:from-muted/50 hover:to-muted/30 hover:text-foreground">
                  <Icon icon={X} className="size-4" />
                </SheetClose>
              </motion.div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "relative overflow-hidden rounded-2xl p-5 sm:p-6 shadow-lg",
              isIncome
                ? "bg-gradient-to-br from-emerald-500/15 via-emerald-500/8 to-emerald-500/5 dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-emerald-500/5"
                : "bg-gradient-to-br from-rose-500/15 via-rose-500/8 to-rose-500/5 dark:from-rose-500/20 dark:via-rose-500/10 dark:to-rose-500/5",
            )}
          >
            {/* Top gradient border */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r",
                isIncome
                  ? "from-emerald-500 via-emerald-400 to-emerald-500"
                  : "from-rose-500 via-rose-400 to-rose-500",
              )}
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50">
                  {t("transactions.amount")}
                </p>
                <motion.h2
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "text-3xl font-semibold tabular-nums tracking-tight leading-none sm:text-4xl",
                    isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {isIncome ? "+" : "–"}
                  {formatCurrency(
                    getAmount(transaction.amount),
                    locale,
                    currency,
                  )}
                </motion.h2>
                {transaction.description && (
                  <p className="mt-2 text-sm font-medium text-muted-foreground/80">
                    {transaction.description}
                  </p>
                )}
              </div>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl sm:size-12 shadow-md",
                  isIncome
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white dark:from-emerald-600 dark:to-emerald-700"
                    : "bg-gradient-to-br from-rose-500 to-rose-600 text-white dark:from-rose-600 dark:to-rose-700",
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
                      disabled={!onUpdate || updating}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleToggleType}
                      className={cn(
                        "relative flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                        active
                          ? isExpenseType
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground/50 hover:text-foreground",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="sheet-type-bg"
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
                          ? t("transactions.expenses")
                          : t("transactions.income")}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              {updating && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="size-3 shrink-0"
                >
                  <span className="block size-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="divide-y divide-border/30 rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 shadow-md"
          >
            {detailRows.map((row, index) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.05 + index * 0.03 }}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30 rounded-lg"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground/60">
                    <Icon icon={row.icon} className="size-4" />
                  </div>
                  <span className="truncate text-xs text-muted-foreground/70 font-medium">
                    {row.label}
                  </span>
                </div>
                <span className="shrink-0 text-right text-sm font-medium text-foreground/90">
                  {row.value}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {transaction.notes && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className="rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 p-5 shadow-md"
            >
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
                {t("transaction.notes")}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground/80">
                {transaction.notes}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.12 }}
            className="rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 px-5 py-4 shadow-md"
          >
            <EntityAudit
              createdAt={transaction.createdAt}
              createdBy={transaction.user}
              updatedAt={transaction.updatedAt}
              updatedBy={transaction.updatedByProfile}
            />
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
