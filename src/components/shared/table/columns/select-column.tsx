import { Checkbox } from "@components/ui";
import { Skeleton } from "../../skeleton";
import type { Column } from "../data-table";

interface SelectColumnOptions<T> {
  selectedIds: Set<string>;
  allSelected: boolean;
  className?: string;
  getId: (row: T) => string;
  getLabel?: (row: T) => string;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
}

export function SelectColumn<T>({
  selectedIds,
  allSelected,
  getId,
  getLabel,
  onSelect,
  onSelectAll,
  className = "w-10",
}: SelectColumnOptions<T>): Column<T> {
  return {
    header: (
      <div>
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select all"
        />
      </div>
    ),
    className,
    skeleton: <Skeleton className="size-4 rounded-[4px]" />,
    cell: (row) => {
      const id = getId(row);

      return (
        <div>
          <Checkbox
            checked={selectedIds.has(id)}
            onCheckedChange={() => onSelect(id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={getLabel?.(row)}
          />
        </div>
      );
    },
  };
}
