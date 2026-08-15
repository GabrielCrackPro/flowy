import type { Locale } from "date-fns";
import { DatePicker } from "../date-picker";

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
    <DatePicker
      date={date}
      onSelect={onSelect}
      placeholder={placeholder}
      locale={locale}
      size="sm"
      align="end"
    />
  );
}
