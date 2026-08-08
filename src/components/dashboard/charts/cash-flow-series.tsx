"use client";

import type { ChartLayer } from "@components/charts";
import { Area, Bar, Line } from "recharts";
import type { ChartType } from "./cash-flow-constants";

export function renderSeries(layer: ChartLayer, chartType: ChartType) {
  const { dataKey, color } = layer;
  if (!dataKey) return null;

  const fillOpacity = chartType === "area" ? 0.2 : undefined;

  if (chartType === "area") {
    return (
      <Area
        key={layer.id}
        dataKey={dataKey}
        type="monotone"
        fill={color}
        fillOpacity={fillOpacity}
        stroke={color}
        strokeWidth={2}
      />
    );
  }

  if (chartType === "bar") {
    return (
      <Bar
        key={layer.id}
        dataKey={dataKey}
        fill={color}
        radius={[4, 4, 0, 0]}
      />
    );
  }

  return (
    <Line
      key={layer.id}
      dataKey={dataKey}
      type="monotone"
      stroke={color}
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 4 }}
    />
  );
}
