import { cn } from "@lib/utils";
import type { ReactNode } from "react";
import type { Column } from "../data-table";

interface IconColumnOptions<T> {
  header?: ReactNode;
  className?: string | ((row: T) => string);
  sortable?: boolean;
  align?: "left" | "center" | "right";
  icon: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

export function IconColumn<T>({
  header = null,
  icon,
  className,
  sortable = false,
  sortValue,
  align = "center",
}: IconColumnOptions<T>): Column<T> {
  return {
    header,
    sortable,
    sortValue,
    cell: (row) => (
      <div
        className={cn(
          "flex",
          align === "left" && "justify-start",
          align === "center" && "justify-center",
          align === "right" && "justify-end",
          typeof className === "function" ? className(row) : className,
        )}
      >
        {icon(row)}
      </div>
    ),
  };
}
