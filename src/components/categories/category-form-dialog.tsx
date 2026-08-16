"use client";

import {
  CategoryIcon,
  EntitySheetFooter,
  EntitySheetHeader,
  FormSection,
  Icon,
  PreviewCard,
} from "@components/shared";
import { Input, Sheet, SheetContent } from "@components/ui";
import { useReactForm } from "@hooks/useReactForm";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpDown,
  Check,
  Palette,
  Sparkles,
  Tag,
} from "@/lib/icons";
import { createCategorySchema } from "@/lib/schemas/category";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/Category";
import { CATEGORY_COLORS } from "./category-colors";
import { CATEGORY_ICON_OPTIONS } from "./category-icons";

interface CategoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => void;
  isSubmitting?: boolean;
}

export function CategoryFormSheet({
  open,
  onOpenChange,
  category,
  onSubmit,
  isSubmitting = false,
}: CategoryFormSheetProps) {
  const { t } = useTranslation();

  const form = useReactForm({
    initialValues: {
      name: "",
      type: "EXPENSE" as "INCOME" | "EXPENSE",
      icon: undefined as string | undefined,
      color: undefined as string | undefined,
    },
    schema: createCategorySchema,
    onSubmit: (values) => {
      onSubmit({
        name: values.name.trim(),
        type: values.type,
        icon: values.icon,
        color: values.color,
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
      if (category) {
        rhfForm.setValue("name", category.name);
        rhfForm.setValue(
          "type",
          category.type === "INCOME" ? "INCOME" : "EXPENSE",
        );
        rhfForm.setValue("icon", category.icon ?? undefined);
        rhfForm.setValue("color", category.color ?? undefined);
      } else {
        rhfForm.reset();
      }
    }
  }, [open, category, rhfForm]);

  const trimmedName = values.name.trim();

  const canSubmit =
    trimmedName.length > 0 &&
    trimmedName.length <= 50 &&
    !isSubmitting &&
    !errors.name;

  const SelectedIcon = useMemo(
    () =>
      CATEGORY_ICON_OPTIONS.find((option) => option.key === values.icon)?.icon,
    [values.icon],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 h-full sm:max-w-xl"
      >
        <EntitySheetHeader
          icon={<CategoryIcon size="lg" />}
          iconGradient="from-primary/20 to-primary/10"
          iconColor="text-primary"
          title={category ? t("categories.edit") : t("categories.new")}
          subtitle={t("categories.description")}
          metadata={
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                values.type === "INCOME"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              <Icon
                icon={
                  values.type === "INCOME" ? ArrowUpCircle : ArrowDownCircle
                }
                className="size-3"
              />
              {values.type === "INCOME"
                ? t("transactions.income")
                : t("transactions.expenses")}
            </span>
          }
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
                    backgroundColor: values.color ?? "hsl(var(--muted))",
                  }}
                >
                  {SelectedIcon ? (
                    <Icon icon={SelectedIcon} className="size-6" />
                  ) : (
                    <Icon icon={Sparkles} className="size-6 opacity-50" />
                  )}
                </motion.div>
              }
            >
              <p className="text-lg font-semibold">
                {trimmedName || t("categories.namePlaceholder")}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    values.type === "INCOME"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {values.type === "INCOME"
                    ? t("transactions.income")
                    : t("transactions.expenses")}
                </span>
                {trimmedName && (
                  <span className="text-xs text-muted-foreground">
                    {t("common.preview")}
                  </span>
                )}
              </div>
            </PreviewCard>

            <FormSection
              label={t("categories.nameLabel")}
              htmlFor="category-name"
              icon={Tag}
              error={errors.name}
            >
              <Input
                id="category-name"
                value={values.name}
                maxLength={50}
                placeholder={t("categories.namePlaceholder")}
                onChange={handleChange("name")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSubmit();
                  }
                }}
                className="h-11"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{values.name.length}/50</span>
                {trimmedName.length > 0 && trimmedName.length <= 50 && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓ {t("common.valid")}
                  </span>
                )}
              </div>
            </FormSection>

            <FormSection label={t("categories.typeLabel")} icon={ArrowUpDown}>
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-background/80 p-1 shadow-inner">
                {(["EXPENSE", "INCOME"] as const).map((typeOption) => {
                  const active = values.type === typeOption;
                  const isExpenseType = typeOption === "EXPENSE";
                  const IconComponent = isExpenseType
                    ? ArrowDownCircle
                    : ArrowUpCircle;
                  return (
                    <motion.button
                      key={typeOption}
                      type="button"
                      onClick={() => handleValueChange("type")(typeOption)}
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
                          layoutId="category-type-bg"
                          className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border/20"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 32,
                          }}
                        />
                      ) : null}
                      <Icon icon={IconComponent} className="relative size-4" />
                      <span className="relative">
                        {isExpenseType
                          ? t("transactions.expenses")
                          : t("transactions.income")}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </FormSection>

            <FormSection label={t("categories.iconLabel")} icon={Sparkles}>
              <div className="grid grid-cols-8 gap-2.5">
                {CATEGORY_ICON_OPTIONS.map((option) => {
                  const selected = values.icon === option.key;
                  const IconComponent = option.icon;

                  return (
                    <motion.button
                      key={option.key}
                      type="button"
                      aria-label={option.key}
                      aria-pressed={selected}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        handleValueChange("icon")(
                          selected ? undefined : option.key,
                        )
                      }
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl border-2 transition relative overflow-hidden",
                        selected
                          ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/25 ring-2 ring-primary/10"
                          : "border-border/60 bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5 hover:text-foreground hover:shadow-md",
                      )}
                    >
                      <Icon icon={IconComponent} className="size-5" />
                      {selected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 opacity-20"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </FormSection>

            <FormSection label={t("categories.colorLabel")} icon={Palette}>
              <div className="grid grid-cols-8 gap-3">
                {CATEGORY_COLORS.map((candidate) => {
                  const selected = values.color === candidate;

                  return (
                    <motion.button
                      key={candidate}
                      type="button"
                      aria-label={candidate}
                      aria-pressed={selected}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() =>
                        handleValueChange("color")(
                          selected ? undefined : candidate,
                        )
                      }
                      className={cn(
                        "flex size-11 items-center justify-center rounded-full border-2 transition relative overflow-hidden",
                        selected
                          ? "scale-110 border-foreground shadow-xl ring-2 ring-background"
                          : "border-transparent hover:scale-110 hover:shadow-lg",
                      )}
                      style={{
                        backgroundColor: candidate,
                      }}
                    >
                      {selected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Icon
                            icon={Check}
                            className="size-5 text-white drop-shadow-md"
                          />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </FormSection>
          </div>
        </div>

        <EntitySheetFooter
          onCancel={() => onOpenChange(false)}
          onSubmit={() => handleSubmit()}
          submitLabel={category ? t("common.save") : t("common.create")}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
        />
      </SheetContent>
    </Sheet>
  );
}
