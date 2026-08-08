"use client";

import { Input, Popover, PopoverContent, PopoverTrigger } from "@components/ui";
import { useMultiSelectFilter } from "@hooks/filter";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search, X } from "@/lib/icons";
import type { FilterField, FilterValues } from "@/types/ui";
import { Icon } from "../icon";
import { FilterButton } from "./filter-button";
import { FilterOptionIcon } from "./filter-option-icon";

interface MultiSelectFilterProps {
  field: FilterField;
  values: FilterValues;
  onChange: (key: string, value: string | undefined) => void;
}

export function MultiSelectFilter({
  field,
  values,
  onChange,
}: MultiSelectFilterProps) {
  const { t } = useTranslation();
  const { open, setOpen, selected, isActive, toggle } = useMultiSelectFilter({
    fieldKey: field.key,
    values,
    onChange,
  });
  const [searchDraft, setSearchDraft] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchDraft.trim()) return field.options ?? [];
    const query = searchDraft.toLowerCase();
    return (field.options ?? []).filter((opt) =>
      opt.label.toLowerCase().includes(query),
    );
  }, [field.options, searchDraft]);

  const selectedOptions = field.options?.filter((option) =>
    selected.includes(option.value),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearchDraft("");
      }}
    >
      <PopoverTrigger
        render={
          <FilterButton active={isActive}>
            {selected.length > 0 ? (
              <>
                <span className="flex items-center gap-1">
                  {selectedOptions?.slice(0, 3).map((option) => (
                    <FilterOptionIcon
                      key={option.value}
                      option={option}
                      size="xs"
                    />
                  ))}
                  {selected.length > 3 && (
                    <span className="text-muted-foreground/70">
                      +{selected.length - 3}
                    </span>
                  )}
                </span>
                <span className="max-w-24 truncate">
                  {t("filters.selected", { count: selected.length })}
                </span>
              </>
            ) : (
              <span className="max-w-24 truncate">
                {field.placeholder ?? field.label}
              </span>
            )}

            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon icon={ChevronDown} className="size-3 shrink-0" />
            </motion.div>
          </FilterButton>
        }
      />

      <PopoverContent
        align="start"
        className="w-60 p-2 border-border/30 shadow-xl rounded-xl"
        sideOffset={8}
      >
        {/* Search input inside dropdown */}
        {field.options && field.options.length > 6 && (
          <div className="relative mb-2">
            <Icon
              icon={Search}
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50"
            />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={t("filters.searchOptions")}
              className="h-8 rounded-lg border-border/30 bg-muted/20 pl-8 pr-8 text-xs placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/40"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => setSearchDraft("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground/40 hover:text-foreground"
              >
                <Icon icon={X} className="size-3" />
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {!field.options?.length ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {t("filters.noOptions")}
            </p>
          ) : filteredOptions.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {t("filters.noOptions")}
            </p>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = selected.includes(option.value);

              return (
                <motion.label
                  key={option.value}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-200",
                    isSelected
                      ? "bg-gradient-to-r from-primary/12 to-primary/6 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 hover:text-foreground",
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "flex size-4.5 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                      isSelected
                        ? "border-primary bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-md"
                        : "border-border/30 bg-card",
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon icon={Check} className="size-3" />
                      </motion.div>
                    )}
                  </motion.div>

                  <FilterOptionIcon option={option} size="xs" />

                  <span className="font-medium">{option.label}</span>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(option.value)}
                    className="sr-only"
                  />
                </motion.label>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
