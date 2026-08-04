import { Checkbox } from "@components/ui";
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
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all"
        />
      </div>
    ),
    className,
    cell: (row) => {
      const id = getId(row);

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(id)}
            onCheckedChange={() => onSelect(id)}
            aria-label={getLabel?.(row)}
          />
        </div>
      );
    },
  };
}
