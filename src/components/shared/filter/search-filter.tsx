"use client";

import { Button, Input } from "@components/ui";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const debouncedOnChange = useDebounce(onChange, debounceMs);

  return (
    <div className="relative">
      <Icon
        icon={Search}
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
      />

      <Input
        type="search"
        value={value}
        onChange={(e) => debouncedOnChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        className="h-10 rounded-xl border-border/40 bg-background/70 pl-9 pr-9 text-sm shadow-sm placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 sm:h-9"
      />

      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          onClick={onClear}
          aria-label={t("search.clearSearch")}
          title={t("search.clearSearch")}
          className="absolute right-1.5 top-1/2 size-8 -translate-y-1/2 rounded-lg text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground"
        >
          <Icon icon={X} className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
