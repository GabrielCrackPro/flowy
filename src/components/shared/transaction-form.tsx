"use client";

import { FormAlert, FormField, Input } from "@components/ui";
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
import { deleteUploadedReceipt } from "@/lib/api/upload";
import { Camera, Pencil } from "@/lib/icons";
import { BackHeader } from "../dashboard/header/BackHeader";
import { FileUpload } from "./file-upload";
import { AdditionalOptions } from "./transaction-form/AdditionalOptions";
import { AmountSection } from "./transaction-form/AmountSection";
import { FormActions } from "./transaction-form/FormActions";
import { FormCard } from "./transaction-form/FormCard";
import { TransactionSidebar } from "./transaction-form/TransactionSidebar";

export function getDefaultTransactionValues(): CreateTransactionSchema {
  return {
    type: "EXPENSE",
    amount: 0,
    description: "",
    date: new Date(),
    categoryIds: [],
    isRecurring: false,
    budgetId: undefined,
  };
}

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
  const initialReceiptUrlRef = useRef<string | null>(
    initialValues.receiptUrl ?? null,
  );
  const receiptUrlRef = useRef<string | null>(initialValues.receiptUrl ?? null);
  const receiptCommittedRef = useRef(false);
  const clearReceiptRef = useRef<() => void>(() => undefined);

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
      try {
        await onSubmit({ ...values, description: descriptionValue });
        receiptCommittedRef.current = true;
        onSuccess?.();
      } catch (error) {
        // A failed create cannot leave an uploaded object orphaned. Remove
        // only new receipts; an existing edit receipt remains retryable.
        if (mode === "create" && values.receiptUrl) {
          try {
            await deleteUploadedReceipt(values.receiptUrl);
            receiptUrlRef.current = null;
            clearReceiptRef.current();
          } catch {
            // Keep the URL in the form so the user can retry the create.
          }
        }
        throw error;
      }
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

  const handleReceiptChange = useCallback(
    (url: string | null) => {
      const previousUrl = receiptUrlRef.current;
      receiptUrlRef.current = url;
      handleValueChange("receiptUrl")(url);

      if (
        previousUrl &&
        previousUrl !== url &&
        previousUrl !== initialReceiptUrlRef.current
      ) {
        void deleteUploadedReceipt(previousUrl).catch(() => undefined);
      }
    },
    [handleValueChange],
  );

  clearReceiptRef.current = () => handleValueChange("receiptUrl")(null);

  useEffect(() => {
    return () => {
      const receiptUrl = receiptUrlRef.current;
      if (mode === "create" || receiptUrl !== initialReceiptUrlRef.current) {
        if (!receiptCommittedRef.current && receiptUrl) {
          void deleteUploadedReceipt(receiptUrl).catch(() => undefined);
        }
      }
    };
  }, [mode]);

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
    // The sheet should open without moving focus into the form. This keeps
    // the table action that opened it as the user's context and avoids a
    // distracting jump on touch devices.
    if (embedded) return;
    amountRef.current?.focus();
  }, [embedded]);

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
            "grid grid-cols-1",
            embedded
              ? "gap-4 pt-2"
              : "gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start",
          )}
        >
          <div className={cn(embedded ? "space-y-4" : "space-y-6")}>
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

            <FormCard
              tone="primary"
              icon={Pencil}
              title={t("transaction.descriptionField")}
              titleId="transaction-description-heading"
              embedded={embedded}
              delay={0.1}
            >
              <FormField error={descriptionError} required>
                <Input
                  id="transaction-description"
                  value={values.description ?? ""}
                  onChange={handleChange("description")}
                  onBlur={() => touch("description")}
                  placeholder={t("transaction.descriptionPlaceholder")}
                  autoComplete="off"
                  aria-labelledby="transaction-description-heading"
                  aria-required="true"
                  aria-invalid={descriptionError ? true : undefined}
                  className="h-12 text-base focus:ring-2 focus:ring-primary/20"
                />
              </FormField>
            </FormCard>

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

            <FormCard
              tone="amber"
              icon={Camera}
              title={t("transaction.receipt")}
              embedded={embedded}
              delay={0.15}
            >
              <FormField>
                <FileUpload
                  compact={embedded}
                  value={values.receiptUrl}
                  onChange={handleReceiptChange}
                  labels={{
                    uploadLabel: t("transaction.uploadReceipt"),
                    viewLabel: t("transaction.viewReceipt"),
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
            </FormCard>

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
                embedded={embedded}
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
                embedded={embedded}
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
