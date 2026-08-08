import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/types/Transaction";
import { ExpenseIcon, Icon, IncomeIcon } from "../icon";

interface TypeSelectorProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
  expenseLabel: string;
  incomeLabel: string;
  embedded?: boolean;
}

export function TypeSelector({
  value,
  onChange,
  expenseLabel,
  incomeLabel,
}: TypeSelectorProps) {
  const _isExpense = value === "EXPENSE";
  const layoutKey = useId();

  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-background/80 p-1 shadow-inner">
      {(["EXPENSE", "INCOME"] as const).map((type) => {
        const active = value === type;
        const isExpenseType = type === "EXPENSE";
        const IconComponent = isExpenseType ? ExpenseIcon : IncomeIcon;
        return (
          <motion.button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors",
              active
                ? isExpenseType
                  ? "text-rose-600"
                  : "text-emerald-600"
                : "text-muted-foreground/70 hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`amount-type-bg-${layoutKey}`}
                className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border/20"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
              />
            ) : null}
            <Icon icon={IconComponent} size="md" className="relative" />
            <span className="relative">
              {isExpenseType ? expenseLabel : incomeLabel}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
