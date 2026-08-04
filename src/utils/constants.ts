import type { TFunction } from "i18next";
import type { IconProps } from "@/components/shared";
import { Asterisk, Banknote, Coins, CreditCard } from "@/lib/icons";

export const PAYMENT_METHOD_KEY: Record<string, string> = {
  CASH: "paymentMethods.cash",
  CARD: "paymentMethods.card",
  BANK_TRANSFER: "paymentMethods.bankTransfer",
  BIZUM: "paymentMethods.bizum",
  PAYPAL: "paymentMethods.paypal",
  OTHER: "paymentMethods.other",
};

export const PAYMENT_METHOD_ICON: Record<string, IconProps["icon"]> = {
  CASH: Coins,
  CARD: CreditCard,
  BANK_TRANSFER: Banknote,
  BIZUM: Asterisk,
  PAYPAL: Asterisk,
  OTHER: Asterisk,
};

export const EXPENSE_TYPE_KEY: Record<string, string> = {
  INCOME: "transactions.income",
  EXPENSE: "transactions.expenses",
};

export function getOptions(map: Record<string, string>, t: TFunction) {
  return Object.entries(map).map(([value, key]) => ({
    value,
    label: t(key),
  }));
}
