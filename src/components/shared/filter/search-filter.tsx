"use client";

import { Button, Input } from "@components/ui";
import { useDebounce } from "@/hooks";
import { Search, X } from "@/lib/icons";
import { Icon } from "../icon";

interface SearchFilterProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
  debounceMs?: number;
}

export function SearchFilter({
  value,
  placeholder,
  onChange,
  onClear,
  debounceMs = 300,
}: SearchFilterProps) {
  const debouncedOnChange = useDebounce(onChange, debounceMs);

  return (
    <div className="relative">
      <Icon
        icon={Search}
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
      />

      <Input
        value={value}
        onChange={(e) => debouncedOnChange(e.target.value)}
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
