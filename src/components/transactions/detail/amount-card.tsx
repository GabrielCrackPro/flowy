"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AnimatedGradient } from "@/components/shared/animated-gradient";
import { Icon } from "@/components/shared/icon";
import { useProfile } from "@/hooks/useProfile";
import { ArrowDownCircle, ArrowUpCircle } from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/Transaction";

export function AmountCard({
  transaction,
  isIncome,
  updating,
  onToggleType,
}: {
  transaction: Transaction;
  isIncome: boolean;
  updating: boolean;
  onToggleType: () => void;
}) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const incomeGradient =
    "bg-linear-to-br from-emerald-500 to-emerald-600 text-white dark:from-emerald-600 dark:to-emerald-700";

  return (
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
              ? incomeGradient
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
                onClick={onToggleType}
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
                <Icon icon={IconComponent} className="relative size-3.5" />
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
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="size-3 shrink-0"
          >
            <span className="block size-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
