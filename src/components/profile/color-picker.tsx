"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FormSectionLabel } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  label: string;
  value: string | null;
  onChange: (color: string | null) => void;
  className?: string;
}

const PRESET_COLORS = [
  { color: "#2563EB", name: "Blue" },
  { color: "#7C3AED", name: "Purple" },
  { color: "#DC2626", name: "Red" },
  { color: "#EA580C", name: "Orange" },
  { color: "#16A34A", name: "Green" },
  { color: "#0891B2", name: "Cyan" },
  { color: "#4338CA", name: "Indigo" },
  { color: "#BE185D", name: "Pink" },
  { color: "#4B5563", name: "Gray" },
  { color: "#1F2937", name: "Dark Gray" },
  { color: "#F59E0B", name: "Amber" },
  { color: "#EC4899", name: "Pink Light" },
];

export function ColorPicker({
  label,
  value,
  onChange,
  className,
}: ColorPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (newColor: string | null) => {
    onChange(newColor);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <FormSectionLabel>{label}</FormSectionLabel>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-12 group"
            type="button"
          >
            <div
              className="size-6 rounded border-2 shadow-sm group-hover:scale-110 transition-transform"
              style={{ backgroundColor: value || "#2563EB" }}
            />
            <span className="text-sm font-medium">
              {value || t("settings.theme.default")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="space-y-4">
            <div>
              <FormSectionLabel className="text-xs mb-3 block text-muted-foreground">
                Preset Colors
              </FormSectionLabel>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    className="size-10 rounded-lg border-2 shadow-sm hover:scale-110 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring/50"
                    style={{ backgroundColor: color }}
                    title={name}
                    onClick={() => {
                      handleColorChange(color);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <FormSectionLabel className="text-xs mb-2 block text-muted-foreground">
                Custom Color
              </FormSectionLabel>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="color"
                    value={value || "#2563EB"}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="size-12 rounded-lg cursor-pointer border-2 border-border/50 hover:border-border transition-colors"
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-lg ring-2 ring-inset ring-black/5" />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^#[0-9A-Fa-f]{6}$/.test(val)) {
                        handleColorChange(val || null);
                      }
                    }}
                    placeholder="#2563EB"
                    className="w-full px-3 py-2 text-sm border rounded-md font-mono"
                    maxLength={7}
                  />
                  {value && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {value}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={() => {
                  handleColorChange(null);
                  setIsOpen(false);
                }}
              >
                Reset to Default
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
