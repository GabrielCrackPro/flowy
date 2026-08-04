"use client";

import {
  type DatePreset,
  matchPreset,
  presetLabel,
  resolvePreset,
} from "@utils/date-range";
import { format } from "date-fns";
import { useState } from "react";
import { parseDateOnly } from "@/lib/date-only";

interface Params {
  fieldKey: string;
  label: string;
  placeholder?: string;
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
  t: (key: string) => string;
}

export function useDateRangeFilter({
  fieldKey,
  label,
  placeholder,
  values,
  onChange,
  t,
}: Params) {
  const fromKey = `${fieldKey}From`;
  const toKey = `${fieldKey}To`;

  const fromStr = values[fromKey];
  const toStr = values[toKey];

  const [open, setOpen] = useState(false);

  const [view, setView] = useState<"presets" | "calendar">(
    fromStr ? "calendar" : "presets",
  );

  const fromDate = parseDateOnly(fromStr) ?? undefined;
  const toDate = parseDateOnly(toStr) ?? undefined;

  const currentPreset = matchPreset(fromStr, toStr);

  const currentLabel =
    currentPreset && currentPreset !== "custom"
      ? presetLabel(currentPreset, t)
      : fromDate && toDate
        ? `${format(fromDate, "dd/MM/yyyy")} - ${format(toDate, "dd/MM/yyyy")}`
        : (placeholder ?? label);

  const isActive = Boolean(fromStr || toStr);

  function applyPreset(preset: DatePreset) {
    if (preset === "custom") {
      setView("calendar");
      return;
    }

    const range = resolvePreset(preset);

    if (!range) {
      return;
    }

    onChange(fromKey, format(range.from, "yyyy-MM-dd"));

    onChange(toKey, format(range.to, "yyyy-MM-dd"));

    setOpen(false);
    setView("presets");
  }

  function clear() {
    onChange(fromKey, undefined);
    onChange(toKey, undefined);
    setView("presets");
  }

  return {
    open,
    setOpen,
    view,
    setView,
    fromKey,
    toKey,
    fromDate,
    toDate,
    currentPreset,
    currentLabel,
    isActive,
    applyPreset,
    clear,
  };
}
