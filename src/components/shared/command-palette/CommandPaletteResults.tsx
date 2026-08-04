"use client";

import { Icon, type IconProps } from "@components/shared";
import { Command } from "cmdk";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import type { SearchResultItem } from "@/types/SearchResult";
import { CommandPaletteItem } from "./CommandPaletteItem";
import { Highlight } from "./Highlight";

interface CommandPaletteResultsProps {
  filteredGroups: Array<{
    type: SearchResultItem["type"];
    items: SearchResultItem[];
  }>;
  sectionMeta: Record<
    SearchResultItem["type"],
    { icon: IconProps["icon"]; labelKey: string }
  >;
  sectionLabels: Record<SearchResultItem["type"], string>;
  query: string;
  locale: string;
  currency: string;
  onResultSelect: (item: SearchResultItem) => void;
  t: (key: string) => string;
}

export function CommandPaletteResults({
  filteredGroups,
  sectionMeta,
  sectionLabels,
  query,
  locale,
  currency,
  onResultSelect,
  t,
}: CommandPaletteResultsProps) {
  return (
    <>
      {filteredGroups.map(({ type, items }, gi) => {
        const meta = sectionMeta[type];
        const IconComponent = meta.icon;
        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: gi * 0.1 }}
          >
            {gi > 0 && (
              <div className="mx-4 my-1.5 border-t border-border/30" />
            )}
            <div className="flex items-center gap-2 px-3 pb-1 pt-0.5">
              <div className="flex h-4 w-4 items-center justify-center">
                <Icon icon={IconComponent} className="h-3 w-3" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                {t(sectionLabels[type])}
              </span>
            </div>
            <Command.Group>
              <div className="space-y-0.5 px-1.5">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: gi * 0.1 + index * 0.03,
                    }}
                  >
                    <CommandPaletteItem
                      value={item.title}
                      onSelect={() => onResultSelect(item)}
                      icon={IconComponent}
                      label={
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate">
                            <Highlight text={item.title} query={query} />
                          </span>
                          {item.subtitle && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              <Highlight text={item.subtitle} query={query} />
                            </span>
                          )}
                        </div>
                      }
                      right={
                        item.amount !== undefined ? (
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {formatCurrency(item.amount, locale, currency)}
                          </span>
                        ) : undefined
                      }
                    />
                  </motion.div>
                ))}
              </div>
            </Command.Group>
          </motion.div>
        );
      })}
    </>
  );
}
