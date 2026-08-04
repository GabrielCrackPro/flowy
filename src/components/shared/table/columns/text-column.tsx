import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import type { Column } from "../data-table";

interface TextColumnOptions<T> {
  header: ReactNode;
  emptyValue?: ReactNode;
  sortable?: boolean;
  className?: string;
  valueClassName?: string;
  secondaryClassName?: string;
  muted?: boolean;
  icon?: (row: T) => ReactNode;
  value: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  secondaryText?: (row: T) => ReactNode;
}

export function TextColumn<T>({
  header,
  value,
  secondaryText,
  icon,
  emptyValue = "—",
  sortable = false,
  sortValue,
  className,
  valueClassName,
  secondaryClassName,
  muted = false,
}: TextColumnOptions<T>): Column<T> {
  return {
    header,
    className,
    sortable,
    sortValue:
      sortValue ??
      (sortable
        ? (row) => {
            const result = value(row);
            return typeof result === "string" ? result : String(result ?? "");
          }
        : undefined),

    cell: (row) => {
      const primary = value(row);
      const secondary = secondaryText?.(row);
      const leadingIcon = icon?.(row);

      return (
        <div className="min-w-0 flex items-center gap-2">
          {leadingIcon && (
            <div className="shrink-0 text-muted-foreground">{leadingIcon}</div>
          )}

          <div className="min-w-0 flex flex-col gap-0.5">
            <div
              className={cn(
                "truncate text-sm font-medium leading-tight",
                muted && "text-muted-foreground",
                valueClassName,
              )}
            >
              {primary || (
                <span className="text-xs italic text-muted-foreground/40">
                  {emptyValue}
                </span>
              )}
            </div>

            {secondary && (
              <div
                className={cn(
                  "text-xs text-muted-foreground/60",
                  secondaryClassName,
                )}
              >
                {secondary}
              </div>
            )}
          </div>
        </div>
      );
    },
  };
}
