"use client";

import { Input } from "@components/ui";
import { cn } from "@lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "@/lib/icons";

interface CurrencyInputProps {
  id: string;
  value: number;
  onValueChange: (value: number) => void;
  currency: string;
  locale?: string;
  placeholder?: string;
  min?: number;
  step?: number | string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  showQuickAmounts?: boolean;
  quickAmounts?: number[];
  showIncrementButtons?: boolean;
}

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

export function CurrencyInput({
  id,
  value,
  onValueChange,
  currency,
  locale = "en-US",
  placeholder,
  min = 0,
  step = "0.01",
  onKeyDown,
  showQuickAmounts = false,
  quickAmounts = [10, 50, 100, 500, 1000],
  showIncrementButtons = false,
}: CurrencyInputProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const stepValue = useMemo(
    () => (typeof step === "string" ? parseFloat(step) : step),
    [step],
  );

  // Locale-aware decimal separator (e.g. "." for en-US, "," for es-ES)
  const decimalSeparator = useMemo(() => {
    try {
      const parts = new Intl.NumberFormat(locale, {
        style: "decimal",
        minimumFractionDigits: 1,
      }).formatToParts(1.1);
      return parts.find((part) => part.type === "decimal")?.value ?? ".";
    } catch {
      return ".";
    }
  }, [locale]);

  // Get proper currency symbol and position
  const { currencySymbol, symbolPosition } = useMemo(() => {
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

  // Format number with thousand separators for display
  const formatNumber = useCallback(
    (num: number): string => {
      if (num === 0) return "";
      return num.toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    },
    [locale],
  );

  // Keep editValue in sync when value changes externally (quick amounts,
  // arrow keys, reset on edit) without clobbering the text while typing.
  useEffect(() => {
    if (focused) {
      const parsed = parseFloat(editValue);
      if (!Number.isNaN(parsed) && parsed !== value) {
        setEditValue(value > 0 ? String(value) : "");
      }
    } else {
      setEditValue(formatNumber(value));
    }
  }, [value, focused, editValue, formatNumber]);

  // Allow only numbers, a single decimal point, and normalize locale separators
  const sanitize = (raw: string): string => {
    let out =
      decimalSeparator === ","
        ? raw.replace(/\./g, "").replace(/,/g, ".")
        : raw.replace(/,/g, "").replace(/\./g, ".");
    out = out.replace(/[^0-9.]/g, "");
    const firstDot = out.indexOf(".");
    if (firstDot !== -1) {
      out =
        out.slice(0, firstDot + 1) + out.slice(firstDot + 1).replace(/\./g, "");
    }
    if (out.startsWith(".")) out = `0${out}`;
    return out;
  };

  const clampToMin = (next: number): number =>
    next > 0 && next < min ? min : next;

  const handleStep = (delta: number) => {
    onValueChange(Math.max(min, roundToCents(value + delta * stepValue)));
    inputRef.current?.focus();
  };

  const handleQuickAmount = (amount: number) => {
    onValueChange(amount);
    if (focused) setEditValue(amount > 0 ? String(amount) : "");
  };

  const formatQuickAmount = (amount: number): string => {
    if (symbolPosition === "before") {
      return `${currencySymbol}${amount.toLocaleString(locale)}`;
    }
    return `${amount.toLocaleString(locale)}${currencySymbol}`;
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {showIncrementButtons && (
          <button
            type="button"
            aria-label={t("common.decreaseAmount")}
            onClick={() => handleStep(-1)}
            disabled={value <= min}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex size-7 items-center justify-center rounded-md border border-border/50 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="size-3" />
          </button>
        )}

        {/* Currency symbol before amount */}
        {symbolPosition === "before" && (
          <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground/70 z-10">
            {currencySymbol}
          </span>
        )}

        <Input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          step={step}
          min={min}
          value={focused ? editValue : formatNumber(value)}
          onChange={(event) => {
            const cleaned = sanitize(event.target.value);
            const parsed = parseFloat(cleaned);
            setEditValue(cleaned);
            onValueChange(Number.isNaN(parsed) ? 0 : roundToCents(parsed));
          }}
          onFocus={(event) => {
            setFocused(true);
            setEditValue(value > 0 ? String(value) : "");
            event.currentTarget.select();
          }}
          onBlur={() => {
            const clamped = clampToMin(value);
            if (clamped !== value) onValueChange(clamped);
            setFocused(false);
            setEditValue(formatNumber(clamped));
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              handleStep(1);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              handleStep(-1);
              return;
            }
            // Prevent form submission with Enter if value is invalid
            if (event.key === "Enter") {
              const currentValue = parseFloat(
                sanitize(event.currentTarget.value),
              );
              if (Number.isNaN(currentValue) || currentValue < min) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }
            }
            onKeyDown?.(event);
          }}
          placeholder={placeholder}
          className={cn(
            "h-11 transition",
            "pl-4 pr-4",
            showIncrementButtons && "pl-12 pr-12",
            symbolPosition === "before" && "pl-8",
            symbolPosition === "after" && "pr-12",
            focused && "ring-2 ring-primary/20",
          )}
        />

        {/* Currency symbol after amount */}
        {symbolPosition === "after" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground/70 z-10">
            {currencySymbol}
          </span>
        )}

        {showIncrementButtons && (
          <button
            type="button"
            aria-label={t("common.increaseAmount")}
            onClick={() => handleStep(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex size-7 items-center justify-center rounded-md border border-border/50 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3" />
          </button>
        )}
      </div>

      {showQuickAmounts && (
        <div className="flex flex-wrap gap-1.5">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickAmount(amount)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium tabular-nums transition",
                value === amount
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {formatQuickAmount(amount)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
