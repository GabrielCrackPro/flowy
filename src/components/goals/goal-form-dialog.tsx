"use client";

import {
  CurrencyInput,
  createDateQuickActions,
  DatePicker,
  EntitySheetFooter,
  EntitySheetHeader,
  FormSection,
  GoalIcon,
  Icon,
  PreviewCard,
} from "@components/shared";
import { Input, Sheet, SheetContent } from "@components/ui";
import { useDateLocale } from "@hooks/useDateLocale";
import { useProfile } from "@hooks/useProfile";
import { useReactForm } from "@hooks/useReactForm";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Sparkles, Target } from "@/lib/icons";
import { createGoalSchema } from "@/lib/schemas/goal";
import type { CreateGoalInput, Goal, UpdateGoalInput } from "@/types/Goal";

interface GoalFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Goal | null;
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => void;
  isSubmitting?: boolean;
}

export function GoalFormSheet({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isSubmitting = false,
}: GoalFormSheetProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const locale = profile?.locale ?? "es-ES";
  const dateLocale = useDateLocale(locale);
  const currency = profile?.currency ?? "USD";

  const form = useReactForm({
    initialValues: {
      title: "",
      targetAmount: 0,
      savedAmount: 0,
      deadline: null as Date | null,
    },
    schema: createGoalSchema,
    onSubmit: (values) => {
      onSubmit({
        title: values.title,
        targetAmount: values.targetAmount,
        savedAmount: values.savedAmount ?? 0,
        deadline: values.deadline,
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
      if (editing) {
        rhfForm.setValue("title", editing.title);
        rhfForm.setValue("targetAmount", Number(editing.targetAmount));
        rhfForm.setValue("savedAmount", Number(editing.savedAmount));
        rhfForm.setValue(
          "deadline",
          editing.deadline ? new Date(editing.deadline) : null,
        );
      } else {
        rhfForm.reset();
      }
    }
  }, [open, editing, rhfForm]);

  const canSubmit =
    values.title.trim().length > 0 &&
    values.targetAmount > 0 &&
    !isSubmitting &&
    !errors.title &&
    !errors.targetAmount;

  const progress =
    values.targetAmount > 0
      ? Math.min(
          100,
          Math.round((values.savedAmount / values.targetAmount) * 100),
        )
      : 0;

  const deadlineLabel = values.deadline
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
        day: "numeric",
      }).format(values.deadline)
    : t("goals.noDeadline");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 h-full sm:max-w-xl"
      >
        <EntitySheetHeader
          icon={<GoalIcon size="lg" />}
          iconGradient="from-amber-500/20 to-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          title={editing ? t("goals.edit") : t("goals.new")}
          subtitle={t("goals.description")}
          metadata={
            <>
              <span className="inline-flex items-center gap-1">
                <Icon icon={Calendar} className="size-3" />
                {deadlineLabel}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                <Icon icon={Sparkles} className="size-3" />
                {progress}%
              </span>
            </>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <PreviewCard
              icon={
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600 dark:from-amber-500/30 dark:to-amber-500/20 dark:text-amber-400 shadow-lg"
                >
                  <Icon icon={Target} className="size-6" />
                </motion.div>
              }
            >
              <p className="text-lg font-semibold">
                {values.title || t("goals.titlePlaceholder")}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                  <Icon icon={Calendar} className="size-3" />
                  {deadlineLabel}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    progress >= 100
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : progress >= 80
                        ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
                  )}
                >
                  <Icon icon={Sparkles} className="size-3" />
                  {progress}%
                </span>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(values.savedAmount, locale, currency)}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(values.targetAmount, locale, currency)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={cn(
                      "h-full rounded-full",
                      progress >= 100
                        ? "bg-emerald-500"
                        : progress >= 80
                          ? "bg-amber-500"
                          : "bg-blue-500",
                    )}
                  />
                </div>
              </div>
            </PreviewCard>

            <FormSection label={t("goals.titleLabel")} error={errors.title}>
              <Input
                value={values.title}
                onChange={(e) => handleValueChange("title")(e.target.value)}
                placeholder={t("goals.titlePlaceholder")}
                className="text-base"
              />
            </FormSection>

            <FormSection
              label={t("goals.targetAmount")}
              error={errors.targetAmount}
            >
              <CurrencyInput
                id="targetAmount"
                value={values.targetAmount}
                onValueChange={handleValueChange("targetAmount")}
                currency={currency}
                locale={locale}
                placeholder={t("goals.amountPlaceholder")}
                min={0.01}
                showQuickAmounts={true}
                quickAmounts={[100, 500, 1000, 5000, 10000, 50000]}
                showIncrementButtons={true}
              />
            </FormSection>

            <FormSection
              label={t("goals.savedAmount")}
              error={errors.savedAmount}
            >
              <CurrencyInput
                id="savedAmount"
                value={values.savedAmount}
                onValueChange={handleValueChange("savedAmount")}
                currency={currency}
                locale={locale}
                placeholder={t("goals.savedAmountPlaceholder")}
                min={0}
                showQuickAmounts={true}
                quickAmounts={[10, 50, 100, 200, 500, 1000]}
                showIncrementButtons={true}
              />
            </FormSection>

            <FormSection label={t("goals.deadline")} error={errors.deadline}>
              <DatePicker
                date={values.deadline ?? undefined}
                onSelect={(date) => handleValueChange("deadline")(date ?? null)}
                placeholder={t("goals.deadline")}
                locale={dateLocale}
                quickActions={createDateQuickActions((key) => t(key))}
              />
            </FormSection>
          </div>
        </div>

        <EntitySheetFooter
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
          submitLabel={editing ? t("goals.update") : t("goals.create")}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
        />
      </SheetContent>
    </Sheet>
  );
}
