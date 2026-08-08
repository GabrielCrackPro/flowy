import type { Locale } from "date-fns";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateSelectorProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder: string;
  locale?: Locale;
}

export function DateSelector({
  date,
  onSelect,
  placeholder,
  locale,
}: DateSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger className="rounded-lg border border-border/30 px-2.5 py-1 text-sm font-medium text-foreground outline-none transition hover:border-primary/50 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/30">
        {date
          ? format(date, "d MMM yyyy", locale ? { locale } : undefined)
          : placeholder}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto p-0 border-border/30 shadow-lg"
      >
        <Calendar mode="single" selected={date} onSelect={onSelect} />
      </PopoverContent>
    </Popover>
  );
}
