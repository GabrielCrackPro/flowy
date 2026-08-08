import type { ReactNode } from "react";
import { Skeleton } from "../../skeleton";
import type { Column } from "../data-table";

interface DateColumnOptions<T> {
  header: ReactNode;
  locale?: string;
  formatOptions?: Intl.DateTimeFormatOptions;
  sortable?: boolean;
  className?: string;
  emptyValue?: ReactNode;
  value: (row: T) => Date | string | null | undefined;
}

export function DateColumn<T>({
  header,
  value,
  locale = "es-ES",
  formatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
  sortable = false,
  className,
  emptyValue = "—",
}: DateColumnOptions<T>): Column<T> {
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);

  return {
    header,

    className,

    sortable,

    sortValue: sortable
      ? (row) => {
          const date = value(row);

          return date ? new Date(date).getTime() : 0;
        }
      : undefined,

    skeleton: <Skeleton className="h-3.5 w-20" />,

    cell: (row) => {
      const date = value(row);

      if (!date) {
        return <span className="text-muted-foreground/40">{emptyValue}</span>;
      }

      return (
        <span className="text-sm text-muted-foreground/80">
          {formatter.format(new Date(date))}
        </span>
      );
    },
  };
}
