import type { FilterField } from "@/types/ui";
import { Icon } from "../icon";

interface FilterFieldIconProps {
  field: FilterField;
  active?: boolean;
}

export function FilterFieldIcon({
  field,
  active = false,
}: FilterFieldIconProps) {
  if (!field.icon) return null;

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      <Icon icon={field.icon} className="size-4" />
    </span>
  );
}
