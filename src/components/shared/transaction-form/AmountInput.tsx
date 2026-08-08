import { motion } from "framer-motion";
import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  rawAmount: string;
  onAmountChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAmountBlur: () => void;
  onQuickAmount: (amount: number) => void;
  currencySymbol: string;
  isExpense: boolean;
  formatCompactAmount: (amount: number) => string;
  embedded?: boolean;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

export function AmountInput({
  rawAmount,
  onAmountChange,
  onAmountBlur,
  onQuickAmount,
  currencySymbol,
  isExpense,
  formatCompactAmount,
  embedded = false,
}: AmountInputProps) {
  return (
    <>
      <div className="mt-5 flex items-baseline gap-2">
        <motion.span
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={cn(
            "text-3xl font-semibold tabular-nums",
            isExpense ? "text-rose-600/70" : "text-emerald-600/70",
          )}
        >
          {currencySymbol}
        </motion.span>
        <input
          value={rawAmount}
          onChange={onAmountChange}
          onBlur={onAmountBlur}
          placeholder="0.00"
          autoComplete="off"
          inputMode="decimal"
          className={cn(
            "w-full min-w-0 bg-transparent font-bold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/30",
            embedded ? "text-4xl" : "text-4xl sm:text-5xl",
            isExpense ? "text-rose-600" : "text-emerald-600",
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {QUICK_AMOUNTS.map((amount, index) => (
          <motion.button
            key={amount}
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickAmount(amount)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium tabular-nums transition",
              parseFloat(rawAmount) === amount
                ? isExpense
                  ? "bg-linear-to-r from-rose-500 to-rose-600 text-white shadow-md"
                  : "bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-md"
                : "bg-background/80 text-muted-foreground/80 ring-1 ring-border/30 hover:text-foreground hover:ring-border/50",
            )}
          >
            {formatCompactAmount(amount)}
          </motion.button>
        ))}
      </div>
    </>
  );
}
