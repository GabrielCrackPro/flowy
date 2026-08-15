"use client";

import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui";
import { useMultiSelectFilter } from "@hooks/filter";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  OPTION_ROW_BASE,
  OPTION_ROW_INTERACTION,
  OPTION_ROW_SELECTED,
} from "@/components/ui/control-styles";
import { Check, ChevronDown, Search, X } from "@/lib/icons";
import type { FilterField, FilterValues } from "@/types/ui";
import { Icon } from "../icon";
import { PaymentMethodIcon } from "../payment-method-icon";
import { FilterButton } from "./filter-button";
import { FilterFieldIcon } from "./filter-field-icon";
import { FilterOptionIcon } from "./filter-option-icon";

interface MultiSelectFilterProps {
  field: FilterField;
  values: FilterValues;
  onChange: (key: string, value: string | undefined) => void;
}

function MultiSelectOptionIcon({
  option,
  selected = false,
  compact = false,
}: {
  option: NonNullable<FilterField["options"]>[number];
  selected?: boolean;
  compact?: boolean;
}) {
  if (!option.paymentMethod) {
    return <FilterOptionIcon option={option} size={compact ? "xs" : "sm"} />;
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors",
        compact ? "size-3.5" : "size-5",
        selected && "bg-primary/15 text-primary",
      )}
    >
      <PaymentMethodIcon
        method={option.paymentMethod}
        className={compact ? "size-2.5" : "size-3.5"}
      />
    </span>
  );
}

export function MultiSelectFilter({
  field,
  values,
  onChange,
}: MultiSelectFilterProps) {
  const { t } = useTranslation();
  const { open, setOpen, selected, isActive, toggle, clear } =
    useMultiSelectFilter({
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
          <FilterButton
            active={isActive}
            className="max-sm:w-full max-sm:justify-start"
            aria-label={field.label}
          >
            <FilterFieldIcon field={field} active={isActive} />
            {selected.length > 0 ? (
              <>
                <span className="flex shrink-0 items-center gap-1">
                  {selectedOptions?.slice(0, 3).map((option) => (
                    <span key={option.value}>
                      <MultiSelectOptionIcon option={option} compact />
                    </span>
                  ))}
                  {selected.length > 3 && (
                    <span className="text-muted-foreground/70">
                      +{selected.length - 3}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 text-left whitespace-nowrap">
                  {t("filters.selected", { count: selected.length })}
                </span>
              </>
            ) : (
              <span className="min-w-0 flex-1 text-left whitespace-nowrap">
                {field.placeholder ?? field.label}
              </span>
            )}

            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon icon={ChevronDown} className="ml-auto size-3 shrink-0" />
            </motion.div>
          </FilterButton>
        }
      />

      <PopoverContent
        align="start"
        className="w-[min(20rem,calc(100vw-2rem))] rounded-xl border-border/50 p-2.5 shadow-lg"
        sideOffset={8}
      >
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-border/40 px-1 pb-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-semibold text-foreground">
              {field.label}
            </span>
            {isActive && (
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold tabular-nums text-primary ring-1 ring-primary/20">
                {selected.length}
              </span>
            )}
          </div>
          {isActive && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={clear}
              className="h-8 shrink-0 rounded-lg px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {t("filters.clearSelection")}
            </Button>
          )}
        </div>
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
              aria-label={t("filters.searchOptions")}
              className="h-8 rounded-lg border-border/40 bg-muted/20 pl-8 pr-8 text-xs placeholder:text-muted-foreground/40 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => setSearchDraft("")}
                aria-label={t("search.clearSearch")}
                title={t("search.clearSearch")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Icon icon={X} className="size-3" />
              </button>
            )}
          </div>
        )}

        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-0.5">
          {!field.options?.length ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {t("filters.noOptions")}
            </p>
          ) : filteredOptions.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {t("filters.noOptions")}
            </p>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selected.includes(option.value);

              return (
                <label
                  key={option.value}
                  className={cn(
                    OPTION_ROW_BASE,
                    "min-h-11 cursor-pointer gap-3 px-3",
                    OPTION_ROW_INTERACTION,
                    isSelected ? OPTION_ROW_SELECTED : "text-muted-foreground",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/60 bg-background",
                    )}
                  >
                    {isSelected && <Icon icon={Check} className="size-3" />}
                  </span>

                  <MultiSelectOptionIcon
                    option={option}
                    selected={isSelected}
                  />

                  <span className="min-w-0 flex-1 break-words font-medium leading-snug">
                    {option.label}
                  </span>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(option.value)}
                    aria-label={option.label}
                    className="sr-only"
                  />
                </label>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
