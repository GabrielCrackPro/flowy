import { colorWithAlpha } from "@components/categories/category-colors";
import { resolveCategoryIcon } from "@components/categories/category-icons";
import { Icon } from "@components/shared";
import { cn } from "@lib/utils";
import type { FilterOption } from "@/types/ui";

interface FilterOptionIconProps {
  option: FilterOption;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function FilterOptionIcon({
  option,
  size = "sm",
  className,
}: FilterOptionIconProps) {
  const IconComponent = resolveCategoryIcon(option.icon);

  const sizeClass = {
    xs: "size-3.5 rounded-[6px]",
    sm: "size-5 rounded-lg",
    md: "size-7 rounded-xl",
  }[size];

  const iconSizeClass = {
    xs: "size-2.5",
    sm: "size-3",
    md: "size-3.5",
  }[size];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        sizeClass,
        !option.color && "bg-muted/50 text-muted-foreground",
        className,
      )}
      style={
        option.color
          ? {
              backgroundColor: colorWithAlpha(option.color, "1f"),
              color: option.color,
            }
          : undefined
      }
    >
      <Icon icon={IconComponent} className={iconSizeClass} />
    </span>
  );
}
