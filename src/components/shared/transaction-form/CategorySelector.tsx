import { useMemo, useState } from "react";
import { TagBadge } from "@/components/shared/tag-badge";
import {
  COMPACT_SELECTOR_CONTROL,
  CONTROL_FOCUS,
  CONTROL_SURFACE,
  OPTION_ROW_BASE,
  OPTION_ROW_INTERACTION,
  OPTION_ROW_SELECTED,
} from "@/components/ui/control-styles";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, Search, Tag } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/Category";
import { FilterOptionIcon } from "../filter/filter-option-icon";
import { Icon } from "../icon";

interface CategorySelectorProps {
  categories: Category[];
  selectedIds: string[];
  loading: boolean;
  onSelect: (id: string) => void;
  placeholder: string;
  loadingText: string;
  emptyText: string;
  selectedText: string;
  selectedTextPlural: string;
}

export function CategorySelector({
  categories,
  selectedIds,
  loading,
  onSelect,
  placeholder,
  loadingText,
  emptyText,
  selectedText,
  selectedTextPlural,
}: CategorySelectorProps) {
  const selectedTags = categories.filter((category) =>
    selectedIds.includes(category.id),
  );

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div className="flex min-w-0 flex-1 flex-col items-end gap-1.5">
      <Popover>
        <PopoverTrigger
          className={cn(
            "w-full min-w-0 max-w-full !justify-start hover:border-border hover:bg-muted/30",
            COMPACT_SELECTOR_CONTROL,
            CONTROL_SURFACE,
            CONTROL_FOCUS,
          )}
        >
          <Icon icon={Tag} className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 text-left whitespace-nowrap">
            {selectedTags.length > 0
              ? `${selectedTags.length} ${selectedTags.length !== 1 ? selectedTextPlural : selectedText}`
              : loading
                ? loadingText
                : placeholder}
          </span>
          <Icon
            icon={ChevronDown}
            className="ml-auto size-3.5 shrink-0 text-muted-foreground"
          />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[min(18rem,calc(100vw-2rem))] border-border/50 p-2.5 shadow-lg"
        >
          <div className="mb-2">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              autoComplete="off"
              startIcon={<Icon icon={Search} className="size-3.5" />}
              className="h-10 text-xs"
            />
          </div>
          <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filtered.map((category) => {
                const isSelected = selectedIds.includes(category.id);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelect(category.id)}
                    className={cn(
                      OPTION_ROW_BASE,
                      "cursor-pointer justify-start text-left",
                      OPTION_ROW_INTERACTION,
                      isSelected
                        ? OPTION_ROW_SELECTED
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border transition",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/50 bg-background",
                      )}
                    >
                      {isSelected && <Icon icon={Check} className="size-3" />}
                    </span>
                    <FilterOptionIcon
                      option={{
                        value: category.id,
                        label: category.name,
                        icon: category.icon ?? undefined,
                        color: category.color ?? undefined,
                      }}
                      size="sm"
                    />
                    <span className="min-w-0 font-medium">{category.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1">
          {selectedTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}
