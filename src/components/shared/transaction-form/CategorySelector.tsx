import { Icon } from "@/components/shared";
import { Check } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagBadge } from "@/components/shared/tag-badge";
import type { Category } from "@/types/Category";

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

  return (
    <div className="flex min-w-0 flex-1 flex-col items-end gap-1.5">
      <Popover>
        <PopoverTrigger className="rounded-lg border border-border/30 px-2.5 py-1 text-sm font-medium text-foreground outline-none transition-all hover:border-primary/50 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/30">
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
          <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              categories.map((category) => {
                const isSelected = selectedIds.includes(category.id);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelect(category.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-all",
                      isSelected
                        ? "bg-linear-to-r from-primary/10 to-primary/5 text-primary"
                        : "text-muted-foreground hover:bg-linear-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-lg border transition-all",
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
