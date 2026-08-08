"use client";

import { Command } from "cmdk";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Loader2, SearchIcon, X } from "@/lib/icons";
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
    <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2 transition-shadow focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-inset">
      <Icon
        icon={SearchIcon}
        className="size-4 shrink-0 text-muted-foreground/50"
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
          className="size-4 shrink-0 animate-spin text-primary"
        />
      )}
      {!loading && value.length > 0 && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange("")}
          aria-label={t("search.clearSearch")}
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon icon={X} className="size-3.5" />
        </motion.button>
      )}
    </div>
  );
}
