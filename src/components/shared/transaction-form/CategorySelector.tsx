import { useMemo, useState } from "react";
import { TagBadge } from "@/components/shared/tag-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Search } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/Category";
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
        <PopoverTrigger className="rounded-lg border border-border/30 px-2.5 py-1 text-sm font-medium text-foreground outline-none transition hover:border-primary/50 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/30">
          {selectedTags.length > 0
            ? `${selectedTags.length} ${selectedTags.length !== 1 ? selectedTextPlural : selectedText}`
            : loading
              ? loadingText
              : placeholder}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-56 p-1.5 border-border/30 shadow-lg"
        >
          <div className="mb-1 flex items-center gap-1.5 rounded-md border border-border/30 bg-muted/30 px-2 py-1.5">
            <Icon
              icon={Search}
              className="size-3 shrink-0 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
              autoComplete="off"
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
                      "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition",
                      isSelected
                        ? "bg-linear-to-r from-primary/10 to-primary/5 text-primary"
                        : "text-muted-foreground hover:bg-linear-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-lg border transition",
                        isSelected
                          ? "border-primary bg-linear-to-br from-primary to-primary/90 text-primary-foreground"
                          : "border-border/30 bg-card",
                      )}
                    >
                      {isSelected && <Icon icon={Check} className="size-3" />}
                    </span>
                    <span className="font-medium">{category.name}</span>
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
