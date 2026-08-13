"use client";

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui";
import { cn } from "@lib/utils";
import type { DatePreset } from "@utils/date-range";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useDateRangeFilter } from "@/hooks/filter";
import { CalendarIcon, Check, ChevronLeft, X } from "@/lib/icons";
import type { FilterField } from "@/types/ui";
import { Icon } from "../icon";
import { FilterButton } from "./filter-button";

interface DateRangeFilterProps {
  field: FilterField;
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
  t: (key: string) => string;
}

export function DateRangeFilter({
  field,
  values,
  onChange,
  t,
}: DateRangeFilterProps) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const {
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
  } = useDateRangeFilter({
    fieldKey: field.key,
    label: field.label,
    placeholder: field.placeholder,
    values,
    onChange,
    t,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <FilterButton
            active={isActive}
            className="max-sm:w-full max-sm:justify-between"
          >
            <Icon icon={CalendarIcon} className="size-4 shrink-0" />

            <span className="max-w-36 truncate">{currentLabel}</span>

            {isActive && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                className="ml-1"
              >
                <Icon icon={X} className="size-3.5" />
              </Button>
            )}
          </FilterButton>
        }
      />

      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-2rem)] min-w-52 overflow-x-auto rounded-xl border-border/30 p-2 shadow-xl"
        sideOffset={8}
      >
        {view === "presets" ? (
          <div className="flex flex-col gap-1">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t("transactions.datePresets.presets")}
            </div>

            {(
              ["today", "currentMonth", "last3months", "custom"] as DatePreset[]
            ).map((preset, index) => (
              <motion.div
                key={preset}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "w-full justify-start gap-3 text-xs",
                    currentPreset === preset
                      ? "bg-gradient-to-r from-primary/12 to-primary/6 text-primary font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 hover:text-foreground",
                  )}
                >
                  <div className="flex size-4.5 shrink-0 items-center justify-center">
                    {currentPreset === preset && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon icon={Check} className="size-3.5" />
                      </motion.div>
                    )}
                  </div>

                  <span>{t(`transactions.datePresets.${preset}`)}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("presets")}
                className="mb-2 gap-2 text-xs text-muted-foreground hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 hover:text-foreground"
              >
                <Icon icon={ChevronLeft} className="size-3.5" />

                <span>{t("transactions.datePresets.presets")}</span>
              </Button>
            </motion.div>

            <Calendar
              mode="range"
              selected={{
                from: fromDate,
                to: toDate,
              }}
              onSelect={(range) => {
                onChange(
                  fromKey,
                  range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
                );

                onChange(
                  toKey,
                  range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
                );
              }}
              numberOfMonths={compact ? 1 : 2}
              className="rounded-lg"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
