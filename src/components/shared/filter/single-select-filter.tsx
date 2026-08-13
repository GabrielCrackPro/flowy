"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { FilterField } from "@/types/ui";
import { FilterOptionIcon } from "./filter-option-icon";

interface SingleSelectFilterProps {
  field: FilterField;
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function SingleSelectFilter({
  field,
  value,
  onChange,
}: SingleSelectFilterProps) {
  const { t } = useTranslation();
  const active = !!value;
  const selectedOption = field.options?.find(
    (option) => option.value === value,
  );
  const hasRichOptions =
    field.options?.some((option) => option.icon || option.color) ?? false;

  return (
    <Select
      value={value ?? null}
      onValueChange={(val) => onChange(val || undefined)}
    >
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <SelectTrigger
          className={cn(
            "h-9 min-w-40 gap-2 rounded-xl border px-3.5 text-xs font-medium transition duration-200 shadow-sm max-sm:w-full max-sm:min-w-0 [&>svg]:size-4",
            active
              ? "border-primary/40 bg-gradient-to-r from-primary/12 to-primary/6 text-foreground hover:from-primary/16 hover:to-primary/8 shadow-md"
              : "border-border/30 bg-card text-muted-foreground hover:border-border/50 hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground",
          )}
        >
          {hasRichOptions && selectedOption && (
            <FilterOptionIcon option={selectedOption} size="xs" />
          )}
          <SelectValue
            placeholder={field.placeholder ?? t("filters.all")}
            options={field.options}
          />
        </SelectTrigger>
      </motion.div>

      <SelectContent className="border-border/30 shadow-xl rounded-xl">
        <SelectItem value="">
          {field.placeholder ?? t("filters.all")}
        </SelectItem>

        {field.options?.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {hasRichOptions && <FilterOptionIcon option={opt} size="xs" />}
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
