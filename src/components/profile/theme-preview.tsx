"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  Check,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
  Zap,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ThemePreviewProps {
  className?: string;
  colors?: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
  };
}

export function ThemePreview({ className, colors }: ThemePreviewProps) {
  const { t } = useTranslation("app");

  const hexToHsl = (hex: string | null): string => {
    if (!hex) return "";

    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const primaryHsl = hexToHsl(colors?.primaryColor ?? null);
  const secondaryHsl = hexToHsl(colors?.secondaryColor ?? null);
  const accentHsl = hexToHsl(colors?.accentColor ?? null);

  const previewStyle = {
    "--preview-primary": primaryHsl || "var(--primary)",
    "--preview-secondary": secondaryHsl || "var(--secondary)",
    "--preview-accent": accentHsl || "var(--accent)",
  } as React.CSSProperties;
  return (
    <div className={cn("space-y-6", className)} style={previewStyle}>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">
          {t("settings.theme.livePreview")}
        </h3>
      </div>

      {/* Buttons Section */}
      <div className="space-y-3">
        <FormLabel>{t("settings.theme.preview.sectionButtons")}</FormLabel>
        <div className="flex flex-wrap gap-3">
          <Button
            style={{
              background: `linear-gradient(to right, hsl(var(--preview-primary)), hsl(var(--preview-primary) / 0.9))`,
              color: "hsl(var(--preview-primary-foreground))",
            }}
          >
            {t("settings.theme.primary")}
          </Button>
          <Button
            variant="secondary"
            style={{
              background: `linear-gradient(to right, hsl(var(--preview-secondary)), hsl(var(--preview-secondary) / 0.9))`,
              color: "hsl(var(--preview-secondary-foreground))",
            }}
          >
            {t("settings.theme.secondary")}
          </Button>
          <Button variant="outline">
            {t("settings.theme.preview.buttonOutline")}
          </Button>
          <Button variant="ghost">
            {t("settings.theme.preview.buttonGhost")}
          </Button>
          <Button
            variant="link"
            style={{ color: "hsl(var(--preview-primary))" }}
          >
            {t("settings.theme.preview.buttonLink")}
          </Button>
        </div>
      </div>

      {/* Cards Section */}
      <div className="space-y-3">
        <FormLabel>{t("settings.theme.preview.sectionCards")}</FormLabel>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="flex size-8 items-center justify-center rounded-lg text-primary-foreground"
                style={{
                  background: `linear-gradient(to bottom right, hsl(var(--preview-primary) / 0.2), hsl(var(--preview-primary) / 0.1))`,
                  color: "hsl(var(--preview-primary))",
                }}
              >
                <Icon icon={Wallet} className="size-4" />
              </div>
              <div>
                <p className="font-semibold">
                  {t("settings.theme.preview.totalBalance")}
                </p>
                <p className="text-sm text-muted-foreground">$12,450.00</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Icon
                icon={TrendingUp}
                className="size-4"
                style={{ color: "hsl(var(--preview-primary))" }}
              />
              <span
                className="font-medium"
                style={{ color: "hsl(var(--preview-primary))" }}
              >
                +12.5%
              </span>
              <span className="text-muted-foreground">
                {t("settings.theme.preview.fromLastMonth")}
              </span>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="flex size-8 items-center justify-center rounded-lg"
                style={{
                  background: `linear-gradient(to bottom right, hsl(var(--preview-secondary) / 0.2), hsl(var(--preview-secondary) / 0.1))`,
                  color: "hsl(var(--preview-secondary-foreground))",
                }}
              >
                <Icon icon={Sparkles} className="size-4" />
              </div>
              <div>
                <p className="font-semibold">
                  {t("settings.theme.preview.goalsProgress")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.theme.preview.completed")}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    i <= 3 ? "" : "bg-muted",
                  )}
                  style={
                    i <= 3
                      ? {
                          background: `linear-gradient(to right, hsl(var(--preview-primary)), hsl(var(--preview-primary) / 0.8))`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Form Elements */}
      <div className="space-y-3">
        <FormLabel>{t("settings.theme.preview.sectionFormElements")}</FormLabel>
        <div className="space-y-3">
          <Input placeholder={t("settings.theme.preview.emailPlaceholder")} />
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon icon={Settings} className="size-4" />
                <span>{t("settings.theme.preview.settingOption")}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("settings.theme.preview.toggleDescription")}
              </p>
            </div>
            <Switch checked={false} />
          </div>
        </div>
      </div>

      {/* Badges & Tags */}
      <div className="space-y-3">
        <FormLabel>{t("settings.theme.preview.sectionBadges")}</FormLabel>
        <div className="flex flex-wrap gap-2">
          <Badge>{t("settings.theme.preview.badgeDefault")}</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge className="bg-primary text-primary-foreground">Primary</Badge>
          <Badge className="bg-secondary text-secondary-foreground">
            {t("settings.theme.preview.badgeCustom")}
          </Badge>
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="space-y-3">
        <FormLabel>{t("settings.theme.preview.sectionInteractive")}</FormLabel>
        <div className="flex flex-wrap gap-3">
          <Button size="icon" variant="outline">
            <Icon icon={Sparkles} className="size-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <Icon icon={Zap} className="size-4" />
          </Button>
          <Button size="icon">
            <Icon icon={Check} className="size-4" />
          </Button>
          <Button size="icon" variant="secondary">
            <Icon icon={Calendar} className="size-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Preview */}
      <div className="space-y-3">
        <FormLabel>{t("settings.theme.preview.sectionNavigation")}</FormLabel>
        <Card className="p-3">
          <div
            className="flex items-center gap-2 rounded-lg p-2 text-primary-foreground"
            style={{
              background: `linear-gradient(to bottom right, hsl(var(--preview-primary) / 0.2), hsl(var(--preview-primary) / 0.1))`,
              color: "hsl(var(--preview-primary))",
            }}
          >
            <Icon icon={User} className="size-4" />
            <span className="text-sm font-medium">
              {t("settings.theme.preview.activeNavItem")}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-muted/40">
            <Icon icon={Settings} className="size-4" />
            <span className="text-sm">
              {t("settings.theme.preview.inactiveNavItem")}
            </span>
          </div>
        </Card>
      </div>

      {/* Color Palette Display */}
      <div className="space-y-3">
        <FormLabel>{t("settings.theme.preview.sectionPalette")}</FormLabel>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <div
              className="h-16 rounded-lg shadow-md"
              style={{
                background: `linear-gradient(to bottom right, hsl(var(--preview-primary)), hsl(var(--preview-primary) / 0.8))`,
              }}
            />
            <p className="text-xs text-center font-medium">
              {t("settings.theme.primary")}
            </p>
          </div>
          <div className="space-y-2">
            <div
              className="h-16 rounded-lg shadow-md"
              style={{
                background: `linear-gradient(to bottom right, hsl(var(--preview-secondary)), hsl(var(--preview-secondary) / 0.8))`,
              }}
            />
            <p className="text-xs text-center font-medium">
              {t("settings.theme.secondary")}
            </p>
          </div>
          <div className="space-y-2">
            <div
              className="h-16 rounded-lg shadow-md"
              style={{
                background: `linear-gradient(to bottom right, hsl(var(--preview-accent)), hsl(var(--preview-accent) / 0.8))`,
              }}
            />
            <p className="text-xs text-center font-medium">
              {t("settings.theme.accent")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
