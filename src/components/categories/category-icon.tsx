import { Icon } from "@components/shared";
import { cn } from "@lib/utils";
import { colorWithAlpha } from "./category-colors";
import { resolveCategoryIcon } from "./category-icons";

interface CategoryIconBadgeProps {
  icon?: string | null;
  color?: string | null;
  className?: string;
}

export function CategoryIconBadge({
  icon,
  color,
  className,
}: CategoryIconBadgeProps) {
  const IconComponent = resolveCategoryIcon(icon);

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        !color && "bg-muted/50 text-muted-foreground",
        className,
      )}
      style={
        color
          ? { backgroundColor: colorWithAlpha(color, "1f"), color }
          : undefined
      }
    >
      <Icon icon={IconComponent} className="size-5" />
    </span>
  );
}
