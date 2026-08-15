"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { useAmountInput } from "@/hooks/useAmountInput";
import { cn, formatCurrency } from "@/lib/utils";
import { AnimatedGradient } from "../animated-gradient";
import { TypeSelector } from "./TypeSelector";

export function AmountSection({
  embedded = false,
  isExpense,
  type,
  onTypeChange,
  amountInput,
  detectedSymbol,
  symbolPosition,
  locale,
  currency,
  description,
  amount,
  amountError,
  amountTouched,
  amountRef,
}: {
  embedded?: boolean;
  isExpense: boolean;
  type: "INCOME" | "EXPENSE";
  onTypeChange: (type: "INCOME" | "EXPENSE") => void;
  amountRef?: React.RefObject<HTMLInputElement | null>;
  amountInput: ReturnType<typeof useAmountInput>;
  detectedSymbol: string;
  symbolPosition: "before" | "after";
  locale: string;
  currency: string;
  description?: string | null;
  amount: number;
  amountError?: string;
  amountTouched: boolean;
}) {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl border border-border/30 bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
    >
      <AnimatedGradient
        active={isExpense}
        className="absolute inset-0"
        classNameA="bg-linear-to-br from-rose-500/15 via-rose-500/5 to-transparent"
        classNameB="bg-linear-to-br from-emerald-500/15 via-emerald-500/5 to-transparent"
      />

      <AnimatedGradient
        active={isExpense}
        className="absolute inset-x-0 top-0 h-px"
        classNameA="bg-linear-to-r from-rose-500 via-rose-400 to-rose-500"
        classNameB="bg-linear-to-r from-emerald-500 via-emerald-400 to-emerald-500"
      />

      <div className={cn("relative p-5", embedded ? "sm:p-5" : "sm:p-6")}>
        <TypeSelector
          value={type}
          onChange={onTypeChange}
          expenseLabel={t("transaction.expense")}
          incomeLabel={t("transaction.income")}
          embedded={embedded}
        />

        <div className="mt-5 flex items-center justify-between gap-3">
          <label
            htmlFor="transaction-amount"
            className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {t("transaction.amount")}
          </label>
          <span className="text-xs font-medium text-muted-foreground/60">
            {currency}
          </span>
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          {symbolPosition === "before" && (
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className={cn(
                "text-3xl font-semibold tabular-nums",
                isExpense ? "text-rose-600/70" : "text-emerald-600/70",
              )}
            >
              {detectedSymbol}
            </motion.span>
          )}
          <input
            id="transaction-amount"
            ref={amountRef}
            value={amountInput.rawAmount}
            onChange={amountInput.handleAmountChange}
            onFocus={amountInput.handleAmountFocus}
            onBlur={amountInput.handleAmountBlur}
            placeholder="0.00"
            autoComplete="off"
            inputMode="decimal"
            aria-invalid={amountTouched && amountError ? true : undefined}
            aria-describedby={
              amountTouched && amountError
                ? "transaction-amount-error"
                : undefined
            }
            className={cn(
              "w-full min-w-0 bg-transparent font-bold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/30",
              embedded ? "text-4xl" : "text-4xl sm:text-5xl",
              isExpense ? "text-rose-600" : "text-emerald-600",
            )}
          />
          {symbolPosition === "after" && (
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className={cn(
                "text-3xl font-semibold tabular-nums",
                isExpense ? "text-rose-600/70" : "text-emerald-600/70",
              )}
            >
              {detectedSymbol}
            </motion.span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {[10, 20, 50, 100, 200, 500].map((quickAmount, index) => {
            const formatQuickAmount = (amt: number): string => {
              if (symbolPosition === "before") {
                return `${detectedSymbol}${amt.toLocaleString(locale)}`;
              }
              return `${amt.toLocaleString(locale)}${detectedSymbol}`;
            };

            return (
              <motion.button
                key={quickAmount}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => amountInput.setAmount(quickAmount)}
                aria-pressed={parseFloat(amountInput.rawAmount) === quickAmount}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium tabular-nums transition",
                  parseFloat(amountInput.rawAmount) === quickAmount
                    ? isExpense
                      ? "bg-linear-to-r from-rose-500 to-rose-600 text-white shadow-md"
                      : "bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-md"
                    : "bg-background/80 text-muted-foreground/80 ring-1 ring-border/30 hover:text-foreground hover:ring-border/50",
                )}
              >
                {formatQuickAmount(quickAmount)}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/30 pt-3">
          <span className="truncate text-xs text-muted-foreground/50">
            {description?.trim() ||
              (isExpense ? t("transaction.expense") : t("transaction.income"))}
          </span>
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className={cn(
              "shrink-0 text-sm font-semibold tabular-nums",
              isExpense ? "text-rose-600" : "text-emerald-600",
            )}
          >
            {amount > 0
              ? `${isExpense ? "−" : "+"}${formatCurrency(
                  amount,
                  locale,
                  currency,
                )}`
              : formatCurrency(0, locale, currency)}
          </motion.span>
        </div>

        {amountTouched && amountError ? (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            id="transaction-amount-error"
            className="mt-2 text-xs text-rose-600 dark:text-rose-400"
          >
            {amountError}
          </motion.p>
        ) : null}
      </div>
    </motion.section>
  );
}
