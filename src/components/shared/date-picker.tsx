"use client";

import type { Locale } from "date-fns";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  COMPACT_SELECTOR_CONTROL,
  CONTROL_FOCUS,
  CONTROL_SURFACE,
  SELECTOR_CONTROL,
} from "@/components/ui/control-styles";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

export interface DatePickerQuickAction {
  key: string;
  label: string;
  getDate: () => Date;
}

export function createDateQuickActions(
  translate: (key: string) => string,
): DatePickerQuickAction[] {
  const getRelativeDate = (days: number) => () => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
  };

  return [
    {
      key: "today",
      label: translate("common.dateActions.today"),
      getDate: getRelativeDate(0),
    },
    {
      key: "tomorrow",
      label: translate("common.dateActions.tomorrow"),
      getDate: getRelativeDate(1),
    },
    {
      key: "nextWeek",
      label: translate("common.dateActions.nextWeek"),
      getDate: getRelativeDate(7),
    },
  ];
}

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder: string;
  locale?: Locale;
  disabled?: boolean;
  size?: "sm" | "default";
  align?: "start" | "center" | "end";
  className?: string;
  quickActions?: DatePickerQuickAction[];
}

export function DatePicker({
  date,
  onSelect,
  placeholder,
  locale,
  disabled = false,
  size = "default",
  align = "start",
  className,
  quickActions = [],
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const sizeClasses =
    size === "sm" ? COMPACT_SELECTOR_CONTROL : SELECTOR_CONTROL;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={placeholder}
        className={cn(
          "group w-full min-w-0 max-w-full cursor-pointer text-left hover:border-border hover:bg-muted/30 disabled:cursor-not-allowed",
          sizeClasses,
          CONTROL_SURFACE,
          CONTROL_FOCUS,
          !date && "text-muted-foreground",
          className,
        )}
      >
        <Icon
          icon={CalendarIcon}
          className="size-4 shrink-0 text-muted-foreground"
        />
        <span className="min-w-0 flex-1 whitespace-nowrap">
          {date
            ? format(date, "d MMM yyyy", locale ? { locale } : undefined)
            : placeholder}
        </span>
        <Icon
          icon={ChevronDown}
          className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180"
        />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto max-w-[calc(100vw-1rem)] rounded-xl border-border/50 bg-popover p-1 shadow-lg"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          locale={locale}
        />
        {quickActions.length > 0 && (
          <div className="border-t border-border/40 px-2 pb-2 pt-2">
            <div className="grid grid-cols-3 gap-1.5">
              {quickActions.map((action) => (
                <Button
                  key={action.key}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSelect(action.getDate());
                    setOpen(false);
                  }}
                  className="h-9 min-w-0 rounded-lg px-2 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
