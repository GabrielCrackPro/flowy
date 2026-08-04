import type { ReactNode } from "react";
import type { Column } from "../data-table";

interface CustomColumnOptions<T> {
  header: ReactNode;
  className?: string;
  sortable?: boolean;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

export function CustomColumn<T>({
  header,
  cell,
  className,
  sortable = false,
  sortValue,
}: CustomColumnOptions<T>): Column<T> {
  return {
    header,
    cell,
    className,
    sortable,
    sortValue,
  };
}
