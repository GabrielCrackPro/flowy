"use client";

import type { ChartConfig } from "@components/ui";

export function CashFlowLegend({
  payload,
  chartConfig,
}: {
  payload?: Array<{ value?: string | number; color?: string }>;
  chartConfig: ChartConfig;
}) {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      {payload.map((entry) => {
        const key = String(entry.value) as keyof typeof chartConfig;
        const label = chartConfig[key]?.label ?? String(entry.value);
        return (
          <div
            key={`${entry.value}-${entry.color}`}
            className="flex items-center gap-1.5"
          >
            <div
              className="size-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
