"use client";

import { Icon } from "@/components/shared";
import { Input } from "@components/ui";
import { Command, SearchIcon } from "@/lib/icons";
import { motion } from "framer-motion";

interface SearchProps {
  onOpenDialog?: () => void;
}

export function Search({ onOpenDialog }: SearchProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Input
        type="search"
        placeholder="Buscar en Flowy…"
        className="h-11 rounded-xl border-border/30 bg-gradient-to-r from-muted/40 to-muted/30 pl-10 pr-14 w-64 lg:w-80 focus-visible:w-80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md"
        startIcon={<Icon icon={SearchIcon} className="h-4 w-4" />}
        onClick={onOpenDialog}
        readOnly
      />
      <motion.kbd
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex h-6 items-center gap-1 rounded-lg border border-border/30 bg-gradient-to-br from-background to-background/50 px-2 text-xs text-muted-foreground/70 shadow-sm"
        whileHover={{ scale: 1.05 }}
      >
        <Icon icon={Command} className="h-3 w-3" />K
      </motion.kbd>
    </motion.div>
  );
}
