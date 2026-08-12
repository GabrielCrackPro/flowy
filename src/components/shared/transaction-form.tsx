"use client";

import { Button, FormAlert, FormField, Input } from "@components/ui";
import { useCategoryApi } from "@hooks/api";
import { useBudgetApi } from "@hooks/api/useBudgetApi";
import { useProfile } from "@hooks/useProfile";
import { useReactForm } from "@hooks/useReactForm";
import type { CreateTransactionSchema } from "@lib/schemas";
import { createTransactionSchema } from "@lib/schemas";
import { cn } from "@lib/utils";
import { getOptions, PAYMENT_METHOD_KEY } from "@utils/constants";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAmountInput, useDateLocale, useThrottle } from "@/hooks";
import { Camera, Pencil } from "@/lib/icons";
import { BackHeader } from "../dashboard/header/BackHeader";
import { FileUpload } from "./file-upload";
import { Icon } from "./icon";
import { AdditionalOptions } from "./transaction-form/AdditionalOptions";
import { AmountSection } from "./transaction-form/AmountSection";
import { FormActions } from "./transaction-form/FormActions";
import { TransactionSidebar } from "./transaction-form/TransactionSidebar";

interface TransactionFormProps {
  mode: "create" | "edit";
  initialValues: CreateTransactionSchema;
  onSubmit: (values: CreateTransactionSchema) => Promise<void>;
  onSuccess?: () => void;
  embedded?: boolean;
  onCancel?: () => void;
}

