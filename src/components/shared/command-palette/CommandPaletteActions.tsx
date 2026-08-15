"use client";

import { motion } from "framer-motion";
import { Home, SearchIcon } from "@/lib/icons";
import { CommandPaletteItem } from "./CommandPaletteItem";
import { CommandPaletteSection } from "./CommandPaletteSection";
import type { ResolvedCommand } from "./command-registry";

interface CommandPaletteActionsProps {
  navigationCommands: ResolvedCommand[];
  actionCommands: ResolvedCommand[];
  onCommandSelect: (command: ResolvedCommand) => void;
  t: (key: string) => string;
}

export function CommandPaletteActions({
  navigationCommands,
  actionCommands,
  onCommandSelect,
  t,
}: CommandPaletteActionsProps) {
  return (
    <>
      <CommandPaletteSection icon={Home} label={t("search.navigation")}>
        {navigationCommands.map((command, index) => (
          <motion.div
            key={command.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: index * 0.035 }}
          >
            <CommandPaletteItem
              value={command.id}
              onSelect={() => onCommandSelect(command)}
              icon={command.icon}
              label={<span className="truncate">{command.label}</span>}
              showChevron={command.showChevron}
            />
          </motion.div>
        ))}
      </CommandPaletteSection>

      <CommandPaletteSection icon={SearchIcon} label={t("search.actions")}>
        {actionCommands.map((command, index) => (
          <motion.div
            key={command.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: 0.04 + index * 0.035 }}
          >
            <CommandPaletteItem
              value={command.id}
              onSelect={() => onCommandSelect(command)}
              icon={command.icon}
              label={<span className="truncate">{command.label}</span>}
              showChevron={command.showChevron}
            />
          </motion.div>
        ))}
      </CommandPaletteSection>
    </>
  );
}
