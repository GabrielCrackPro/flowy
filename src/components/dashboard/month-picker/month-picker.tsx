"use client";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui";
import { useProfile } from "@hooks/useProfile";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

const arrowButtonClass =
  "size-9 rounded-xl border-border/60 text-muted-foreground/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-border hover:bg-muted/60 hover:text-foreground hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]";

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  useEffect(() => {
    setPickerYear(year);
  }, [year]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const isCurrent = month === currentMonth && year === currentYear;

  const locale = profile?.locale ?? "es-ES";

  const monthsShort = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
    return Array.from({ length: 12 }, (_, i) =>
      formatter.format(new Date(2000, i, 1)),
    );
  }, [locale]);

  const monthName = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long" }).format(
        new Date(year, month - 1),
      ),
    [locale, month, year],
  );

  function prev() {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  }

  function next() {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  }

  function selectMonth(m: number) {
    onChange(m, pickerYear);
    setOpen(false);
  }

  function goToToday() {
    onChange(currentMonth, currentYear);
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={prev}
        aria-label={t("dashboard.prevMonth")}
        className={arrowButtonClass}
      >
        <Icon icon={ChevronLeft} className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "group flex min-w-36 cursor-pointer items-center gap-2 rounded-xl border border-border/40 bg-muted/30 py-2 pl-2.5 pr-1.5 text-sm transition duration-150 sm:min-w-44 sm:gap-2.5 sm:pl-3 sm:pr-2",
            "hover:border-primary/40 hover:bg-muted/50 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            "data-open:border-primary/40 data-open:bg-muted/50 data-open:shadow-sm",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <Icon icon={Calendar} className="size-4" />
          </span>
          <span className="truncate font-semibold capitalize tabular-nums">
            {monthName}
          </span>
          <span className="text-xs font-medium text-muted-foreground/60">
            {year}
          </span>
          {isCurrent && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors group-hover:text-foreground"
          >
            <Icon icon={ChevronDown} className="size-3.5" />
          </motion.span>
        </PopoverTrigger>

        <PopoverContent
          align="center"
          className="w-64 max-w-[calc(100vw-2rem)] p-3"
        >
          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {t("dashboard.selectMonth")}
            </span>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setPickerYear((y) => y - 1)}
                aria-label={t("dashboard.prevYear")}
                className="size-7 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
              >
                <Icon icon={ChevronLeft} className="size-4" />
              </Button>
              <span className="min-w-10 text-center text-sm font-semibold tabular-nums">
                {pickerYear}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setPickerYear((y) => y + 1)}
                aria-label={t("dashboard.nextYear")}
                className="size-7 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
              >
                <Icon icon={ChevronRight} className="size-4" />
              </Button>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-3 gap-1.5 pt-2"
          >
            {monthsShort.map((name, i) => {
              const m = i + 1;
              const isSelected = m === month && pickerYear === year;
              const isToday = m === currentMonth && pickerYear === currentYear;
              return (
                <Button
                  key={m}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => selectMonth(m)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "flex h-10 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium capitalize",
                    isSelected
                      ? "shadow-sm"
                      : isToday
                        ? "text-primary ring-1 ring-primary/30 hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {name}
                </Button>
              );
            })}
          </motion.div>

          {!isCurrent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.18 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="mt-2.5 flex w-full items-center gap-1.5 border-primary/20 bg-primary/[0.04] text-xs font-semibold text-primary hover:bg-primary/[0.1]"
              >
                <Icon icon={Calendar} className="size-3.5" />
                {t("dashboard.backToToday")}
              </Button>
            </motion.div>
          )}
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={next}
        aria-label={t("dashboard.nextMonth")}
        className={arrowButtonClass}
      >
        <Icon icon={ChevronRight} className="size-4" />
      </Button>
    </div>
  );
}
