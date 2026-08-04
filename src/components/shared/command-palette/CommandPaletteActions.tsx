"use client";

import { Icon, type IconProps } from "@components/shared";
import { Command } from "cmdk";
import { motion } from "framer-motion";
import { Home, SearchIcon } from "@/lib/icons";
import { CommandPaletteItem } from "./CommandPaletteItem";

interface QuickAction {
  id: string;
  icon: IconProps["icon"];
  labelKey: string;
  url: string;
  keywords: string[];
}

interface SystemAction {
  id: string;
  icon: IconProps["icon"];
  label: string;
  keywords: string[];
  action: () => void;
}

interface CommandPaletteActionsProps {
  navActions: QuickAction[];
  quickActions: QuickAction[];
  systemActions: SystemAction[];
  onActionSelect: (action: QuickAction) => void;
  onSystemActionSelect: (action: SystemAction) => void;
  onThemeSelect: () => void;
  t: (key: string) => string;
}

export function CommandPaletteActions({
  navActions,
  quickActions,
  systemActions,
  onActionSelect,
  onSystemActionSelect,
  onThemeSelect,
  t,
}: CommandPaletteActionsProps) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 pb-1 pt-2">
        <motion.div
          initial={{ rotate: -90 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Icon icon={Home} className="h-3 w-3" />
        </motion.div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          {t("search.navigation")}
        </span>
      </div>
      <Command.Group>
        <div className="space-y-0.5 px-1.5">
          {navActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.2,
                delay: 0.1 + index * 0.05,
              }}
            >
              <CommandPaletteItem
                value={action.id}
                onSelect={() => onActionSelect(action)}
                icon={action.icon}
                label={<span className="truncate">{t(action.labelKey)}</span>}
                showChevron
              />
            </motion.div>
          ))}
        </div>
      </Command.Group>

      <div className="flex items-center gap-2 px-3 pb-1 pt-2">
        <motion.div
          initial={{ rotate: -90 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Icon icon={SearchIcon} className="h-3 w-3" />
        </motion.div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          {t("search.actions")}
        </span>
      </div>
      <Command.Group>
        <div className="space-y-0.5 px-1.5">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.2,
                delay: 0.2 + index * 0.05,
              }}
            >
              <CommandPaletteItem
                value={action.id}
                onSelect={() => onActionSelect(action)}
                icon={action.icon}
                label={<span className="truncate">{t(action.labelKey)}</span>}
                showChevron
              />
            </motion.div>
          ))}
          {systemActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.2,
                delay: 0.2 + quickActions.length * 0.05 + index * 0.05,
              }}
            >
              <CommandPaletteItem
                value={action.id}
                onSelect={() =>
                  action.id === "toggle-theme"
                    ? onThemeSelect()
                    : onSystemActionSelect(action)
                }
                icon={action.icon}
                label={<span className="truncate">{action.label}</span>}
                showChevron
              />
            </motion.div>
          ))}
        </div>
      </Command.Group>
    </>
  );
}
