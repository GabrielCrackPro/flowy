"use client";

import { Icon } from "@components/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui";
import { useProfile } from "@hooks/useProfile";
import { useAmountInput, useCurrencyFormatting } from "@/hooks";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Plus, Minus, UserMinus, Settings } from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type QuickActionType = "add" | "subtract" | "set";

interface QuickActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  buttonColor?: string;
  actionLabel: string;
  actionType: QuickActionType;
  currentAmount?: number;
  targetAmount?: number;
  onAction: (amount: number) => void;
  isSubmitting?: boolean;
  quickAmounts?: number[];
  showProgress?: boolean;
  progressLabel?: string;
  progressLabelSuffix?: string;
  hideAmountInput?: boolean;
}

const DEFAULT_QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

export function QuickActionDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: IconComponent,
  iconColor = "text-amber-600",
  iconBgColor = "from-amber-500/20 to-amber-500/10",
  buttonColor = "from-amber-500 to-amber-600",
  actionLabel,
  actionType = "add",
  currentAmount = 0,
  targetAmount,
  onAction,
  isSubmitting = false,
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  showProgress = false,
  progressLabel,
  progressLabelSuffix,
  hideAmountInput = false,
}: QuickActionDialogProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const { currencySymbol, formatCompactAmount } = useCurrencyFormatting({
    locale,
    currency,
  });

  // Get currency symbol position
  const { currencySymbol: detectedSymbol, symbolPosition } = useMemo(() => {
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

  const amountInput = useAmountInput({
    initialValue: 0,
    onValueChange: () => {},
    onTouch: () => {},
    locale,
  });

  const handleSubmit = () => {
    const amount = hideAmountInput ? 1 : parseFloat(amountInput.rawAmount) || 0;

    // Validate amount before calling onAction
    if (amount <= 0 || isNaN(amount)) {
      console.error("Invalid amount in quick action:", amount);
      return;
    }

    onAction(amount);
    if (!hideAmountInput) {
      amountInput.setAmount(0);
    }
  };

  const handleQuickAmount = (amount: number) => {
    amountInput.setAmount(amount);
  };

  const remaining = targetAmount
    ? Math.max(0, targetAmount - currentAmount)
    : 0;
  const currentProgress =
    targetAmount && targetAmount > 0
      ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
      : 0;

  const actionIcon =
    actionType === "add" ? Plus : actionType === "subtract" ? Minus : Settings;

  const shouldShowProgress = showProgress && targetAmount && targetAmount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-amber-600 dark:text-amber-400",
                iconBgColor,
              )}
            >
              <IconComponent className="size-6" />
            </div>
            <div className="min-w-0">
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="truncate">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-6 space-y-6">
          {/* Progress display */}
          {shouldShowProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(currentAmount, locale, currency)}
                </span>
                <span className="font-medium">
                  {formatCurrency(targetAmount, locale, currency)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    buttonColor,
                  )}
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentProgress}%</span>
                <span>
                  {formatCurrency(remaining, locale, currency)}{" "}
                  {progressLabelSuffix || ""}
                </span>
              </div>
            </div>
          )}

          {/* Amount input */}
          {!hideAmountInput && (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                {symbolPosition === "before" && (
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className={cn(
                      "text-3xl font-semibold tabular-nums",
                      iconColor,
                      iconColor.replace("text-", "text-/70"),
                    )}
                  >
                    {detectedSymbol}
                  </motion.span>
                )}
                <input
                  value={amountInput.rawAmount}
                  onChange={amountInput.handleAmountChange}
                  onFocus={amountInput.handleAmountFocus}
                  onBlur={amountInput.handleAmountBlur}
                  placeholder="0.00"
                  autoComplete="off"
                  inputMode="decimal"
                  className={cn(
                    "w-full min-w-0 bg-transparent font-bold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/30 text-4xl",
                    iconColor,
                  )}
                />
                {symbolPosition === "after" && (
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className={cn(
                      "text-3xl font-semibold tabular-nums",
                      iconColor,
                      iconColor.replace("text-", "text-/70"),
                    )}
                  >
                    {detectedSymbol}
                  </motion.span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {quickAmounts?.map((amount, index) => {
                  const formatQuickAmount = (amt: number): string => {
                    if (symbolPosition === "before") {
                      return `${detectedSymbol}${amt.toLocaleString(locale)}`;
                    }
                    return `${amt.toLocaleString(locale)}${detectedSymbol}`;
                  };

                  return (
                    <motion.button
                      key={amount}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAmount(amount)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium tabular-nums transition-all",
                        parseFloat(
                          amountInput.rawAmount.replace(/[^0-9.]/g, ""),
                        ) === amount
                          ? cn(
                              "bg-gradient-to-r text-white shadow-md",
                              buttonColor,
                            )
                          : "bg-background/80 text-muted-foreground/80 ring-1 ring-border/30 hover:text-foreground hover:ring-border/50",
                      )}
                    >
                      {formatQuickAmount(amount)}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => amountInput.setAmount(0)}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={parseFloat(amountInput.rawAmount) <= 0 || isSubmitting}
            className={cn(
              "gap-2 bg-gradient-to-r hover:opacity-90",
              buttonColor,
            )}
          >
            <Icon icon={actionIcon} className="size-4" />
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
