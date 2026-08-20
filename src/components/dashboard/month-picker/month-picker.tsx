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
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  /** Compact header variant: drops the prev/next arrows, keeps the trigger. */
  compact?: boolean;
}

const arrowButtonClass =
  "size-9 rounded-xl border-border/60 text-muted-foreground/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-border hover:bg-muted/60 hover:text-foreground hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]";

type Panel = "months" | "years";

interface PanelGridProps {
  panel: Panel;
  month: number;
  year: number;
  pickerYear: number;
  monthsShort: string[];
  currentMonth: number;
  currentYear: number;
  onSelect: (m: number) => void;
  onPickerYear: (year: number) => void;
  onPanelChange: (panel: Panel) => void;
  cols?: 3 | 4;
}

interface MonthGridProps
  extends Omit<PanelGridProps, "panel" | "onPanelChange"> {}

/** The 12-month grid, shared by the desktop popover and the mobile bottom
 *  sheet so both surfaces stay pixel-identical. */
function MonthGrid({
  month,
  year,
  pickerYear,
  monthsShort,
  currentMonth,
  currentYear,
  onSelect,
  cols = 3,
}: MonthGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.16 }}
      className={cn(
        "grid gap-1.5 pt-2",
        cols === 3 ? "grid-cols-3" : "grid-cols-4",
      )}
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
            onClick={() => onSelect(m)}
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
  );
}

interface YearGridProps {
  year: number;
  pickerYear: number;
  currentYear: number;
  onSelect: (year: number) => void;
  onPickerYear: (year: number) => void;
}

/** Decade year grid (e.g. 2020–2029): tap a year to jump straight to it,
 *  steppers to move by decade, and a one-tap return to the current year. */
function YearGrid({
  year,
  pickerYear,
  currentYear,
  onSelect,
  onPickerYear,
}: YearGridProps) {
  const { t } = useTranslation();
  const start = Math.floor(pickerYear / 10) * 10;
  const years = Array.from({ length: 10 }, (_, i) => start + i);

  return (
    <>
      <div className="flex items-center justify-between gap-2 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {t("dashboard.years")}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPickerYear(start - 1)}
            aria-label={t("dashboard.prevDecade")}
            className="size-7 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
          >
            <Icon icon={ChevronLeft} className="size-4" />
          </Button>
          <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums">
            {start}–{start + 9}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPickerYear(start + 10)}
            aria-label={t("dashboard.nextDecade")}
            className="size-7 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
          >
            <Icon icon={ChevronRight} className="size-4" />
          </Button>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      <motion.div
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.16 }}
        className="grid grid-cols-5 gap-2 pt-3"
      >
        {years.map((y) => {
          const isSelected = y === pickerYear;
          const isCurrent = y === currentYear;
          return (
            <Button
              key={y}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={() => onSelect(y)}
              aria-pressed={isSelected}
              aria-current={isCurrent ? "date" : undefined}
              className={cn(
                "flex h-11 items-center justify-center rounded-xl text-sm font-medium tabular-nums",
                isSelected
                  ? "shadow-sm"
                  : isCurrent
                    ? "text-primary ring-1 ring-primary/30 hover:bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {y}
            </Button>
          );
        })}
      </motion.div>

      {pickerYear !== currentYear && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.16 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(currentYear)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 border-primary/20 bg-primary/[0.04] text-xs font-semibold text-primary hover:bg-primary/[0.1]"
          >
            <Icon icon={Calendar} className="size-3.5" />
            {t("dashboard.jumpToCurrentYear")}
          </Button>
        </motion.div>
      )}
    </>
  );
}

/** Panel switcher: renders the month grid or the year grid. Both panels share
 *  the same header row and divider, so switching only swaps the tiles. */
