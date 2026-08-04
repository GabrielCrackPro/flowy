import {
  downloadCSV,
  downloadPDF,
  type ExportConfig,
} from "@lib/export-documents";
import { PAYMENT_METHOD_KEY } from "@utils/constants";
import { parseDateOnly } from "@/lib/date-only";
import type { Transaction } from "@/types/Transaction";

type Translate = (key: string) => string;

function formatTransactionDate(value: string | null, locale: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDateOnly(value) ?? new Date(value));
}

function getTagsLabel(transaction: Transaction): string {
  const tags = transaction.tags ?? [];

  return tags.length > 0 ? tags.map((tag) => tag.name).join(", ") : "—";
}

function getPaymentMethodLabel(
  paymentMethod: Transaction["paymentMethod"],
  t: Translate,
) {
  if (!paymentMethod) {
    return "—";
  }

  return t(PAYMENT_METHOD_KEY[paymentMethod] ?? paymentMethod);
}

function buildExportConfig(
  transactions: Transaction[],
  t: Translate,
  locale: string,
  currency: string,
): ExportConfig<Transaction> {
  const income = transactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    title: t("transactions.title"),
    subtitle: t("transactions.description"),
    filename: `transactions-${new Date().toISOString().slice(0, 10)}`,
    locale,
    date: new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
    data: transactions,
    columns: [
      {
        key: "date",
        header: t("transactions.date"),
        render: (transaction) =>
          formatTransactionDate(transaction.date, locale),
      },
      {
        key: "type",
        header: t("transactions.type"),
        render: (transaction) =>
          transaction.type === "INCOME"
            ? t("transactions.income")
            : t("transactions.expenses"),
      },
      {
        key: "description",
        header: t("transactions.descriptionCol"),
        render: (transaction) => transaction.description?.trim() || "—",
      },
      {
        key: "category",
        header: t("transactions.category"),
        render: (transaction) => getTagsLabel(transaction),
      },
      {
        key: "paymentMethod",
        header: t("transactions.paymentMethod"),
        render: (transaction) =>
          getPaymentMethodLabel(transaction.paymentMethod, t),
      },
      {
        key: "amount",
        header: t("transactions.amount"),
        render: (transaction) =>
          new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
          }).format(transaction.amount),
      },
    ],
    totals: [
      {
        label: t("transactions.income"),
        value: new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        }).format(income),
      },
      {
        label: t("transactions.expenses"),
        value: new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        }).format(expenses),
      },
      {
        label: t("transactions.balance"),
        value: new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        }).format(income - expenses),
      },
    ],
  };
}

export function exportCSV(
  transactions: Transaction[],
  t: Translate,
  locale: string,
  currency: string,
) {
  downloadCSV(buildExportConfig(transactions, t, locale, currency));
}

export function exportPDF(
  transactions: Transaction[],
  t: Translate,
  locale: string,
  currency: string,
) {
  downloadPDF(buildExportConfig(transactions, t, locale, currency));
}
