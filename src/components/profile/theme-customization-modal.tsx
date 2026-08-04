"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { useProfile } from "@/hooks/useProfile";
import { Check, Palette, RotateCcw, X } from "@/lib/icons";
import { ColorPicker } from "./color-picker";
import { ThemePreview } from "./theme-preview";

export function ThemeCustomizationSheet() {
  const { t } = useTranslation();
  const { profile, update } = useProfile();
  const [open, setOpen] = useState(false);
  const [localColors, setLocalColors] = useState({
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

  const handleSave = async () => {
    try {
      await update(localColors);
      toast.success(t("settings.theme.saveSuccess"));
      setOpen(false);
    } catch (error) {
      console.error("Failed to save theme colors:", error);
      toast.error(t("settings.theme.saveError"));
    }
  };

  const handleResetToDefaults = async () => {
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
          size="icon"
          title={t("settings.theme.customize")}
        >
          <Palette className="size-4" />
        </Button>
      }
      title={t("settings.theme.title")}
      description={t("settings.theme.description")}
      icon={Palette}
      footerLeft={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetToDefaults}
          className="text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="size-4 mr-2" />
          {t("settings.theme.resetToDefaults")}
        </Button>
      }
      footerRight={
        <>
          <SheetClose>
            <Button variant="outline" className="h-10" onClick={handleCancel}>
              <X className="size-4 mr-2" />
              {t("settings.theme.cancel")}
            </Button>
          </SheetClose>
          <Button onClick={handleSave} className="h-10 min-w-[120px]">
            <Check className="size-4 mr-2" />
            {t("settings.theme.saveChanges")}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Color Pickers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/50" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("settings.theme.colorSettings")}
            </h3>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {t("settings.theme.primaryDescription")}
              </p>
              <ColorPicker
                label={t("settings.theme.primary")}
                value={localColors.primaryColor}
                onChange={(color) =>
                  setLocalColors({ ...localColors, primaryColor: color })
                }
                colorKey="primaryColor"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {t("settings.theme.secondaryDescription")}
              </p>
              <ColorPicker
                label={t("settings.theme.secondary")}
                value={localColors.secondaryColor}
                onChange={(color) =>
                  setLocalColors({ ...localColors, secondaryColor: color })
                }
                colorKey="secondaryColor"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <p className="text-xs text-muted-foreground">
                {t("settings.theme.accentDescription")}
              </p>
              <ColorPicker
                label={t("settings.theme.accent")}
                value={localColors.accentColor}
                onChange={(color) =>
                  setLocalColors({ ...localColors, accentColor: color })
                }
                colorKey="accentColor"
              />
            </div>
          </div>
        </div>

        {/* Theme Preview Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/50" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("settings.theme.livePreview")}
            </h3>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
            <ThemePreview colors={localColors} />
          </div>
        </div>

        {/* Quick Tips */}
        <div className="rounded-xl border border-border/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="size-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("settings.theme.tips")}</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {t("settings.theme.tip1")}</li>
                <li>• {t("settings.theme.tip2")}</li>
                <li>• {t("settings.theme.tip3")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SheetLayout>
  );
}