function PanelGrid(props: PanelGridProps) {
  const { panel, onPanelChange } = props;
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between gap-2 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPanelChange(panel === "months" ? "years" : "months")}
          aria-expanded={panel === "years"}
          aria-label={t("dashboard.toggleYearRange")}
          className="-ml-1.5 h-7 gap-1 px-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:bg-muted hover:text-foreground"
        >
          {panel === "months"
            ? t("dashboard.selectMonth")
            : t("dashboard.years")}
          <motion.span
            animate={{ rotate: panel === "years" ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            className="flex size-3.5 items-center justify-center"
          >
            <Icon icon={ChevronDown} className="size-3" />
          </motion.span>
        </Button>
        <div className="flex items-center gap-0.5">
          {panel === "months" ? (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => props.onPickerYear(props.pickerYear - 1)}
                aria-label={t("dashboard.prevYear")}
                className="size-7 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
              >
                <Icon icon={ChevronLeft} className="size-4" />
              </Button>
              <span className="min-w-10 text-center text-sm font-semibold tabular-nums">
                {props.pickerYear}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => props.onPickerYear(props.pickerYear + 1)}
                aria-label={t("dashboard.nextYear")}
                className="size-7 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
              >
                <Icon icon={ChevronRight} className="size-4" />
              </Button>
            </>
          ) : (
            <span className="px-1 text-sm font-semibold capitalize tabular-nums">
              {props.year}
            </span>
          )}
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {panel === "months" ? (
        <MonthGrid {...props} />
      ) : (
        <YearGrid
          year={props.year}
          pickerYear={props.pickerYear}
          currentYear={props.currentYear}
          onSelect={props.onPickerYear}
          onPickerYear={props.onPickerYear}
        />
      )}
    </>
  );
}

export function MonthPicker({
  month,
  year,
  onChange,
  compact = false,
}: MonthPickerProps) {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("months");
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

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    // Start each opening from the month panel.
    if (nextOpen) setPanel("months");
  }

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

  const grid = (
    <PanelGrid
      panel={panel}
      month={month}
      year={year}
      pickerYear={pickerYear}
      monthsShort={monthsShort}
      currentMonth={currentMonth}
      currentYear={currentYear}
      onSelect={selectMonth}
      onPickerYear={setPickerYear}
      onPanelChange={setPanel}
      cols={isMobile ? 3 : 4}
    />
  );

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {!compact && (
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          aria-label={t("dashboard.prevMonth")}
          className={arrowButtonClass}
        >
          <Icon icon={ChevronLeft} className="size-4" />
        </Button>
      )}

      <Popover open={!isMobile && open} onOpenChange={handleOpenChange}>
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

        {/* Desktop: anchored popover with a selected-month header. */}
        <PopoverContent
          align="center"
          className="w-72 max-w-[calc(100vw-2rem)] p-3"
        >
          <div className="flex items-center justify-between gap-2 pb-2.5">
            <span className="truncate text-sm font-semibold capitalize tabular-nums">
              {monthName}{" "}
              <span className="font-medium text-muted-foreground/60">
                {year}
              </span>
            </span>
            {!isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="-mr-1 h-7 gap-1 px-2 text-xs font-medium text-primary hover:bg-primary/10"
              >
                <Icon icon={Calendar} className="size-3.5" />
                {t("dashboard.backToToday")}
              </Button>
            )}
          </div>
          {grid}
        </PopoverContent>
      </Popover>

      {/* Mobile: full-width bottom sheet with a footer action. */}
      <BottomSheet
        open={isMobile && open}
        onOpenChange={handleOpenChange}
        title={t("dashboard.selectMonth")}
        description={`${monthName} · ${pickerYear}`}
        icon={<Icon icon={Calendar} className="size-5" />}
        snapPoints={[0.45, 0.9]}
        footer={
          !isCurrent ? (
            <Button
              variant="outline"
              onClick={goToToday}
              className="h-11 w-full gap-1.5 border-primary/20 bg-primary/[0.04] text-sm font-semibold text-primary hover:bg-primary/[0.1] sm:h-10 sm:w-auto"
            >
              <Icon icon={Calendar} className="size-4" />
              {t("dashboard.backToToday")}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground/60">
              {t("dashboard.currentMonthHint")}
            </span>
          )
        }
      >
        <div className="px-4 pb-4 pt-1">{grid}</div>
      </BottomSheet>

      {!compact && (
        <Button
          variant="outline"
          size="icon"
          onClick={next}
          aria-label={t("dashboard.nextMonth")}
          className={arrowButtonClass}
        >
          <Icon icon={ChevronRight} className="size-4" />
        </Button>
      )}
    </div>
  );
}
