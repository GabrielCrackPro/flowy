"use client";

import { resolveCategoryIcon } from "@components/categories/category-icons";
import {
  BudgetIcon,
  CurrencyInput,
  EntitySheetFooter,
  EntitySheetHeader,
  FormSection,
  Icon,
  PreviewCard,
} from "@components/shared";
import { Input, Sheet, SheetContent } from "@components/ui";
import { useProfile } from "@hooks/useProfile";
import { useReactForm } from "@hooks/useReactForm";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Sparkles, Wallet } from "@/lib/icons";
import { createBudgetSchema } from "@/lib/schemas/budget";
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/Budget";
import type { Category } from "@/types/Category";

interface BudgetFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  onSubmit: (data: CreateBudgetInput | UpdateBudgetInput) => void;
  isSubmitting?: boolean;
  categories: Category[];
}

export function BudgetFormSheet({
  open,
  onOpenChange,
  budget,
  onSubmit,
  isSubmitting = false,
  categories,
}: BudgetFormSheetProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const expenseCategories = categories.filter((cat) => cat.type === "EXPENSE");

  const form = useReactForm({
    initialValues: {
      categoryIds: [] as string[],
      budgetLimit: 0,
      month: null as number | null,
      year: null as number | null,
    },
    schema: createBudgetSchema,
    onSubmit: async (values) => {
      // Additional client-side validation before submission
      if (values.budgetLimit <= 0) {
        throw new Error("El límite debe ser mayor que cero");
      }
      if (values.categoryIds.length === 0) {
        throw new Error("Category is required");
      }

      onSubmit({
        categoryIds: values.categoryIds,
        budgetLimit: values.budgetLimit,
        month: values.month,
        year: values.year,
      });
    },
  });

  const {
    values,
    errors,
    handleValueChange,
    handleSubmit,
    form: rhfForm,
  } = form;

  useEffect(() => {
    if (open) {
      if (budget) {
        rhfForm.setValue(
          "categoryIds",
          budget.categoryId ? [budget.categoryId] : [],
        );
        rhfForm.setValue("budgetLimit", Number(budget.budgetLimit));
        rhfForm.setValue("month", budget.month);
        rhfForm.setValue("year", budget.year);
      } else {
        rhfForm.reset();
        const now = new Date();
        rhfForm.setValue("month", now.getMonth() + 1);
        rhfForm.setValue("year", now.getFullYear());
      }
    }
  }, [open, budget, rhfForm]);

  const selectedCategory = useMemo(
    () => expenseCategories.find((cat) => values.categoryIds[0] === cat.id),
    [expenseCategories, values.categoryIds],
  );

  const SelectedCategoryIcon = selectedCategory
    ? resolveCategoryIcon(selectedCategory.icon)
    : undefined;

  const canSubmit =
    values.budgetLimit > 0 &&
    values.categoryIds.length > 0 &&
    !isSubmitting &&
    !errors.budgetLimit &&
    !errors.categoryIds;

  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const nextMonth = nextMonthDate.getMonth() + 1;
  const nextYear = nextMonthDate.getFullYear();

  const presets = useMemo(
    () => [
      {
        key: "recurring",
        label: t("budgets.recurring"),
        active: values.month === null && values.year === null,
        apply: () => {
          handleValueChange("month")(null);
          handleValueChange("year")(null);
        },
      },
      {
        key: "thisMonth",
        label: t("budgets.periodThisMonth"),
        active: values.month === thisMonth && values.year === thisYear,
        apply: () => {
          handleValueChange("month")(thisMonth);
          handleValueChange("year")(thisYear);
        },
      },
      {
        key: "nextMonth",
        label: t("budgets.periodNextMonth"),
        active: values.month === nextMonth && values.year === nextYear,
        apply: () => {
          handleValueChange("month")(nextMonth);
          handleValueChange("year")(nextYear);
        },
      },
    ],
    [
      t,
      values.month,
      values.year,
      handleValueChange,
      thisMonth,
      thisYear,
      nextMonth,
      nextYear,
    ],
  );

  const periodLabel =
    values.month && values.year
      ? new Intl.DateTimeFormat(locale, {
          month: "long",
          year: "numeric",
        }).format(new Date(values.year, values.month - 1))
      : t("budgets.recurring");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0 sm:max-w-xl"
      >
        <EntitySheetHeader
          icon={<BudgetIcon size="lg" />}
          iconGradient="from-primary/20 to-primary/10"
          iconColor="text-primary"
          title={budget ? t("budgets.edit") : t("budgets.new")}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <PreviewCard
              icon={
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex size-14 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{
                    background: selectedCategory?.color
                      ? `linear-gradient(135deg, ${selectedCategory.color} 0%, ${selectedCategory.color}dd 100%)`
                      : "linear-gradient(135deg, #6366f1 0%, #6366f1dd 100%)",
                  }}
                >
                  {SelectedCategoryIcon ? (
                    <Icon icon={SelectedCategoryIcon} className="size-6" />
                  ) : null}
                </motion.div>
              }
            >
              <p className="text-lg font-semibold">
                {values.budgetLimit > 0
                  ? formatCurrency(values.budgetLimit, locale, currency)
                  : t("budgets.amountPlaceholder")}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                {selectedCategory ? (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${selectedCategory.color}15`,
                      color: selectedCategory.color ?? undefined,
                    }}
                  >
                    {selectedCategory.name}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("budgets.noCategorySelected")}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                  <Icon icon={Calendar} className="size-3" />
                  {periodLabel}
                </span>
              </div>
            </PreviewCard>

            <FormSection
              label={t("budgets.categoryLabel")}
              error={errors.categoryIds}
            >
              {expenseCategories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("budgets.noExpenseCategories")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {expenseCategories.map((category) => {
                    const isSelected = values.categoryIds[0] === category.id;
                    const CategoryIcon = resolveCategoryIcon(category.icon);
                    return (
                      <motion.button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          const newIds = isSelected ? [] : [category.id];
                          handleValueChange("categoryIds")(newIds);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm transition",
                          isSelected
                            ? "border-border/60 bg-card shadow-sm"
                            : "border-border/40 bg-card text-muted-foreground hover:border-border/80 hover:bg-card/80",
                        )}
                        style={{
                          ...(isSelected
                            ? {
                                borderColor: category.color ?? undefined,
                                backgroundColor: `${category.color}08`,
                                boxShadow: `0 0 0 2px ${category.color}20`,
                              }
                            : {}),
                        }}
                      >
                        <div
                          className="flex size-10 items-center justify-center rounded-lg text-white shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`,
                          }}
                        >
                          <Icon icon={CategoryIcon} className="size-5" />
                        </div>
                        <span className="w-full truncate text-center text-xs font-medium">
                          {category.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </FormSection>

            <FormSection
              label={t("budgets.amountLabel")}
              icon={Wallet}
              htmlFor="budget-limit"
              error={errors.budgetLimit}
            >
              <CurrencyInput
                id="budget-limit"
                value={values.budgetLimit}
                onValueChange={(value) =>
                  handleValueChange("budgetLimit")(value)
                }
                placeholder={t("budgets.amountPlaceholder")}
                currency={currency}
                locale={locale}
                min={0.01}
                showQuickAmounts={true}
                quickAmounts={[50, 100, 200, 500, 1000, 2000]}
                showIncrementButtons={true}
              />
            </FormSection>

            <FormSection
              label={t("budgets.periodLabel")}
              icon={Calendar}
              className="space-y-3"
              error={errors.month || errors.year}
            >
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <motion.button
                    key={preset.key}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={preset.apply}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      preset.active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground hover:border-border/70 hover:text-foreground",
                    )}
                  >
                    {preset.label}
                  </motion.button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="budget-month"
                    className="block text-xs text-muted-foreground"
                  >
                    {t("budgets.monthLabel")}
                  </label>
                  <Input
                    id="budget-month"
                    type="number"
                    min="1"
                    max="12"
                    value={values.month ?? ""}
                    onChange={(e) =>
                      handleValueChange("month")(
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    placeholder="1-12"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="budget-year"
                    className="block text-xs text-muted-foreground"
                  >
                    {t("budgets.yearLabel")}
                  </label>
                  <Input
                    id="budget-year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={values.year ?? ""}
                    onChange={(e) =>
                      handleValueChange("year")(
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    placeholder="2024"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted/30 p-3">
                <Icon icon={Sparkles} className="mt-0.5 size-4 flex-shrink-0" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("budgets.periodHint")}
                </p>
              </div>
            </FormSection>
          </div>
        </div>

        <EntitySheetFooter
          onCancel={() => onOpenChange(false)}
          onSubmit={() => handleSubmit()}
          submitLabel={budget ? t("common.save") : t("common.create")}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
        />
      </SheetContent>
    </Sheet>
  );
}
