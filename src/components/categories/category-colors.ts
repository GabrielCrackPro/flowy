export const CATEGORY_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#64748b",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export function colorWithAlpha(
  color: string | null | undefined,
  alpha: string,
) {
  return color ? `${color}${alpha}` : undefined;
}
