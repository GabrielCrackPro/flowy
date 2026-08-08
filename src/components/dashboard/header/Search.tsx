"use client";

import { Input } from "@components/ui";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { Command, SearchIcon } from "@/lib/icons";

interface SearchProps {
  onOpenDialog?: () => void;
}

export function Search({ onOpenDialog }: SearchProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Input
        type="search"
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        title={t("search.open")}
        className="h-11 w-64 rounded-xl border-border/30 bg-gradient-to-r from-muted/40 to-muted/30 pl-10 pr-14 shadow-sm transition duration-300 hover:shadow-md focus-visible:w-80 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 lg:w-80"
        startIcon={<Icon icon={SearchIcon} className="size-4" />}
        onClick={onOpenDialog}
        readOnly
      />
      <motion.kbd
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex h-6 items-center gap-1 rounded-lg border border-border/30 bg-gradient-to-br from-background to-background/50 px-2 text-xs text-muted-foreground/70 shadow-sm"
        whileHover={{ scale: 1.05 }}
      >
        <Icon icon={Command} className="size-3" />K
      </motion.kbd>
    </motion.div>
  );
}
