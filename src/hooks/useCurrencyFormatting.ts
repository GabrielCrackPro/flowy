import { useMemo } from "react";

interface UseCurrencyFormattingProps {
  locale: string;
  currency: string;
}

export function useCurrencyFormatting({
  locale,
  currency,
}: UseCurrencyFormattingProps) {
  const currencySymbol = useMemo(() => {
    try {
      return (
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        })
          .formatToParts(0)
          .find((part) => part.type === "currency")?.value ?? ""
      );
    } catch {
      return "";
    }
  }, [locale, currency]);

  const formatCompactAmount = useMemo(
    () => (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount),
    [locale, currency],
  );

  return { currencySymbol, formatCompactAmount };
}
