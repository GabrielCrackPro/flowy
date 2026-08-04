import { Badge } from "@components/ui";
import type { ReactNode } from "react";
import type { Column } from "../data-table";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

interface BadgeColumnOptions<T> {
  header: ReactNode;
  sortable?: boolean;
  className?: string;
  emptyValue?: ReactNode;
  value: (row: T) => ReactNode | null | undefined;
  variant?: (row: T) => BadgeVariant;
  sortValue?: (row: T) => string | number;
}

export function BadgeColumn<T>({
  header,
  value,
  variant,
  sortable = false,
  sortValue,
  className,
  emptyValue = "—",
}: BadgeColumnOptions<T>): Column<T> {
  return {
    header,
    className,
    sortable,
    sortValue:
      sortValue ?? (sortable ? (row) => String(value(row) ?? "") : undefined),

    cell: (row) => {
      const content = value(row);

      if (!content) {
        return <span className="text-muted-foreground/40">{emptyValue}</span>;
      }

      return <Badge variant={variant?.(row) ?? "secondary"}>{content}</Badge>;
    },
  };
}
