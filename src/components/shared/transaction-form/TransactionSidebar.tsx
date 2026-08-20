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
import { FormSection } from "../entity-sheet/form-section";
import { Icon } from "../icon";
import { PaymentMethodIcon } from "../payment-method-icon";
import { CategorySelector } from "./CategorySelector";
import { DateSelector } from "./DateSelector";

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
  t: (key: string, options?: Record<string, unknown>) => string;
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
      className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
    >
      <FormSection
        label={t("transaction.date")}
        icon={CalendarIcon}
        className="px-4 py-3.5"
      >
        <DateSelector
          date={date}
          onSelect={onDateChange}
          placeholder={t("transaction.selectDate")}
          locale={dateLocale}
        />
      </FormSection>

      <FormSection
        label={t("transaction.category")}
        icon={Tag}
        className="px-4 py-3.5"
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
      </FormSection>

      <FormSection
        label={t("transaction.paymentMethod")}
        icon={CreditCard}
        className="px-4 py-3.5"
      >
        <Select
          value={paymentMethod ?? null}
          onValueChange={(val) => onPaymentMethodChange(val ?? undefined)}
        >
          <SelectTrigger size="sm" className="w-full">
            {paymentMethod ? (
              <PaymentMethodIcon
                method={paymentMethod}
                className="size-4 text-muted-foreground"
              />
            ) : (
              <Icon
                icon={CreditCard}
                className="size-4 text-muted-foreground"
              />
            )}
            <SelectValue
              placeholder={t("transaction.selectPaymentMethod")}
              options={getPaymentMethodOptions()}
            />
          </SelectTrigger>
          <SelectContent>
            {getPaymentMethodOptions().map((method) => (
              <SelectItem key={method.value} value={method.value}>
                <PaymentMethodIcon
                  method={method.value}
                  className="size-4 text-muted-foreground"
                />
                <span>{method.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormSection>

      {budgets.length > 0 && (
        <FormSection
          label={t("transaction.assignToBudget")}
          icon={Wallet}
          className="px-4 py-3.5"
        >
          <Select
            value={budgetId ?? ""}
            onValueChange={(val) => onBudgetChange(val || undefined)}
          >
            <SelectTrigger size="sm" className="w-full">
              <Icon icon={Wallet} className="size-4 text-muted-foreground" />
              <SelectValue
                placeholder={t("transaction.selectBudget")}
                options={budgets.map((b) => ({
                  value: b.id,
                  label:
                    b.category?.name ||
                    t("transaction.unnamedBudget", { id: b.id }),
                }))}
              />
            </SelectTrigger>
            <SelectContent>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  <Icon
                    icon={Wallet}
                    className="size-4 text-muted-foreground"
                  />
                  <span>
                    {budget.category?.name ||
                      t("transaction.unnamedBudget", { id: budget.id })}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormSection>
      )}

      <FormSection
        label={
          <span className="block">
            {t("transaction.recurring")}
            <span className="block text-xs font-normal text-muted-foreground/60">
              {t("transaction.recurringDesc")}
            </span>
          </span>
        }
        icon={Repeat2}
        trailing={
          <Switch checked={isRecurring} onCheckedChange={onRecurringChange} />
        }
        className="px-4 py-3.5"
      />
    </motion.div>
  );
}
