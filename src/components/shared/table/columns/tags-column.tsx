import type { ReactNode } from "react";
import { Skeleton, TagBadge } from "@/components/shared";
import type { Category } from "@/types/Category";
import type { Column } from "../data-table";

interface TagsColumnOptions<T> {
  header: ReactNode;
  className?: string;
  sortable?: boolean;
  emptyValue?: ReactNode;
  getTags: (row: T) => Category[] | null | undefined;
  sortValue?: (row: T) => string | number;
}

export function TagsColumn<T>({
  header,
  getTags,
  sortable = false,
  sortValue,
  className,
  emptyValue = "—",
}: TagsColumnOptions<T>): Column<T> {
  return {
    header,
    className,
    sortable,
    sortValue:
      sortValue ??
      (sortable
        ? (row) =>
            getTags(row)
              ?.map((tag) => tag.name)
              .join(", ") ?? ""
        : undefined),

    skeleton: (
      <div className="flex items-center gap-1">
        <Skeleton variant="rounded" className="h-5 w-14" />
        <Skeleton variant="rounded" className="h-5 w-10" />
      </div>
    ),
    cell: (row) => {
      const tags = getTags(row);

      if (!tags?.length) {
        return <span className="text-muted-foreground/40">{emptyValue}</span>;
      }

      return (
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      );
    },
  };
}
