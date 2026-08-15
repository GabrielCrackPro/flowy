"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui";
import { cn } from "@lib/utils";
import { useTranslation } from "react-i18next";
import { PaymentMethodIcon } from "@/components/shared/payment-method-icon";
import type { FilterField } from "@/types/ui";
import { FilterFieldIcon } from "./filter-field-icon";
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
    field.options?.some(
      (option) => option.icon || option.iconComponent || option.color,
    ) ?? false;

  return (
    <Select
      value={value ?? null}
      onValueChange={(val) => onChange(val || undefined)}
    >
      <div>
        <SelectTrigger
          size="sm"
          className={cn(
            "h-11 min-w-40 text-xs max-sm:w-full max-sm:min-w-0 [&>svg]:size-4 sm:h-9",
            active
              ? "border-primary/40 bg-primary/8 text-foreground hover:bg-primary/12"
              : "border-border/40 bg-background/70 text-muted-foreground hover:border-border/70 hover:bg-muted/40 hover:text-foreground",
          )}
          aria-label={field.label}
        >
          <FilterFieldIcon field={field} active={active} />
          {selectedOption?.paymentMethod ? (
            <PaymentMethodIcon
              method={selectedOption.paymentMethod}
              className="size-3.5 text-muted-foreground"
            />
          ) : (
            hasRichOptions &&
            selectedOption && (
              <FilterOptionIcon option={selectedOption} size="xs" />
            )
          )}
          <SelectValue
            placeholder={field.placeholder ?? t("filters.all")}
            options={field.options}
          />
        </SelectTrigger>
      </div>

      <SelectContent className="rounded-xl border-border/50 shadow-lg">
        <SelectItem value="">
          <FilterFieldIcon field={field} />
          <span>{field.placeholder ?? t("filters.all")}</span>
        </SelectItem>

        {field.options?.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.paymentMethod ? (
              <PaymentMethodIcon
                method={opt.paymentMethod}
                className="size-3.5 text-muted-foreground"
              />
            ) : (
              hasRichOptions && <FilterOptionIcon option={opt} size="xs" />
            )}
            <span>{opt.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
