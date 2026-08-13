"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { useProfile } from "@/hooks/useProfile";
import {
  AlertTriangle,
  Check,
  Loader2,
  Palette,
  RotateCcw,
  Sparkles,
  X,
} from "@/lib/icons";
import { ColorPicker } from "./color-picker";
import { ThemePreview } from "./theme-preview";

type ThemeColors = {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
};

type ThemePreset = {
  id: keyof AppThemePresetNames;
  colors: ThemeColors;
};

type AppThemePresetNames = {
  default: string;
  ocean: string;
  lavender: string;
  forest: string;
  sunset: string;
  monochrome: string;
};

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    colors: {
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
    },
  },
  {
    id: "ocean",
    colors: {
      primaryColor: "#2563EB",
      secondaryColor: "#0F766E",
      accentColor: "#06B6D4",
    },
  },
  {
    id: "lavender",
    colors: {
      primaryColor: "#7C3AED",
      secondaryColor: "#6D28D9",
      accentColor: "#EC4899",
    },
  },
  {
    id: "forest",
    colors: {
      primaryColor: "#15803D",
      secondaryColor: "#166534",
      accentColor: "#84CC16",
    },
  },
  {
    id: "sunset",
    colors: {
      primaryColor: "#EA580C",
      secondaryColor: "#B91C1C",
      accentColor: "#F59E0B",
    },
  },
  {
    id: "monochrome",
    colors: {
      primaryColor: "#374151",
      secondaryColor: "#6B7280",
      accentColor: "#111827",
    },
  },
];

