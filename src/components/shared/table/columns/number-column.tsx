import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import { Skeleton } from "../../skeleton";
import type { Column } from "../data-table";

interface NumberColumnOptions<T> {
  header: ReactNode;
  sortable?: boolean;
  className?: string;
  emptyValue?: ReactNode;
  align?: "left" | "center" | "right";

  value: (row: T) => number | null | undefined;
  formatter?: (value: number, row: T) => ReactNode;

  sortValue?: (row: T) => string | number;

  variant?:
    | "default"
    | "success"
    | "danger"
    | ((row: T) => "default" | "success" | "danger");

  secondary?: (row: T) => ReactNode;
}

export function NumberColumn<T>({
  header,
  value,
  formatter,
  sortable = false,
  className,
  emptyValue = "—",
  align = "right",
  sortValue,
  variant,
  secondary,
}: NumberColumnOptions<T>): Column<T> {
  return {
    header,
    className,
    sortable,
    sortValue: sortable
      ? (row) => sortValue?.(row) ?? value(row) ?? 0
      : undefined,

    skeleton: (
      <div
        className={cn(
          "flex flex-col gap-1",
          align === "left" && "items-start",
          align === "center" && "items-center",
          align === "right" && "items-end",
        )}
      >
        <Skeleton className="h-4 w-16" />
        {secondary && <Skeleton className="h-3 w-10" />}
      </div>
    ),
    cell: (row) => {
      const number = value(row);

      if (number === null || number === undefined) {
        return <span className="text-muted-foreground/40">{emptyValue}</span>;
      }

      const currentVariant =
        typeof variant === "function" ? variant(row) : variant;

      return (
        <div
          className={cn(
            "tabular-nums",
            align === "left" && "text-left",
            align === "center" && "text-center",
            align === "right" && "text-right",
          )}
        >
          <div
            className={cn(
              currentVariant === "success" &&
                "text-emerald-600 dark:text-emerald-400",
              currentVariant === "danger" && "text-red-600 dark:text-red-400",
            )}
          >
            {formatter ? formatter(number, row) : number.toLocaleString()}
          </div>

          {secondary && (
            <div className="text-muted-foreground text-xs">
              {secondary(row)}
            </div>
          )}
        </div>
      );
    },
  };
}
