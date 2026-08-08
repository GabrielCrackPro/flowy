import type { Locale } from "date-fns";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, CreditCard, Repeat2, Tag, Wallet } from "@/lib/icons";
import type { Budget } from "@/types/Budget";
import type { Category } from "@/types/Category";
import type { PaymentMethod } from "@/types/Transaction";
import { Icon } from "../icon";
import { CategorySelector } from "./CategorySelector";
import { DateSelector } from "./DateSelector";
import { TransactionDetailsRow } from "./TransactionDetailsRow";

interface TransactionSidebarProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  categories: Category[];
  categoryIds: string[];
  onCategorySelect: (id: string) => void;
  loadingCategories: boolean;
  paymentMethod: PaymentMethod | null | undefined;
  onPaymentMethodChange: (method: PaymentMethod | undefined) => void;
  isRecurring: boolean | undefined;
  onRecurringChange: (recurring: boolean) => void;
  budgets: Budget[];
  budgetId: string | null | undefined;
  onBudgetChange: (budgetId: string | undefined) => void;
  dateLocale?: Locale;
  t: (key: string) => string;
  getPaymentMethodOptions: () => { value: string; label: string }[];
}

export function TransactionSidebar({
  date,
  onDateChange,
  categories,
  categoryIds,
  onCategorySelect,
  loadingCategories,
  paymentMethod,
  onPaymentMethodChange,
  isRecurring,
  onRecurringChange,
  budgets,
  budgetId,
  onBudgetChange,
  dateLocale,
  t,
  getPaymentMethodOptions,
}: TransactionSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="relative overflow-hidden divide-y divide-border/30 rounded-2xl border border-border/30 bg-card bg-linear-to-br from-primary/5 via-primary/[0.02] to-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-1"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-primary via-primary/50 to-primary" />
      <TransactionDetailsRow
        icon={<Icon icon={CalendarIcon} className="size-4" />}
        label={t("transaction.date")}
      >
        <DateSelector
          date={date}
          onSelect={onDateChange}
          placeholder={t("transaction.selectDate")}
          locale={dateLocale}
        />
      </TransactionDetailsRow>

      <TransactionDetailsRow
        icon={<Icon icon={Tag} className="size-4" />}
        label={t("transaction.category")}
      >
        <CategorySelector
          categories={categories}
          selectedIds={categoryIds}
          loading={loadingCategories}
          onSelect={onCategorySelect}
          placeholder={t("transaction.selectCategory")}
          loadingText={t("transaction.loading")}
          emptyText={t("transaction.noCategories")}
          selectedText={t("transaction.tagsSelected")}
          selectedTextPlural={t("transaction.tagsSelectedPlural")}
        />
      </TransactionDetailsRow>

      <TransactionDetailsRow
        icon={<Icon icon={CreditCard} className="size-4" />}
        label={t("transaction.paymentMethod")}
      >
        <div className="min-w-0 flex-1">
          <Select
            value={paymentMethod ?? null}
            onValueChange={(val) => onPaymentMethodChange(val ?? undefined)}
          >
            <SelectTrigger className="w-full border-0 bg-transparent text-right text-sm text-muted-foreground/90 shadow-none focus:ring-0">
              <SelectValue
                placeholder={t("transaction.selectPaymentMethod")}
                options={getPaymentMethodOptions()}
              />
            </SelectTrigger>
            <SelectContent>
              {getPaymentMethodOptions().map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TransactionDetailsRow>

      <TransactionDetailsRow
        icon={<Icon icon={Repeat2} className="size-4" />}
        label={t("transaction.recurring")}
        hint={t("transaction.recurringDesc")}
      >
        <Switch checked={isRecurring} onCheckedChange={onRecurringChange} />
      </TransactionDetailsRow>

      <TransactionDetailsRow
        icon={<Icon icon={Wallet} className="size-4" />}
        label={t("transaction.assignToBudget")}
        hint={t("transaction.assignToBudgetHint")}
      >
        <div className="min-w-0 flex-1">
          <Select
            value={budgetId ?? ""}
            onValueChange={(val) => onBudgetChange(val || undefined)}
          >
            <SelectTrigger className="w-full border-0 bg-transparent text-right text-sm text-muted-foreground/90 shadow-none focus:ring-0">
              <SelectValue placeholder={t("transaction.selectBudget")} />
            </SelectTrigger>
            <SelectContent>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  {budget.category?.name || `Budget ${budget.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TransactionDetailsRow>
    </motion.div>
  );
}
