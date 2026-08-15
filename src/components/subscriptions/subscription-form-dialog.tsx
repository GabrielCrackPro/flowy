"use client";

import {
  CurrencyInput,
  createDateQuickActions,
  DatePicker,
  EntitySheetFooter,
  EntitySheetHeader,
  FormSection,
  Icon,
  PreviewCard,
} from "@components/shared";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  Switch,
} from "@components/ui";
import { useDateLocale } from "@hooks/useDateLocale";
import { useProfile } from "@hooks/useProfile";
import { useReactForm } from "@hooks/useReactForm";
import { formatCurrency } from "@lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { parseDateOnly } from "@/lib/date-only";
import { Calendar, CreditCard, Repeat2, Wallet } from "@/lib/icons";
import { createSubscriptionSchema } from "@/lib/schemas";
import type {
  BillingCycle,
  CreateSubscriptionInput,
  Subscription,
  UpdateSubscriptionInput,
} from "@/types/Subscription";
import { SUBSCRIPTION_MONTHLY_FACTORS } from "@/utils/subscriptions";

const BILLING_CYCLES: BillingCycle[] = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
];

type SubscriptionFormValues = {
  merchant: string;
  amount: number;
  billingCycle: BillingCycle;
  nextPayment: Date | undefined;
  active: boolean;
};

