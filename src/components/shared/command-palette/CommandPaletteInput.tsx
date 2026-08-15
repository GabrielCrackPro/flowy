"use client";

import { Command } from "cmdk";
import { useTranslation } from "react-i18next";
import { Loader2, SearchIcon, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "../icon";

interface CommandPaletteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  loading?: boolean;
}

export function CommandPaletteInput({
  value,
  onChange,
  placeholder,
  loading = false,
}: CommandPaletteInputProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-16 items-center gap-3 border-b border-border/50 bg-background px-4 py-2.5 sm:min-h-14 sm:py-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon icon={SearchIcon} className="size-4" />
      </span>
      <Command.Input
        placeholder={placeholder}
        value={value}
        onValueChange={onChange}
        aria-label={placeholder}
        autoComplete="off"
        inputMode="search"
        className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base font-medium outline-none ring-0 placeholder:text-muted-foreground/50 focus:border-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:h-10 sm:text-sm"
        autoFocus
      />
      {loading && (
        <Icon
          icon={Loader2}
          className="size-4 shrink-0 animate-spin text-primary"
        />
      )}
      {!loading && value.length > 0 && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange("")}
          aria-label={t("search.clearSearch")}
          title={t("search.clearSearch")}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors",
            "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
        >
          <Icon icon={X} className="size-4" />
        </button>
      )}
    </div>
  );
}
