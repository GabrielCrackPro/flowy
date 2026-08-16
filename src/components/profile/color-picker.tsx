"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FormSectionLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, RotateCcw } from "@/lib/icons";
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

  // Keep the `#` as a visible prefix and let the user type/paste 6 hex digits.
  // Non-hex characters are stripped and the value is capped at 6 digits, so
  // pasting a full "#2563EB" still resolves correctly.
  const handleHexInput = (nextValue: string) => {
    const hex = nextValue
      .toUpperCase()
      .replace(/[^0-9A-F]/g, "")
      .slice(0, 6);
    const nextColor = hex ? `#${hex}` : "";
    setDraftColor(nextColor);
    onChange(hex.length === 6 ? nextColor : null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <FormSectionLabel>{label}</FormSectionLabel>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="group h-11 w-full justify-between gap-2 rounded-xl px-3 sm:h-10"
              type="button"
              aria-label={`${label}: ${value || t("settings.theme.default")}`}
            />
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="size-6 shrink-0 rounded-md border border-foreground/15 shadow-sm transition-transform group-hover:scale-105"
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
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(20rem,calc(100vw-2rem))] p-3"
          align="center"
          sideOffset={6}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <FormSectionLabel className="block text-xs text-muted-foreground">
                {t("settings.theme.colorPresets")}
              </FormSectionLabel>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.map((color) => {
                  const selected = value?.toUpperCase() === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "relative aspect-square w-full rounded-lg border border-foreground/15 transition hover:scale-[1.06] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected &&
                          "border-primary ring-2 ring-primary ring-offset-2",
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
                        <Check
                          className="size-4 text-white drop-shadow"
                          aria-hidden="true"
                        />
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
                  className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-foreground/15 shadow-sm transition hover:border-primary/60"
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
                  <Input
                    type="text"
                    value={draftColor.replace(/^#/, "")}
                    onChange={(event) => handleHexInput(event.target.value)}
                    onBlur={() => {
                      if (draftColor && !HEX_COLOR_PATTERN.test(draftColor)) {
                        setDraftColor(value ?? "");
                      }
                    }}
                    placeholder={DEFAULT_COLOR.replace(/^#/, "")}
                    startIcon={
                      <span
                        className="select-none text-muted-foreground"
                        aria-hidden="true"
                      >
                        #
                      </span>
                    }
                    className="font-mono uppercase tracking-wide"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
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
                variant="destructive"
                size="sm"
                type="button"
                className="h-9 w-full gap-1.5"
                onClick={() => {
                  handleColorChange(null);
                  setIsOpen(false);
                }}
              >
                <RotateCcw className="size-3.5" />
                {t("settings.theme.resetColor")}
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