interface SubscriptionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onSubmit: (
    data: CreateSubscriptionInput | UpdateSubscriptionInput,
  ) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function SubscriptionFormSheet({
  open,
  onOpenChange,
  subscription,
  onSubmit,
  isSubmitting = false,
}: SubscriptionFormSheetProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";
  const dateLocale = useDateLocale(locale);

  const form = useReactForm<SubscriptionFormValues>({
    initialValues: {
      merchant: "",
      amount: 0,
      billingCycle: "MONTHLY",
      nextPayment: undefined,
      active: true,
    },
    schema: createSubscriptionSchema,
    onSubmit: (values) => {
      onSubmit({
        merchant: values.merchant.trim() || undefined,
        amount: values.amount,
        billingCycle: values.billingCycle,
        nextPayment: values.nextPayment,
        active: values.active,
      });
    },
  });

  const {
    values,
    errors,
    handleChange,
    handleValueChange,
    handleSubmit,
    form: rhfForm,
  } = form;

  useEffect(() => {
    if (open) {
      if (subscription) {
        rhfForm.setValue("merchant", subscription.merchant ?? "");
        rhfForm.setValue(
          "amount",
          typeof subscription.amount === "number"
            ? subscription.amount
            : Number(subscription.amount) || 0,
        );
        rhfForm.setValue(
          "billingCycle",
          subscription.billingCycle ?? "MONTHLY",
        );
        rhfForm.setValue(
          "nextPayment",
          subscription.nextPayment
            ? (parseDateOnly(subscription.nextPayment) ?? undefined)
            : undefined,
        );
        rhfForm.setValue("active", subscription.active);
      } else {
        rhfForm.reset();
        const now = new Date();
        rhfForm.setValue("nextPayment", now);
      }
    }
  }, [open, subscription, rhfForm]);

  const canSubmit =
    values.merchant.trim().length > 0 &&
    values.amount > 0 &&
    !isSubmitting &&
    !errors.merchant &&
    !errors.amount;

  const formatAmount = (value: number) =>
    formatCurrency(value, locale, currency);

  const monthlyEquivalent = useMemo(
    () =>
      values.active
        ? values.amount * SUBSCRIPTION_MONTHLY_FACTORS[values.billingCycle]
        : 0,
    [values.active, values.amount, values.billingCycle],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 h-full sm:max-w-xl"
      >
        <EntitySheetHeader
          icon={<Icon icon={CreditCard} className="size-5" />}
          iconGradient="from-violet-500/20 to-violet-500/10"
          iconColor="text-violet-600 dark:text-violet-400"
          title={
            subscription ? t("subscriptions.edit") : t("subscriptions.new")
          }
          subtitle={t("subscriptions.pageDescription")}
          metadata={
            <>
              <span className="inline-flex items-center gap-1">
                <Icon icon={Repeat2} className="size-3" />
                {t(`subscriptions.cycles.${values.billingCycle}`)}
              </span>
              {monthlyEquivalent > 0 ? (
                <span className="inline-flex items-center gap-1 font-medium text-violet-600 dark:text-violet-400">
                  <Icon icon={Wallet} className="size-3" />
                  {formatAmount(monthlyEquivalent)}
                </span>
              ) : null}
            </>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <PreviewCard
              icon={
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -3 }}
                  transition={{ duration: 0.2 }}
                  className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg"
                >
                  <Icon icon={CreditCard} className="size-6" />
                </motion.div>
              }
              className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 dark:from-violet-500/15 dark:to-violet-500/5"
            >
              <p className="truncate text-lg font-semibold tracking-tight">
                {values.merchant.trim() ||
                  t("subscriptions.merchantPlaceholder")}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                  {values.amount > 0
                    ? formatAmount(values.amount)
                    : t("subscriptions.amountPlaceholder")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                  <Icon icon={Repeat2} className="size-3" />
                  {t(`subscriptions.cycles.${values.billingCycle}`)}
                </span>
                {values.nextPayment && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                    <Icon icon={Calendar} className="size-3" />
                    {format(values.nextPayment, "d MMM yyyy", {
                      locale: dateLocale,
                    })}
                  </span>
                )}
              </div>

              {monthlyEquivalent > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon icon={Wallet} className="size-3.5" />
                  <span>
                    {t("subscriptions.monthlyEquivalent")}:{" "}
                    <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatAmount(monthlyEquivalent)}
                    </span>
                  </span>
                </div>
              )}
            </PreviewCard>

            <FormSection
              label={t("subscriptions.merchantLabel")}
              htmlFor="subscription-merchant"
              error={errors.merchant}
            >
              <Input
                id="subscription-merchant"
                value={values.merchant}
                onChange={handleChange("merchant")}
                placeholder={t("subscriptions.merchantPlaceholder")}
                className="h-11"
              />
            </FormSection>

            <FormSection
              label={t("subscriptions.amountLabel")}
              htmlFor="subscription-amount"
              error={errors.amount}
            >
              <CurrencyInput
                id="subscription-amount"
                value={values.amount}
                onValueChange={(value) => handleValueChange("amount")(value)}
                placeholder={t("subscriptions.amountPlaceholder")}
                currency={currency}
                locale={locale}
                min={0.01}
                showQuickAmounts={true}
                quickAmounts={[5, 10, 20, 50, 100, 200]}
                showIncrementButtons={true}
              />
            </FormSection>

            <FormSection
              label={t("subscriptions.billingCycleLabel")}
              icon={Repeat2}
            >
              <Select
                value={values.billingCycle}
                onValueChange={(value) =>
                  handleValueChange("billingCycle")(
                    (value ?? "MONTHLY") as BillingCycle,
                  )
                }
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue
                    placeholder={t("subscriptions.selectBillingCycle")}
                    options={BILLING_CYCLES.map((cycle) => ({
                      value: cycle,
                      label: t(`subscriptions.cycles.${cycle}`),
                    }))}
                  />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {t(`subscriptions.cycles.${cycle}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormSection>

            <FormSection
              label={t("subscriptions.nextPaymentLabel")}
              icon={Calendar}
            >
              <DatePicker
                date={values.nextPayment}
                onSelect={(date) =>
                  handleValueChange("nextPayment")(date ?? undefined)
                }
                placeholder={t("subscriptions.selectDate")}
                locale={dateLocale}
                align="end"
                quickActions={createDateQuickActions((key) => t(key))}
              />
            </FormSection>

            <section className="flex items-start justify-between gap-4 rounded-xl border border-border/30 bg-muted/20 p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Icon icon={Repeat2} className="size-4" />
                  {t("subscriptions.activeLabel")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("subscriptions.activeHint")}
                </p>
              </div>
              <Switch
                checked={values.active}
                onCheckedChange={(checked) =>
                  handleValueChange("active")(Boolean(checked))
                }
                size="default"
                className="shrink-0"
              />
            </section>
          </div>
        </div>

        <EntitySheetFooter
          onCancel={() => onOpenChange(false)}
          onSubmit={() => handleSubmit()}
          submitLabel={subscription ? t("common.save") : t("common.create")}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
        />
      </SheetContent>
    </Sheet>
  );
}
