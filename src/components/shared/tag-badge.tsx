import { colorWithAlpha } from "@components/categories/category-colors";
import { resolveCategoryIcon } from "@components/categories/category-icons";
import { Icon } from "@components/shared";
import { cn } from "@lib/utils";
import type { Category } from "@/types/Category";

interface TagBadgeProps {
  tag: Pick<Category, "id" | "name" | "icon" | "color">;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  const IconComponent = resolveCategoryIcon(tag.icon);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border/40 px-1.5 py-0.5 text-[11px] font-medium",
        !tag.color && "bg-muted/40 text-foreground/80",
        className,
      )}
      style={
        tag.color
          ? {
              backgroundColor: colorWithAlpha(tag.color, "14"),
              color: tag.color,
              borderColor: colorWithAlpha(tag.color, "40"),
            }
          : undefined
      }
    >
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-md"
        style={
          tag.color
            ? { backgroundColor: colorWithAlpha(tag.color, "1f") }
            : undefined
        }
      >
        <Icon icon={IconComponent} className="size-2.5" />
      </span>
      {tag.name}
    </span>
  );
}