export function TransactionForm({
  mode,
  initialValues,
  onSubmit,
  onSuccess,
  embedded = false,
  onCancel,
}: TransactionFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const title =
    mode === "edit"
      ? t("transaction.editTransaction")
      : t("transaction.pageTitle");

  useEffect(() => {
    if (embedded) return;
    document.title = `${title} | Flowy`;
  }, [title, embedded]);

  const {
    categories,
    loading: loadingCategories,
    refresh: refreshCategories,
  } = useCategoryApi();
  const { budgets } = useBudgetApi();
  const amountRef = useRef<HTMLInputElement>(null);
  const categoriesFetched = useRef(false);

  useEffect(() => {
    if (categoriesFetched.current) return;
    categoriesFetched.current = true;
    refreshCategories();
  }, [refreshCategories]);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Get currency symbol position
  const { currencySymbol: detectedSymbol, symbolPosition } = useMemo<{
    currencySymbol: string;
    symbolPosition: "before" | "after";
  }>(() => {
    try {
      const parts = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).formatToParts(0);

      const symbol =
        parts.find((part) => part.type === "currency")?.value || currency;
      const position =
        parts.findIndex((part) => part.type === "currency") <
        parts.findIndex((part) => part.type === "literal")
          ? "before"
          : "after";

      return { currencySymbol: symbol, symbolPosition: position };
    } catch {
      return { currencySymbol: currency, symbolPosition: "after" as const };
    }
  }, [locale, currency]);

  const dateFnsLocale = useDateLocale(locale);

  const touch = useCallback((field: string) => {
    setTouched((prev) => new Set(prev).add(field));
  }, []);

  const amountInput = useAmountInput({
    initialValue: initialValues.amount,
    onValueChange: (value) => handleValueChange("amount")(value),
    onTouch: touch,
    locale,
  });

  const form = useReactForm<CreateTransactionSchema>({
    schema: createTransactionSchema,
    initialValues,
    onSubmit: async (values) => {
      const descriptionValue = (values.description ?? "").trim();
      if (!descriptionValue) {
        setTouched((prev) => new Set(prev).add("description"));
        return;
      }
      if (values.amount <= 0) {
        throw new Error(t("transaction.validation.amountMustBePositive"));
      }
      await onSubmit({ ...values, description: descriptionValue });
      onSuccess?.();
    },
  });

  // Throttle form submission to prevent double submissions
  const throttledSubmit = useThrottle(() => handleSubmit(), {
    delay: 1000,
    leading: true,
    trailing: false,
  });

  const {
    values,
    errors,
    error,
    busy,
    handleChange,
    handleValueChange,
    handleSubmit,
  } = form;

  const isExpense = values.type === "EXPENSE";

  const toggleCategory = useCallback(
    (id: string) => {
      const current = values.categoryIds ?? [];
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];
      handleValueChange("categoryIds")(next);
    },
    [values.categoryIds, handleValueChange],
  );

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const descriptionError = useMemo(() => {
    if (!touched.has("description")) return undefined;
    const desc = (values.description ?? "").trim();
    if (!desc) return t("transaction.validation.descriptionRequired");
    return errors.description;
  }, [touched, values.description, errors.description, t]);

  const isFormValid =
    (values.description ?? "").trim().length > 0 &&
    values.amount > 0 &&
    !errors.description &&
    !errors.amount;

  // Keyboard shortcut: Cmd+Enter / Ctrl+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (isFormValid && !busy) throttledSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFormValid, busy, throttledSubmit]);

  const handleTypeChange = useCallback(
    (type: "INCOME" | "EXPENSE") => {
      handleValueChange("type")(type);
    },
    [handleValueChange],
  );

  const goBack = useCallback(() => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.back();
  }, [router, onCancel]);

  const hasOptionsContent = Boolean((values.notes ?? "").trim());

  return (
    <div>
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          embedded ? "max-w-none pt-2 pb-6" : "max-w-5xl pt-4",
        )}
      >
        {!embedded ? <BackHeader title={title} /> : null}

        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            embedded
              ? "pt-2"
              : "pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start",
          )}
        >
          <div className="space-y-6">
            <AmountSection
              embedded={embedded}
              isExpense={isExpense}
              type={values.type}
              onTypeChange={handleTypeChange}
              amountRef={amountRef}
              amountInput={amountInput}
              detectedSymbol={detectedSymbol}
              symbolPosition={symbolPosition}
              locale={locale}
              currency={currency}
              description={values.description}
              amount={values.amount}
              amountError={errors.amount}
              amountTouched={touched.has("amount")}
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl border border-border/30 bg-card bg-linear-to-br from-primary/5 via-primary/[0.02] to-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 sm:p-6"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-primary via-primary/50 to-primary" />

              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary ring-1 ring-inset ring-primary/10">
                  <Icon icon={Pencil} className="size-4" />
                </div>
                <span className="text-sm font-semibold text-foreground/90">
                  {t("transaction.descriptionField")}
                </span>
              </div>

              <FormField error={descriptionError} required>
                <Input
                  value={values.description ?? ""}
                  onChange={handleChange("description")}
                  onBlur={() => touch("description")}
                  placeholder={t("transaction.descriptionPlaceholder")}
                  autoComplete="off"
                  aria-invalid={descriptionError ? true : undefined}
                  className="h-12 text-base focus:ring-2 focus:ring-primary/20"
                />
              </FormField>
            </motion.div>

            {embedded ? (
              <TransactionSidebar
                date={values.date}
                onDateChange={handleValueChange("date")}
                categories={categories}
                categoryIds={values.categoryIds ?? []}
                onCategorySelect={toggleCategory}
                loadingCategories={loadingCategories}
                paymentMethod={values.paymentMethod}
                onPaymentMethodChange={(method) =>
                  handleValueChange("paymentMethod")(method)
                }
                isRecurring={values.isRecurring}
                onRecurringChange={handleValueChange("isRecurring")}
                budgets={budgets}
                budgetId={values.budgetId}
                onBudgetChange={(budgetId) =>
                  handleValueChange("budgetId")(budgetId)
                }
                dateLocale={dateFnsLocale}
                t={t}
                getPaymentMethodOptions={() =>
                  getOptions(PAYMENT_METHOD_KEY, t)
                }
              />
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="relative overflow-hidden rounded-2xl border border-border/30 bg-card bg-linear-to-br from-amber-500/5 via-amber-500/[0.02] to-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 sm:p-6"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-amber-500 via-amber-400 to-amber-500" />

              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-500/20 to-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/10 dark:from-amber-500/30 dark:to-amber-500/20 dark:text-amber-400">
                  <Icon icon={Camera} className="size-4" />
                </div>
                <span className="text-sm font-semibold text-foreground/90">
                  {t("transaction.receipt")}
                </span>
              </div>

              <FormField>
                <FileUpload
                  value={values.receiptUrl}
                  onChange={(url) =>
                    handleValueChange("receiptUrl")(url ?? undefined)
                  }
                  labels={{
                    uploadLabel: t("transaction.uploadReceipt"),
                    dragHint: t("transaction.dragDropHint"),
                    fileTypesHint: t("transaction.fileTypesHint"),
                    changeLabel: t("transaction.changeFile"),
                    removeLabel: t("transaction.removeFile"),
                    uploadingLabel: t("transaction.uploadProgress"),
                    errorLabel: t("transaction.uploadError"),
                    retryLabel: t("transaction.retry"),
                    maxSizeError: t("transaction.uploadTooLarge"),
                  }}
                />
              </FormField>
            </motion.div>

            {embedded ? (
              <AdditionalOptions
                isOpen={optionsOpen}
                onToggle={() => setOptionsOpen((prev) => !prev)}
                notes={values.notes}
                onNotesChange={(e) => handleChange("notes")(e)}
                hasContent={hasOptionsContent}
                label={t("transaction.additionalOptions")}
                notesLabel={t("transaction.notes")}
                placeholder={t("transaction.notesPlaceholder")}
                modifiedLabel={t("transaction.modified")}
              />
            ) : null}
          </div>

          {/* Sidebar column: only rendered as a separate column in non-embedded (page) layout */}
          {!embedded ? (
            <div className="space-y-6 lg:sticky lg:top-4">
              <TransactionSidebar
                date={values.date}
                onDateChange={handleValueChange("date")}
                categories={categories}
                categoryIds={values.categoryIds ?? []}
                onCategorySelect={toggleCategory}
                loadingCategories={loadingCategories}
                paymentMethod={values.paymentMethod}
                onPaymentMethodChange={(method) =>
                  handleValueChange("paymentMethod")(method)
                }
                isRecurring={values.isRecurring}
                onRecurringChange={handleValueChange("isRecurring")}
                budgets={budgets}
                budgetId={values.budgetId}
                onBudgetChange={(budgetId) =>
                  handleValueChange("budgetId")(budgetId)
                }
                dateLocale={dateFnsLocale}
                t={t}
                getPaymentMethodOptions={() =>
                  getOptions(PAYMENT_METHOD_KEY, t)
                }
              />

              <AdditionalOptions
                isOpen={optionsOpen}
                onToggle={() => setOptionsOpen((prev) => !prev)}
                notes={values.notes}
                onNotesChange={(e) => handleChange("notes")(e)}
                hasContent={hasOptionsContent}
                label={t("transaction.additionalOptions")}
                notesLabel={t("transaction.notes")}
                placeholder={t("transaction.notesPlaceholder")}
                modifiedLabel={t("transaction.modified")}
              />
            </div>
          ) : null}

          <FormActions
            embedded={embedded}
            isExpense={isExpense}
            busy={busy}
            disabled={!isFormValid}
            mode={mode}
            onSave={throttledSubmit}
            onCancel={goBack}
          />
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <FormAlert
              message={error}
              variant="error"
              className="rounded-2xl border-rose-500/30 bg-rose-500/10"
            />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
