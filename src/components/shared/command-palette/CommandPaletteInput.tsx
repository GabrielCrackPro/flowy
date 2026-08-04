"use client";

import { Command } from "cmdk";
import { Icon } from "@/components/shared";
import { Loader2, SearchIcon } from "@/lib/icons";

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
  return (
    <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2 transition-shadow focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-inset">
      <Icon
        icon={SearchIcon}
        className="h-4 w-4 shrink-0 text-muted-foreground/50"
      />
      <Command.Input
        placeholder={placeholder}
        value={value}
        onValueChange={onChange}
        className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        autoFocus
      />
      {loading && (
        <Icon
          icon={Loader2}
          className="h-4 w-4 shrink-0 animate-spin text-primary"
        />
      )}
    </div>
  );
}
