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
import { useTranslation } from "react-i18next";
import {
  OPTION_ROW_BASE,
  OPTION_ROW_INTERACTION,
  OPTION_ROW_SELECTED,
} from "@/components/ui/control-styles";
import { useDateRangeFilter } from "@/hooks/filter";
import { useDateLocale } from "@/hooks/useDateLocale";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Check, ChevronDown, ChevronLeft, X } from "@/lib/icons";
import type { FilterField } from "@/types/ui";
import { Icon } from "../icon";
import { FilterButton } from "./filter-button";
import { FilterFieldIcon } from "./filter-field-icon";

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
  const { i18n } = useTranslation();
  const dateLocale = useDateLocale(i18n.language);
  const compact = useIsMobile();

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
      <div className="flex min-w-0 items-center gap-1 max-sm:w-full">
        <PopoverTrigger
          render={
            <FilterButton
              active={isActive}
              className="min-w-0 flex-1 max-sm:justify-start"
              aria-label={field.label}
            >
              <FilterFieldIcon field={field} active={isActive} />

              <span className="min-w-0 flex-1 whitespace-nowrap text-left">
                {currentLabel}
              </span>
              <Icon icon={ChevronDown} className="ml-auto size-3 shrink-0" />
            </FilterButton>
          }
        />

        {isActive && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={clear}
            aria-label={t("filters.clearSelection")}
            title={t("filters.clearSelection")}
            className="size-10 shrink-0 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground sm:size-8"
          >
            <Icon icon={X} className="size-3.5" />
          </Button>
        )}
      </div>

      <PopoverContent
        align="start"
        className={cn(
          "rounded-xl border-border/50 shadow-lg",
          view === "presets"
            ? "w-[min(20rem,calc(100vw-2rem))] p-2.5"
            : "w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-1.5",
        )}
        sideOffset={8}
      >
        {view === "presets" ? (
          <div className="flex flex-col gap-1">
            <div className="mb-1 flex items-center justify-between gap-3 border-b border-border/40 px-1 pb-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-xs font-semibold text-foreground">
                  {field.label}
                </span>
                {isActive && (
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-1 ring-primary/20">
                    1
                  </span>
                )}
              </div>
              {isActive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={clear}
                  className="h-8 shrink-0 rounded-lg px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {t("filters.clearSelection")}
                </Button>
              )}
            </div>

            {(
              ["today", "currentMonth", "last3months", "custom"] as DatePreset[]
            ).map((preset) => {
              const isSelected = currentPreset === preset;

              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={isSelected}
                  className={cn(
                    OPTION_ROW_BASE,
                    "min-h-11 cursor-pointer justify-start gap-3 px-3",
                    OPTION_ROW_INTERACTION,
                    isSelected ? OPTION_ROW_SELECTED : "text-muted-foreground",
                    "focus-visible:ring-2 focus-visible:ring-primary/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/60 bg-background",
                    )}
                  >
                    {isSelected && <Icon icon={Check} className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1 text-left font-medium">
                    {t(`transactions.datePresets.${preset}`)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setView("presets")}
              className="mb-1 h-9 gap-2 rounded-lg px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon icon={ChevronLeft} className="size-3.5" />

              <span>{t("transactions.datePresets.presets")}</span>
            </Button>

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
              locale={dateLocale}
              className="rounded-lg"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
