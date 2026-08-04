import { format } from "date-fns";
import { parseDateOnly } from "@/lib/date-only";

export const DATE_PRESETS = {
  today: "today",
  currentMonth: "currentMonth",
  last3months: "last3months",
  custom: "custom",
} as const;

export type DatePreset = (typeof DATE_PRESETS)[keyof typeof DATE_PRESETS];

export interface DateRange {
  from: Date;
  to: Date;
}

export function resolvePreset(preset: DatePreset): DateRange | null {
  const now = new Date();

  switch (preset) {
    case "today": {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      return {
        from: today,
        to: today,
      };
    }

    case "currentMonth":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };

    case "last3months":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };

    default:
      return null;
  }
}

export function presetLabel(preset: DatePreset, t: (key: string) => string) {
  switch (preset) {
    case "today":
      return t("transactions.datePresets.today");

    case "currentMonth":
      return t("transactions.datePresets.currentMonth");

    case "last3months":
      return t("transactions.datePresets.last3months");

    case "custom":
      return t("transactions.datePresets.custom");
  }
}

export function matchPreset(
  fromStr?: string,
  toStr?: string,
): DatePreset | null {
  if (!fromStr || !toStr) {
    return null;
  }

  const fromDate = parseDateOnly(fromStr);
  const toDate = parseDateOnly(toStr);

  if (!fromDate || !toDate) {
    return null;
  }

  for (const preset of Object.values(DATE_PRESETS)) {
    if (preset === "custom") {
      continue;
    }

    const range = resolvePreset(preset);

    if (
      range &&
      fromDate.getTime() === range.from.getTime() &&
      toDate.getTime() === range.to.getTime()
    ) {
      return preset;
    }
  }

  return "custom";
}

export function formatDateRange(from?: Date, to?: Date) {
  if (!from || !to) {
    return undefined;
  }

  return `${format(from, "dd/MM/yyyy")} - ${format(to, "dd/MM/yyyy")}`;
}