function getContrastRatio(hex: string, foreground: "#fff" | "#111827") {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return 21;

  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  const foregroundLuminance = foreground === "#fff" ? 1 : 0.011;
  const lighter = Math.max(luminance, foregroundLuminance);
  const darker = Math.min(luminance, foregroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function hasContrastWarning(colors: ThemeColors) {
  return [colors.primaryColor, colors.secondaryColor, colors.accentColor].some(
    (color) =>
      color &&
      Math.max(
        getContrastRatio(color, "#fff"),
        getContrastRatio(color, "#111827"),
      ) < 4.5,
  );
}

export function ThemeCustomizationSheet({
  label = false,
}: {
  label?: boolean;
}) {
  const { t } = useTranslation();
  const { profile, update } = useProfile();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localColors, setLocalColors] = useState<ThemeColors>({
    primaryColor: profile?.primaryColor || null,
    secondaryColor: profile?.secondaryColor || null,
    accentColor: profile?.accentColor || null,
  });

  // Reset local colors when sheet opens with current profile colors
  useEffect(() => {
    if (open) {
      setLocalColors({
        primaryColor: profile?.primaryColor || null,
        secondaryColor: profile?.secondaryColor || null,
        accentColor: profile?.accentColor || null,
      });
    }
  }, [open, profile]);

  const activePreset = THEME_PRESETS.find((preset) =>
    Object.entries(preset.colors).every(
      ([key, value]) => localColors[key as keyof ThemeColors] === value,
    ),
  );
  const savedColors: ThemeColors = {
    primaryColor: profile?.primaryColor || null,
    secondaryColor: profile?.secondaryColor || null,
    accentColor: profile?.accentColor || null,
  };
  const hasChanges = Object.entries(savedColors).some(
    ([key, value]) => localColors[key as keyof ThemeColors] !== value,
  );
  const contrastWarning = hasContrastWarning(localColors);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await update(localColors);
      toast.success(t("settings.theme.saveSuccess"));
      setOpen(false);
    } catch (error) {
      console.error("Failed to save theme colors:", error);
      toast.error(t("settings.theme.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const defaultColors = {
        primaryColor: null,
        secondaryColor: null,
        accentColor: null,
      };
      await update(defaultColors);
      setLocalColors(defaultColors);
      toast.success(t("settings.theme.resetSuccess"));
      setOpen(false);
    } catch (error) {
      console.error("Failed to reset theme:", error);
      toast.error(t("settings.theme.resetError"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalColors({
      primaryColor: profile?.primaryColor || null,
      secondaryColor: profile?.secondaryColor || null,
      accentColor: profile?.accentColor || null,
    });
    setOpen(false);
  };

  return (
    <SheetLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          variant="ghost"
          className={label ? "gap-1.5" : undefined}
          title={t("settings.theme.customize")}
        >
          <Palette className="size-4" />
          {label ? (
            <span className="hidden sm:inline">
              {t("settings.theme.customize")}
            </span>
          ) : null}
        </Button>
      }
      title={t("settings.theme.title")}
      description={t("settings.theme.description")}
      icon={Palette}
      maxWidth="sm:max-w-2xl"
      footerLeft={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleResetToDefaults()}
          disabled={saving}
          className="text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="size-4 mr-2" />
          {t("settings.theme.resetToDefaults")}
        </Button>
      }
      footerRight={
        <>
          <SheetClose>
            <Button
              variant="outline"
              className="h-10"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="size-4 mr-2" />
              {t("settings.theme.cancel")}
            </Button>
          </SheetClose>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || !hasChanges}
            className="h-10 min-w-[120px]"
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            {saving ? t("common.saving") : t("settings.theme.saveChanges")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("settings.theme.presets")}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {THEME_PRESETS.map((preset) => {
              const selected = activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setLocalColors(preset.colors);
                    toast.success(
                      t("settings.theme.presetApplied", {
                        name: t(`settings.theme.presetNames.${preset.id}`),
                      }),
                    );
                  }}
                  className={`group flex min-h-14 flex-col items-start justify-between rounded-lg border p-2 text-left transition-colors ${
                    selected
                      ? "border-primary/60 bg-primary/8 ring-1 ring-primary/20"
                      : "border-border/40 bg-muted/10 hover:border-primary/40 hover:bg-muted/30"
                  }`}
                  aria-pressed={selected}
                >
                  <span className="flex gap-1" aria-hidden="true">
                    {[
                      preset.colors.primaryColor,
                      preset.colors.secondaryColor,
                      preset.colors.accentColor,
                    ].map((color) => (
                      <span
                        key={color}
                        className="size-3 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: color ?? undefined }}
                      />
                    ))}
                  </span>
                  <span className="truncate text-[11px] font-medium">
                    {t(`settings.theme.presetNames.${preset.id}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Pickers Section */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("settings.theme.colorSettings")}
            </h3>
            {hasChanges ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {t("settings.theme.unsavedChanges")}
              </span>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <div className="grid gap-2 sm:grid-cols-3">
              <ColorPicker
                label={t("settings.theme.primary")}
                value={localColors.primaryColor}
                onChange={(color) =>
                  setLocalColors({ ...localColors, primaryColor: color })
                }
                className="rounded-lg border border-border/30 bg-muted/[0.08] p-2"
              />
              <ColorPicker
                label={t("settings.theme.secondary")}
                value={localColors.secondaryColor}
                onChange={(color) =>
                  setLocalColors({ ...localColors, secondaryColor: color })
                }
                className="rounded-lg border border-border/30 bg-muted/[0.08] p-2"
              />
              <ColorPicker
                label={t("settings.theme.accent")}
                value={localColors.accentColor}
                onChange={(color) =>
                  setLocalColors({ ...localColors, accentColor: color })
                }
                className="rounded-lg border border-border/30 bg-muted/[0.08] p-2"
              />
            </div>
            {contrastWarning ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>{t("settings.theme.contrastWarning")}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Theme Preview Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("settings.theme.livePreview")}
          </h3>
          <div className="rounded-xl border border-border/30 bg-muted/20 p-3 sm:p-4">
            <ThemePreview colors={localColors} />
          </div>
        </div>
      </div>
    </SheetLayout>
  );
}
