"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/shared";
import {
  Check,
  Sparkles,
  Zap,
  Settings,
  TrendingUp,
  Wallet,
  Calendar,
  User,
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
        <h3 className="text-lg font-semibold">Theme Preview</h3>
      </div>

      {/* Buttons Section */}
      <div className="space-y-3">
        <FormLabel>Buttons</FormLabel>
        <div className="flex flex-wrap gap-3">
          <Button
            style={{
              background: `linear-gradient(to right, hsl(var(--preview-primary)), hsl(var(--preview-primary) / 0.9))`,
              color: "hsl(var(--preview-primary-foreground))",
            }}
          >
            Primary Button
          </Button>
          <Button
            variant="secondary"
            style={{
              background: `linear-gradient(to right, hsl(var(--preview-secondary)), hsl(var(--preview-secondary) / 0.9))`,
              color: "hsl(var(--preview-secondary-foreground))",
            }}
          >
            Secondary
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button
            variant="link"
            style={{ color: "hsl(var(--preview-primary))" }}
          >
            Link
          </Button>
        </div>
      </div>

      {/* Cards Section */}
      <div className="space-y-3">
        <FormLabel>Cards & Containers</FormLabel>
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
                <p className="font-semibold">Total Balance</p>
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
              <span className="text-muted-foreground">from last month</span>
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
                <p className="font-semibold">Goals Progress</p>
                <p className="text-sm text-muted-foreground">
                  3 of 5 completed
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
        <FormLabel>Form Elements</FormLabel>
        <div className="space-y-3">
          <Input placeholder="Email address" />
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon icon={Settings} className="size-4" />
                <span>Setting option</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This is how toggle switches look
              </p>
            </div>
            <Switch checked={false} />
          </div>
        </div>
      </div>

      {/* Badges & Tags */}
      <div className="space-y-3">
        <FormLabel>Badges & Tags</FormLabel>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge className="bg-primary text-primary-foreground">Primary</Badge>
          <Badge className="bg-secondary text-secondary-foreground">
            Custom
          </Badge>
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="space-y-3">
        <FormLabel>Interactive Elements</FormLabel>
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
        <FormLabel>Navigation</FormLabel>
        <Card className="p-3">
          <div
            className="flex items-center gap-2 rounded-lg p-2 text-primary-foreground"
            style={{
              background: `linear-gradient(to bottom right, hsl(var(--preview-primary) / 0.2), hsl(var(--preview-primary) / 0.1))`,
              color: "hsl(var(--preview-primary))",
            }}
          >
            <Icon icon={User} className="size-4" />
            <span className="text-sm font-medium">Active Navigation Item</span>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-muted/40">
            <Icon icon={Settings} className="size-4" />
            <span className="text-sm">Inactive Item</span>
          </div>
        </Card>
      </div>

      {/* Color Palette Display */}
      <div className="space-y-3">
        <FormLabel>Current Color Palette</FormLabel>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <div
              className="h-16 rounded-lg shadow-md"
              style={{
                background: `linear-gradient(to bottom right, hsl(var(--preview-primary)), hsl(var(--preview-primary) / 0.8))`,
              }}
            />
            <p className="text-xs text-center font-medium">Primary</p>
          </div>
          <div className="space-y-2">
            <div
              className="h-16 rounded-lg shadow-md"
              style={{
                background: `linear-gradient(to bottom right, hsl(var(--preview-secondary)), hsl(var(--preview-secondary) / 0.8))`,
              }}
            />
            <p className="text-xs text-center font-medium">Secondary</p>
          </div>
          <div className="space-y-2">
            <div
              className="h-16 rounded-lg shadow-md"
              style={{
                background: `linear-gradient(to bottom right, hsl(var(--preview-accent)), hsl(var(--preview-accent) / 0.8))`,
              }}
            />
            <p className="text-xs text-center font-medium">Accent</p>
          </div>
        </div>
      </div>
    </div>
  );
}
