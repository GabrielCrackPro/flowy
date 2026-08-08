"use client";

import { colorWithAlpha } from "@components/categories/category-colors";
import { cn } from "@lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "@/lib/icons";
import type { FilterField } from "@/types/ui";
import { Icon } from "../icon";
import { FilterOptionIcon } from "./filter-option-icon";

interface ActiveFilterChipsProps {
  filters: Record<string, string | undefined>;
  fields: FilterField[];
  formatValue?: (key: string, value: string) => string | undefined;
  onRemove: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilterChips({
  filters,
  fields,
  formatValue,
  onRemove,
  onClearAll,
  className,
}: ActiveFilterChipsProps) {
  const { t } = useTranslation();
  const chips: { key: string; label: string; value: ReactNode }[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    if (key === "search") continue;

    if (key === "dateFrom") {
      const to = filters.dateTo;
      chips.push({
        key: "date",
        label: "Fecha",
        value: to ? `${value} - ${to}` : `Desde ${value}`,
      });
      continue;
    }
    if (key === "dateTo") {
      if (filters.dateFrom) continue;
      chips.push({
        key: "date",
        label: "Fecha",
        value: `Hasta ${value}`,
      });
      continue;
    }

    const field = fields.find((f) => f.key === key);
    const label = field?.label ?? key;

    const selectedOptions = field?.options?.filter((option) =>
      value.split(",").includes(option.value),
    );
    const hasRichOptions =
      selectedOptions?.some((option) => option.icon || option.color) ?? false;

    if (hasRichOptions) {
      chips.push({
        key,
        label,
        value: (
          <span className="flex flex-wrap items-center gap-1">
            {selectedOptions?.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 rounded-md border border-border/40 px-1.5 py-0.5 text-[11px] font-medium"
                style={
                  option.color
                    ? {
                        backgroundColor: colorWithAlpha(option.color, "14"),
                        color: option.color,
                      }
                    : undefined
                }
              >
                <FilterOptionIcon option={option} size="xs" />
                {option.label}
              </span>
            ))}
          </span>
        ),
      });
      continue;
    }

    const display = formatValue?.(key, value) ?? value;
    chips.push({ key, label, value: display });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.span
            key={chip.key}
            layout
            initial={{ opacity: 0, scale: 0.9, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 8 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="group inline-flex items-center gap-2 rounded-xl border border-border/30 bg-gradient-to-r from-primary/8 via-primary/5 to-primary/[0.02] px-3 py-1.5 text-[11px] font-medium text-foreground/90 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
          >
            <span className="text-muted-foreground/60">{chip.label}:</span>
            <span className="font-medium">{chip.value}</span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemove(chip.key)}
              className="ml-0.5 flex size-4.5 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-primary/20 hover:text-primary"
            >
              <Icon icon={X} className="size-3.5" />
            </motion.button>
          </motion.span>
        ))}
      </AnimatePresence>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        onClick={onClearAll}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border/30 px-3 py-1.5 text-[11px] font-medium text-muted-foreground/50 transition-all hover:border-border/50 hover:bg-gradient-to-r hover:from-muted/40 hover:to-muted/20 hover:text-foreground shadow-sm hover:shadow-md"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon icon={X} className="size-3.5" />
        {t("filters.clearAll")}
      </motion.button>
    </div>
  );
}
