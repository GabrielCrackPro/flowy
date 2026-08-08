"use client";

import { Command } from "cmdk";
import { motion } from "framer-motion";
import { Clock, X } from "@/lib/icons";
import { Icon } from "../icon";
import { CommandPaletteItem } from "./CommandPaletteItem";

interface CommandPaletteRecentProps {
  recentSearches: string[];
  onRecentClick: (query: string) => void;
  onClearRecent: (e: React.MouseEvent) => void;
  t: (key: string) => string;
}

export function CommandPaletteRecent({
  recentSearches,
  onRecentClick,
  onClearRecent,
  t,
}: CommandPaletteRecentProps) {
  if (recentSearches.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 px-3 pb-1 pt-2">
        <motion.div
          initial={{ rotate: -90 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Icon icon={Clock} className="h-3 w-3" />
        </motion.div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          {t("search.recent")}
        </span>
      </div>
      <Command.Group>
        <div className="space-y-0.5 px-1.5">
          {recentSearches.map((sq, index) => (
            <motion.div
              key={sq}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.2,
                delay: index * 0.05,
              }}
            >
              <CommandPaletteItem
                value={sq}
                onSelect={() => onRecentClick(sq)}
                icon={Clock}
                label={<span className="truncate">{sq}</span>}
              />
            </motion.div>
          ))}
        </div>
        <div className="px-[calc(1.5rem-1px)] pb-1 pt-1">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearRecent}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
          >
            <Icon icon={X} className="h-3 w-3" />
            {t("search.clearRecent")}
          </motion.button>
        </div>
      </Command.Group>
    </>
  );
}
