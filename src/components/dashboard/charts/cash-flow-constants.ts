"use client";

import type { ChartLayer } from "@components/charts";

export type ChartType = "area" | "bar" | "line";
export type TimePeriod = "week" | "month";

export const INCOME_COLOR = "#22c55e";
export const EXPENSE_COLOR = "#ef4444";
export const BALANCE_COLOR = "#3b82f6";
export const NET_COLOR = "#8b5cf6";

export function buildInitialLayers(t: (key: string) => string): ChartLayer[] {
  return [
    {
      id: "income",
      name: t("charts.income"),
      type: "area",
      visible: true,
      color: INCOME_COLOR,
      dataKey: "income",
    },
    {
      id: "expenses",
      name: t("charts.expenses"),
      type: "area",
      visible: true,
      color: EXPENSE_COLOR,
      dataKey: "expenses",
    },
    {
      id: "balance",
      name: t("charts.balance"),
      type: "line",
      visible: false,
      color: BALANCE_COLOR,
      dataKey: "balance",
    },
    {
      id: "net",
      name: t("charts.net"),
      type: "line",
      visible: false,
      color: NET_COLOR,
      dataKey: "net",
    },
  ];
}
