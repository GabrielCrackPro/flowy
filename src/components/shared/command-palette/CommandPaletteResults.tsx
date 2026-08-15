"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import type { SearchResultItem } from "@/types/SearchResult";
import type { IconProps } from "../icon";
import { CommandPaletteItem } from "./CommandPaletteItem";
import { CommandPaletteSection } from "./CommandPaletteSection";
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
      {filteredGroups.map(({ type, items }, groupIndex) => {
        const IconComponent = sectionMeta[type].icon;

        return (
          <CommandPaletteSection
            key={type}
            icon={IconComponent}
            label={t(sectionLabels[type])}
            divided={groupIndex > 0}
          >
            {items.map((item, itemIndex) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.18,
                  delay: groupIndex * 0.04 + itemIndex * 0.025,
                }}
              >
                <CommandPaletteItem
                  value={`${item.type}:${item.id}`}
                  onSelect={() => onResultSelect(item)}
                  icon={IconComponent}
                  label={
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 truncate">
                          <Highlight text={item.title} query={query} />
                        </span>
                        {item.subtitle && (
                          <span className="hidden max-w-[38%] shrink-0 truncate text-xs text-muted-foreground sm:inline">
                            <Highlight text={item.subtitle} query={query} />
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:hidden">
                          <Highlight text={item.subtitle} query={query} />
                        </span>
                      )}
                    </div>
                  }
                  showChevron
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
          </CommandPaletteSection>
        );
      })}
    </>
  );
}
