"use client";

import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";

interface UseAmountInputProps {
  initialValue: number;
  onValueChange: (value: number) => void;
  onTouch?: (field: string) => void;
  locale?: string;
}

export function useAmountInput({
  initialValue,
  onValueChange,
  onTouch,
  locale = "en-US",
}: UseAmountInputProps) {
  const [rawAmount, setRawAmount] = useState(
    initialValue > 0 ? initialValue.toFixed(2) : "",
  );
  const [focused, setFocused] = useState(false);

  // Format number with thousand separators for display
  const formatNumber = (num: number): string => {
    if (num === 0) return "";
    return num.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow only numbers and decimal point
      const cleaned = raw.replace(/[^0-9.]/g, "");
      if (
        cleaned === "" ||
        cleaned === "." ||
        cleaned === "0." ||
        /^\d*\.?\d{0,2}$/.test(cleaned)
      ) {
        setRawAmount(cleaned);
        const parsed = parseFloat(cleaned);
        onValueChange(Number.isNaN(parsed) ? 0 : parsed);
      }
    },
    [onValueChange],
  );

  const handleAmountFocus = useCallback(() => {
    setFocused(true);
    const currentAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ""));
    if (currentAmount > 0) {
      setRawAmount(currentAmount.toString());
    } else {
      setRawAmount("");
    }
  }, [rawAmount]);

  const handleAmountBlur = useCallback(() => {
    setFocused(false);
    onTouch?.("amount");
    const currentAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ""));
    if (currentAmount > 0) {
      setRawAmount(formatNumber(currentAmount));
    } else {
      setRawAmount("");
    }
  }, [rawAmount, onTouch, formatNumber]);

  const setAmount = useCallback(
    (amount: number) => {
      setRawAmount(formatNumber(amount));
      onValueChange(amount);
      onTouch?.("amount");
    },
    [onValueChange, onTouch, formatNumber],
  );

  return {
    rawAmount,
    handleAmountChange,
    handleAmountBlur,
    handleAmountFocus,
    setAmount,
  };
}
