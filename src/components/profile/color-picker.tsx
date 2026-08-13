"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FormSectionLabel } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  label: string;
  value: string | null;
  onChange: (color: string | null) => void;
  className?: string;
}

const DEFAULT_COLOR = "#2563EB";
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

const PRESET_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#DC2626",
  "#EA580C",
  "#16A34A",
  "#0891B2",
  "#4338CA",
  "#BE185D",
  "#4B5563",
  "#1F2937",
  "#F59E0B",
  "#EC4899",
];

export function ColorPicker({
  label,
  value,
  onChange,
  className,
}: ColorPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(value ?? "");
  const displayColor = value || DEFAULT_COLOR;

  useEffect(() => {
    setDraftColor(value ?? "");
  }, [value]);

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (nextOpen) {
      setDraftColor(value ?? "");
    }
  };

  const handleColorChange = (newColor: string | null) => {
    setDraftColor(newColor ?? "");
    onChange(newColor);
  };

  const handleHexInput = (nextValue: string) => {
    const nextColor = nextValue.toUpperCase();
    setDraftColor(nextColor);

    if (nextColor === "") {
      onChange(null);
    } else if (HEX_COLOR_PATTERN.test(nextColor)) {
      onChange(nextColor);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <FormSectionLabel>{label}</FormSectionLabel>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger>
          <Button
            variant="outline"
            className="group h-10 w-full justify-between gap-2 px-2.5"
            type="button"
            aria-label={`${label}: ${value || t("settings.theme.default")}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-5 shrink-0 rounded-md border border-black/10 shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: displayColor }}
                aria-hidden="true"
              />
              <span className="truncate text-sm font-medium">
                {value || t("settings.theme.default")}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(18rem,calc(100vw-2rem))] p-3"
          align="start"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <FormSectionLabel className="block text-xs text-muted-foreground">
                {t("settings.theme.colorPresets")}
              </FormSectionLabel>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => {
                  const selected = value?.toUpperCase() === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "relative flex size-8 items-center justify-center rounded-lg border border-black/10 shadow-sm transition hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected && "ring-2 ring-primary ring-offset-2",
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`${label} ${color}`}
                      aria-pressed={selected}
                      onClick={() => {
                        handleColorChange(color);
                        setIsOpen(false);
                      }}
                    >
                      {selected ? (
                        <Check className="size-4 text-white drop-shadow" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 border-t border-border/50 pt-3">
              <FormSectionLabel className="block text-xs text-muted-foreground">
                {t("settings.theme.customColor")}
              </FormSectionLabel>
              <div className="flex items-center gap-2">
                <label
                  className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border/60 shadow-sm transition hover:border-primary/60"
                  title={t("settings.theme.customColor")}
                >
                  <input
                    type="color"
                    value={displayColor}
                    onChange={(event) =>
                      handleColorChange(event.target.value.toUpperCase())
                    }
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    aria-label={t("settings.theme.customColor")}
                  />
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundColor: displayColor }}
                    aria-hidden="true"
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={draftColor}
                    onChange={(event) => handleHexInput(event.target.value)}
                    onBlur={() => {
                      if (draftColor && !HEX_COLOR_PATTERN.test(draftColor)) {
                        setDraftColor(value ?? "");
                      }
                    }}
                    placeholder={DEFAULT_COLOR}
                    className="h-10 w-full rounded-md border border-border/60 bg-background px-3 font-mono text-sm uppercase outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={7}
                    aria-label={t("settings.theme.customColor")}
                  />
                </div>
              </div>
              {value ? (
                <p className="text-[11px] text-muted-foreground">
                  {t("settings.theme.selectedColor", { color: value })}
                </p>
              ) : null}
            </div>

            {value ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-8 w-full text-muted-foreground hover:text-destructive"
                onClick={() => {
                  handleColorChange(null);
                  setIsOpen(false);
                }}
              >
                {t("settings.theme.resetColor")}
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
