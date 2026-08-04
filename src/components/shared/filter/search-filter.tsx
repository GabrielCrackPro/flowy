import { Icon } from "@/components/shared";
import { Button, Input } from "@components/ui";
import { Search, X } from "@/lib/icons";

interface SearchFilterProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SearchFilter({
  value,
  placeholder,
  onChange,
  onClear,
}: SearchFilterProps) {
  return (
    <div className="relative">
      <Icon
        icon={Search}
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
      />

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 pl-9 pr-9 text-sm"
      />

      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:bg-muted/60 hover:text-foreground"
        >
          <Icon icon={X} className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
